#!/usr/bin/env python3
"""Recolor stone-polisher-simulator icons into PanelSim's palette.

Source: the user's own repo (github.com/243275-ctrl/stone-polisher-simulator),
Assets/Resources/WiringComponents/*.png — cloned at:
  /home/user/stone-polisher-simulator

Pipeline per icon:
  1. crop to the card body (drops the baked side-terminal stubs — our SVG Tab
     provides the wire contract at ±30,0)
  2. flood-fill the flat background from the borders -> transparent
  3. optional header retext (sensor card shared by 6 files gets a distinct
     label per type: STONE / FLOW / THICKNESS)
  4. recolor: nearest source key within distance 110 -> our palette target
     (anti-aliased blends follow their nearest flat)

Outputs land in src/art/icons/*.png and are imported with vite `?inline`
(data URIs) so the SVG rasterizer in canvas/export.ts can embed them.

Usage:  python3 scripts/recolor-stone-icons.py
"""

from collections import deque
import os

from PIL import Image, ImageDraw, ImageFont
import numpy as np

SRC = "/home/user/stone-polisher-simulator/Assets/Resources/WiringComponents"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "art", "icons")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# their flat palette -> PanelSim C tokens (src/art/Pictorial.tsx)
PAIRS = [
    ((0x4B, 0x55, 0x60), (0x3D, 0x48, 0x52)),  # card body  -> C.dark
    ((0x19, 0x1E, 0x23), (0x22, 0x26, 0x2A)),  # outline   -> C.black
    ((0x1E, 0x23, 0x28), (0x2D, 0x33, 0x39)),  # outline 2 -> C.darker
    ((0xF5, 0xF7, 0xF9), (0xF4, 0xF6, 0xF8)),  # face/bg   -> C.face
    ((0xBE, 0xC3, 0xC6), (0xC2, 0xC9, 0xD0)),  # metal     -> C.metal
    ((0xAA, 0xAF, 0xB4), (0xAA, 0xB4, 0xBD)),  # metal 2   -> C.metal2
    ((0x8C, 0x96, 0x9B), (0xAA, 0xB4, 0xBD)),  # mid grey
    ((0x2D, 0x37, 0x3C), (0x2D, 0x33, 0x39)),  # dark grey -> C.darker
    ((0xCD, 0x91, 0x1E), (0xE8, 0xA3, 0x3D)),  # amber     -> C.amber
    ((0x2D, 0x73, 0xB4), (0x2B, 0x6C, 0xB0)),  # blue      -> C.blue
    ((0x87, 0x4B, 0xAA), (0x6D, 0x28, 0xD9)),  # purple    -> brand accent
    ((0x23, 0x96, 0x96), (0x2F, 0x9E, 0x5F)),  # teal      -> C.green
    ((0x2D, 0x96, 0x5A), (0x2F, 0x9E, 0x5F)),  # green     -> C.green
    ((0xC3, 0x37, 0x2D), (0xD6, 0x45, 0x45)),  # red       -> C.red
    ((0xFF, 0xFF, 0xFF), (0xFF, 0xFF, 0xFF)),  # white text stays
]
SRC_ARR = np.array([p[0] for p in PAIRS], dtype=np.int32)
DST_ARR = np.array([p[1] for p in PAIRS], dtype=np.uint8)

# (source file, output name, header retext or None)
JOBS = [
    # --- new device types (unique to their program) ---
    ("three-phase-supply.png", "three-phase-supply.png", None),
    ("digital-input.png", "digital-input.png", None),
    ("digital-output.png", "digital-output.png", None),
    ("analog-input.png", "analog-input.png", None),
    ("analog-output.png", "analog-output.png", None),
    ("stone-sensor.png", "stone-sensor.png", "STONE"),
    ("stone-sensor.png", "water-flow-sensor.png", "FLOW"),
    ("stone-sensor.png", "thickness-sensor.png", "THICKNESS"),
    # --- covered types: recolored card replaces our SVG (tests keep the
    #     shadow-bound five + lamp/meter on our own art) ---
    ("relay.png", "relay.png", None),
    ("start-button.png", "button.png", None),
    ("stop-button.png", "button-nc.png", None),
    ("emergency-stop.png", "estop.png", None),
    ("power-supply-24v.png", "source.png", None),
    ("terminal-blocks.png", "terminal-block.png", None),
    ("overload-relay.png", "overload.png", None),
]


