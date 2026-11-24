/**
 * Panel export — PNG raster + a dependency-free PDF writer.
 *
 * The canvas is one self-contained SVG (gradients/filters live in its own
 * <defs>, art uses presentation attributes), so we inline the few remaining
 * CSS-driven properties from getComputedStyle, rasterise via an off-screen
 * canvas, then either save the PNG or wrap the pixels in a minimal PDF
 * (DCTDecode/JPEG XObject — no libraries, works offline in Electron too).
 */

/** CSS properties worth copying onto the cloned SVG for offline rendering */
const STYLE_WHITELIST = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "fill-opacity",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "text-anchor",
  "dominant-baseline",
  "filter",
  "visibility",
  "paint-order",
] as const;

function inlineComputedStyles(source: SVGSVGElement, clone: SVGSVGElement) {
  const a = source.querySelectorAll("*");
  const b = clone.querySelectorAll("*");
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const cs = getComputedStyle(a[i] as Element);
    const t = b[i] as SVGElement;
    for (const prop of STYLE_WHITELIST) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== "none" && v !== "normal") t.style.setProperty(prop, v);
    }
  }
}

async function rasterise(svg: SVGSVGElement, scale: number): Promise<HTMLCanvasElement> {
  const rect = svg.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svg, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG rasterise failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d unavailable");
    const bg = getComputedStyle(svg).backgroundColor;
    ctx.fillStyle = !bg || bg === "rgba(0, 0, 0, 0)" ? "#ffffff" : bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function safeName(projectName: string): string {
  return (projectName || "panel").replace(/[^\w\- ]+/g, "").trim() || "panel";
}

function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Minimal single-page PDF wrapping a JPEG bitstream (ISO 32000-1, DCTDecode). */
export function buildPdfFromJpeg(jpeg: Uint8Array, pxW: number, pxH: number): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? enc.encode(data) : data;
    chunks.push(bytes);
    pos += bytes.length;
  };
  const obj = (n: number, body: string, stream?: Uint8Array) => {
    offsets[n] = pos;
    push(`${n} 0 obj\n${body}\n`);
    if (stream) {
      push("stream\n");
      push(stream);
      push("\nendstream\n");
    }
    push("endobj\n");
  };

  push("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pxW} ${pxH}] ` +
      "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>",
  );
  const content = enc.encode(`q\n${pxW} 0 0 ${pxH} 0 0 cm\n/Im0 Do\nQ\n`);
  obj(4, `<< /Length ${content.length} >>`, content);
  obj(
    5,
    `<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,
    jpeg,
  );

  const xrefPos = pos;
  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  push(xref);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

export async function exportPanelPng(svg: SVGSVGElement, projectName: string): Promise<void> {
  const canvas = await rasterise(svg, 2);
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))), "image/png"),
  );
  download(blob, `${safeName(projectName)}.png`);
}

export async function exportPanelPdf(svg: SVGSVGElement, projectName: string): Promise<void> {
  const canvas = await rasterise(svg, 2);
  const jpegBlob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))), "image/jpeg", 0.92),
  );
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdf = buildPdfFromJpeg(jpeg, canvas.width, canvas.height);
  download(new Blob([pdf as BlobPart], { type: "application/pdf" }), `${safeName(projectName)}.pdf`);
}