def flood_background(arr: np.ndarray) -> np.ndarray:
    """Make the flat outer background transparent (flood from the borders)."""
    h, w = arr.shape[:2]
    near_white = (
        np.abs(arr[..., :3].astype(np.int32) - np.array([245, 247, 249])).sum(axis=-1) < 40
    ) & (arr[..., 3] > 0)
    vis = np.zeros((h, w), dtype=bool)
    dq = deque()
    for xx in range(w):
        for yy in (0, h - 1):
            if near_white[yy, xx] and not vis[yy, xx]:
                vis[yy, xx] = True
                dq.append((yy, xx))
    for yy in range(h):
        for xx in (0, w - 1):
            if near_white[yy, xx] and not vis[yy, xx]:
                vis[yy, xx] = True
                dq.append((yy, xx))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and not vis[ny, nx] and near_white[ny, nx]:
                vis[ny, nx] = True
                dq.append((ny, nx))
    arr[vis, 3] = 0
    return arr


def retext_header(arr: np.ndarray, retext: str) -> np.ndarray:
    """Replace the header label; kills the old glyphs incl. AA fringe."""
    h = arr.shape[0]
    limit = int(h * 0.40)
    top = arr[:limit]
    op = top[..., 3] > 100
    cols = top[..., :3][op].astype(np.int32)
    sat = cols.max(axis=1) - cols.min(axis=1)
    accent = np.median(cols[sat > 60], axis=0).astype(np.int32)

    m_acc = (
        np.abs(arr[..., :3].astype(np.int32) - accent).sum(axis=-1) < 60
    ) & (arr[..., 3] > 100)
    rowcnt = m_acc[:limit].sum(axis=1)
    hdr_rows = np.where(rowcnt > 0.6 * arr.shape[1])[0]
    hy0, hy1 = int(hdr_rows.min()), int(hdr_rows.max())
    colidx = np.where(m_acc[hy0 : hy1 + 1].any(axis=0))[0]
    hx0, hx1 = int(colidx.min()), int(colidx.max())

    band = arr[hy0 : hy1 + 1, hx0 : hx1 + 1].copy()
    not_acc = np.abs(band[..., :3].astype(np.int32) - accent).sum(axis=-1) > 70
    band[not_acc, :3] = accent.astype(np.uint8)
    arr[hy0 : hy1 + 1, hx0 : hx1 + 1] = band

    bh = hy1 - hy0 + 1
    fsize = max(12, int(round(bh * 0.62 / 0.729)))
    font = ImageFont.truetype(FONT, fsize)
    img = Image.fromarray(arr)
    d = ImageDraw.Draw(img)
    bb = d.textbbox((0, 0), retext, font=font)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    tx = (hx0 + hx1) / 2 - tw / 2 - bb[0]
    ty = (hy0 + bh / 2 - th / 2) - bb[1]
    d.text((tx, ty), retext, font=font, fill=(255, 255, 255, 255))
    return np.array(img)


def process(src_file: str, out_name: str, retext: str | None) -> None:
    im = Image.open(os.path.join(SRC, src_file)).convert("RGBA")
    a = np.array(im)
    rgb = a[..., :3].astype(np.int32)
    card = np.abs(rgb - np.array([0x4B, 0x55, 0x60])).sum(axis=-1) < 45
    ys, xs = np.where(card)
    x0, x1 = max(xs.min() - 3, 0), min(xs.max() + 4, 256)
    y0, y1 = max(ys.min() - 3, 0), min(ys.max() + 4, 256)
    arr = np.array(im.crop((x0, y0, x1, y1)))

    arr = flood_background(arr)
    if retext:
        arr = retext_header(arr, retext)

    m = arr[..., 3] > 0
    px = arr[..., :3].astype(np.int32)
    d2 = ((px[:, :, None, :] - SRC_ARR[None, None, :, :]) ** 2).sum(axis=-1)
    idx = d2.argmin(axis=-1)
    mind = np.sqrt(d2.min(axis=-1))
    repl = m & (mind < 110)
    arr[..., :3] = np.where(repl[:, :, None], DST_ARR[idx], arr[..., :3])

    out = Image.fromarray(arr)
    path = os.path.join(OUT, out_name)
    out.save(path, optimize=True)
    print(f"{out_name}: {out.size} {os.path.getsize(path)}B")


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    for src_file, out_name, retext in JOBS:
        process(src_file, out_name, retext)

    # sanity: data URIs must not contain test-hostile substrings
    import base64

    for _, out_name, _ in JOBS:
        b64 = base64.b64encode(open(os.path.join(OUT, out_name), "rb").read()).decode()
        assert "NaN" not in b64 and "undefined" not in b64, out_name
    print(f"done: {len(JOBS)} icons, base64 clean")


if __name__ == "__main__":
    main()
