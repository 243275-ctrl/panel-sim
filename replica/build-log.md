# Build log — panel-sim

## 2026-11-24 — M0 vertical slice

**Screens**

| ID | state | what's missing |
| --- | --- | --- |
| S01 start | done | — (New blank + Load example) |
| S02 editor canvas | partial | pan/zoom, undo/redo, save/open, full library (M1) |
| S05 simulation | partial | full nodal solver, richer faults (M2); Run/Stop/Reset + hold-to-close work |

**Done**

- Shell: titlebar (chrome), toolbar, library/properties panels, status bar;
  tokens.css wired end to end (no raw hex in components).
- Canvas: 20 px snap grid, place with ghost, two-click terminal wiring with
  preview, select (device + wire), Del/Esc/W/V keys, own schematic symbols
  (DC source, NO push button, pilot light), selection ring, `live`-token
  animated wires while current flows.
- Solver: pure TS single-loop DC (union-find; a source never bridges its own
  terminals). Faults: dangling terminal, no source, multiple sources, short
  circuit. **7/7 vitest tests pass.**
- Sim UX: Run → hold S1 → H1 lights, wires animate; fault banner while
  running; Stop/Reset clear held buttons.
- Verified: `tsc --noEmit` clean, `vite build` ok (241 kB JS), vitest 7/7.

**Harder than it looked**

- The "closed loop" check: a first cut unioned the source's own terminals,
  so every circuit read as closed. Fixed in solver (source excluded from
  self-bridging) and pinned by tests.
- Dangling-terminal faults fire per terminal — noisy on a blank project;
  acceptable for M0, will group by device later.

**Deviations (honest)**

- `replica/clone-screens/*.png` screenshots not captured: sandbox has no
  display/browser. Capture at first desktop run — required before
  replica-diff scoring.
- Styling is plain CSS on token vars; the Tailwind mapping from
  replica-design stays ready in `replica/design/tailwind.config.example.js`.
- Electron is an optional dependency: the launcher is installed here but the
  platform binary download was skipped in the sandbox (no display anyway).
  `npm install` on a desktop machine + `npm run electron` runs the real shell.
- Library search disabled until the full library (M1).

**Next:** M1 — full device library with own SVG art, properties forms, save /
open `.psim`, undo/redo, pan/zoom.

## 2026-11-24 — M1 editor

**Decision recorded:** every part of the app is **free** — no Pro tier, no
locked tiles, no license server (features.csv gating row → skip;
architecture payments row → "none — ever").

**Screens**

| ID | state | what's missing |
| --- | --- | --- |
| S01 start | done | — |
| S02 editor canvas | partial | copy/paste; drag-to-move of placed devices (rotate/mirror/pan/zoom done) |
| S03 library | partial | 15 of 45+ types; full pictorial art; search + categories done |
| S04 properties | done | — (name, voltage, resistance, motor 6/9/12, rotate/mirror) |
| S05 simulation | partial | same as M0 (M2 = nodal solver) |
| S09 save/open | partial | download + file-open work; native OS dialogs need the desktop shell |

**Done**

- Undo/redo (Ctrl+Z / Ctrl+Y, 100-step history on document changes only).
- Rotate 90° (R) / mirror (M) with terminal positions rotated correctly.
- Pan (drag) + zoom (wheel, 35–300%) with cursor-anchored scaling.
- `.psim` v1: versioned JSON, fail-closed validation (6 tests: bad JSON,
  dangling wire, duplicate id, bad rot, bad motor connection, round trip).
- Library: 15 device types in 7 categories with working search; all free.
- Solver: resistors now act as loads (V/R); unmodelled types refuse to close
  a loop and say "model arrives in a later milestone".
- Verified: **15/15 vitest**, `tsc` clean, `vite build` ok.

**Harder than it looked**

- Rotation: terminals must land exactly on grid after 90° turns — integer
  rotation table instead of trig (floating point broke snapping).
- History: only document-changing actions push undo steps (wire-preview
  clicks and run/stop must not pollute the stack) — decided by comparing
  device/wire/project references after each action.

**Still missing (carried):** clone-screens screenshots (no display in
sandbox), copy/paste, native file dialogs, drag-move.

**Next:** M2 — full nodal DC solver (multiple sources, ground, parallel
branches), then M3 motors + control.

## 2026-11-24 — Windows packaging

- `npm run package:win` builds a real **PanelSim.exe** (Electron 41, x64) —
  verified: PE32+ GUI executable, asar contains dist/ + electron/ + package.json.
- Local NSIS installer step needs `wine` (unavailable in sandbox) — falls
  back to the portable zip, and `.github/workflows/windows-release.yml`
  builds the native installer on `windows-latest` (triggered by tag `v*`).
- Icon: `build/icon.ico` drawn with PIL (our own art, chrome + live bolt).
- `vite base: "./"` for file:// loading; CSP meta removed (Electron
  webPreferences provide isolation: contextIsolation + sandbox).

## M1b — Visual parity & complete parts library (2026-11-24)
- **All 55 device types** wired through store/psim/solver/canvas/chrome from a single
  `src/data/library.ts` registry (12 categories: power, control, indicators, switching,
  protection, passives, motors, drives, instruments, sensors, automation, connection).
  Every type is free forever — no tiers, no locked parts (user directive).
- **Own pictorial artwork** `src/art/Pictorial.tsx`: 55 parametric SVG drawings
  (contactor with screws, breaker with toggle + C16 marking, VFD with LCD + keypad,
  motor with fins, e-stop mushroom, pilot lights with glow, DIN-mounted PLC…).
  Wire tabs share a strict (±30, 0) contract with the canvas. No asset from any
  third-party product was copied (ToS §2 of the target product forbids it; we draw our own).
- **Properties → Terminals list**: per-device rows (number, semantic label from the
  library registry, connected end or open) with the target's green connected styling.
- **Panel board backdrop**: generic grey enclosure + two screwed DIN rails behind the
  workspace — matches the pictorial look without copying their art.
- Solver: `lamp-amber` lights like `lamp`; `button-nc` conducts unless held;
  unmodelled-part faults only fire for devices that are actually wired.
- Verified: tsc clean · vitest **15/15** · vite build OK. Multi-terminal devices
  (breakers 3p+, PLC I/O) still use the 2-terminal wiring model until M3.

## M2 — Nodal solver: real voltage & current readings (2026-11-24)
- **`src/solver/mna.ts`** — Modified Nodal Analysis (DC): node graph from wires +
  ideal shorts (fuses/breakers/inductor/ground/closed switches), resistive stamps
  (loads + instruments), voltage-source branch currents (DC/AC-RMS/battery/generator
  defaults 24/230/400 V), Gaussian elimination with partial pivoting. Singular
  systems (e.g. parallel ideal sources) report a clean fault instead of NaN.
- **Modelled types now 35/55**: sources, ground, all switches (NO/NC/estop/selector/
  keyswitch/2-way), lamps, resistors, buzzer/beacon, protective shorts (fuse, QF, MCCB,
  FSP, RCCB, FR), passives (R/C/L/pot/NTC), instruments (V/A/multimeter/clamp —
  1 MΩ voltmeter, 1 mΩ ammeter), connection hardware. Remaining 20 (motors, drives,
  PLC I/O, contactor coils, transformers, sensors) → M3/M4.
- **Short-circuit guard**: loop with zero/near-zero resistance → fault, no Infinity.
- **UI**: properties show a **Live** row (V · mA/A) for the selected device; meter
  faces display their reading (needle sweeps on V/A meters); status bar shows source
  current + loop state; library tiles badge "simulated now" from real model flags.
- Verified: **vitest 25/25** (9 loop + 10 nodal + 6 file), tsc clean, vite build OK.
  Known limit: DC/RMS phasor-free model — AC shown as RMS magnitude; motors/coils M3.

## M1b-polish — Pictorial art v2: material system (2026-11-24)
- User rated first art pass at **60%** quality — full rework of `src/art/Pictorial.tsx`:
  shared **material system** (12 gradients: brushed metal, body/face plastic, dark
  housing, red/green/amber/blue/copper, LCD, three lens radials, gloss) + **filters**
  (drop shadows ×2 scales, lamp glow), unified top-left light direction.
- Detail pass on all 55 types: cross-slot screws, bevelled enclosures with gloss/shade
  edges, recessed breaker toggles with red rockers, contactor terminal banks + coil
  window, motor fins/flange/shaft/fan cover, VFD LCD glow + individual keypad caps,
  meter glass-streak + needle sweep, PLC LED glow + terminal cavities, nameplates,
  vents, DIN clips. Ground gained metal entry stubs so wires land on metal.
- **New `art.test.tsx`**: renders all 55 types server-side (no empty/undefined/NaN
  art), pins the ±30 terminal geometry contract, lamp glow + meter readouts, shadow
  presence on enclosure types. vitest include widened to `*.test.{ts,tsx}`.
- Verified: **vitest 29/29** (25 + 4 art), tsc clean, vite build OK.

## M3 — Professional sim: PLC programming, VFD, sensors (2026-11-24)
- **Multi-terminal wiring**: terminals are now `number` with per-type labels —
  PLC exposes **10 terminals** (L+, M, I0.0–I0.3 top, Q0.0–Q0.3 bottom), VFD **6**
  (motor out U/W on the sides, mains L/N top, DI1/COM bottom). Art, hit-testing,
  terminalPos layout, properties list and `.psim` validation all share the count.
- **Ladder programming**: `solver/ladder.ts` — rungs of OR-branches + series tail +
  coil (DOL seal-in shapes), tags I0.x/Q0.x/M0–M7, two evaluation passes per scan,
  unknown tags fail safe. New **▤ Program editor** (add rung/branch/contact, NO↔NC,
  tag selects, live TRUE highlighting, comments) stored inside `.psim`.
- **Scan cycle**: store `tick` every 150 ms while running → MNA → input image from
  DI terminal voltages (>12 V) → `evalLadder` → output image → next solve.
  Outputs drop to safe state on Stop; scan counter in the status bar.
- **MNA upgrade**: per-terminal voltages `tv[]`; PLC stamps (pwr R, 10 k DI sinks,
  sourcing 24 V DO channels); VFD stamps (V/f output E=400·f/50, line-side R,
  DI sense); Gaussian now handles isolated nodes as free variables (unwired Q
  terminals) and still rejects inconsistent systems (conflicting sources).
- **Settling loop**: contactor/relay coil >12 V → linked `grp` aux contacts switch
  (NO closes / NC opens); VFD run = panel OR DI1>12 V; iterate MNA↔states ≤5 until
  stable — sensors (prox/photo/pressure/level) change topology from their params.
- **Models added**: motors (load + rpm label + spin), coils as loads, contactors/
  relays/aux/changeover, all four sensors, PLC, VFD → 49/55 types modelled.
- **UI**: PLC properties with I/O LED grid + scan count; VFD operator panel
  (run/stop, fwd/rev, 0–120 Hz slider); sensor process controls; group-link
  selector; third start example **"PLC demo — sensor → ladder → contactor → motor"**.
- Verified: **vitest 38/38** (incl. end-to-end demo seal-in test + VFD test),
  tsc clean, vite build OK, live dev server 200s. Honest limits: no timers/
  analog scaling/safety blocks yet (M4), VFD modelled as V/f source (no fault
  diagnostics), star-delta templates pending.

## M4 — Timers, templates, Pt100 (2026-11-24)
- **TON timers T0–T3** in the ladder: preset on the rung (seconds, editor field
  appears when the coil is a timer), accumulated in `PlcIO.timers` once per scan
  (dt = 150 ms live, injectable in tests), instant reset when the rung drops.
  Timer contacts resolve against the owning rung's preset; second eval pass no
  longer double-counts time.
- **Templates** (start screen): **timed sequence** (stage 1 lamp + seal-in → T0
  3 s → stage 2 contactor → motor) and **flasher** (T0 ↔ M0 oscillation driving
  Q0.0 beacon at ~1 Hz). Both wired end-to-end and pinned by integration tests.
- **Pt100 modelled** on the standard curve R = 100·(1+0.00385·t) with a temp
  slider; series/divider wiring gives live readings (tests: 138.5 Ω @100 °C).
- Stop now clears timer accumulators via fresh `emptyIO()`; `.psim` unchanged
  (program/presets already persisted; runtime timer state is not).
- Verified: **vitest 46/46** (7 files), tsc clean, vite build OK, live server 200s.
- Honest limits kept: star-delta needs multi-terminal 3-phase hardware (not
  faked), 4–20 mA full loops & safety relay blocks remain roadmap, no VFD fault
  diagnostics.

## M4b — Export (PNG/PDF) + overload protection + render fix (2026-11-24)
- **Export toolbar**: 🖼 PNG (2× raster) and 📄 PDF. Pipeline: clone the canvas
  SVG → inline `getComputedStyle` whitelist (grid/art already use presentation
  attrs + in-document defs) → off-screen canvas → PNG, or JPEG → **hand-rolled
  single-page PDF** (Catalog/Pages/Page/Image XObject, DCTDecode, byte-accurate
  xref — zero dependencies, offline-safe in Electron). Pure PDF writer pinned by
  a structural test (header, xref offsets, stream bytes).
- **Thermal overload protection**: overload was a dumb wire — now a 1 mΩ shunt
  (readable current, negligible drop) with trip rating property (0.1–16 A).
  Each store tick measures live |I|; over-rating latches `tripped[id]` → solver
  opens that device everywhere (stamps, bridges, readings i=0, voltage still
  shown), UI shows **TRIP** badge + properties Reset button; global Reset
  clears. Trips flow through scanPlc so PLC logic sees the real circuit.
- **Render bug fixed**: Canvas/StatusBar/Properties `simulate()` calls were
  missing `plcOut` — the UI never showed PLC DO power (tests passed, screen
  didn't). All three sites now pass `{plcOut, tripped}`.
- Verified: **vitest 50/50** (9 files), tsc clean, vite build OK, live 200s.

## Entrepreneurs + Brand (2026-11-24)
- **Entrepreneur (replica-entrepreneur):** public-review research honest —
  **0 reviews found** (MS Store says "There aren't any reviews yet"; no
  Play/Reddit/HN/G2/Capterra presence; unrelated same-name apps excluded).
  `reviews.csv` header-only; `reviews.py` refused empty input as designed;
  `feedback.md` records sample size + checked sources; `fixes.md` grounds the
  fix plan only in store facts [F], the commissioner brief [B] and parity
  gaps [P]. Two `features.csv` rows added (original=no): full offline (no
  license server), all devices free forever. Angle A recommended: "free
  forever, offline, professional".
- **Brand (replica-brand):**20→5 name candidates with run/to-run checks —
  LadderLab rejected (ladderlab.dev, same category), Voltiq rejected (4+
  live collisions); **PanelSim kept** (dissimilar to the original, no
  same-category exact hit; domain/TM checks marked to run — no whois here).
  Palette swapped: accent `#2f5bea` → `#6d28d9` violet-700 (different hue
  family from original navy/sky `#1a3a6b`/`#0ea5e9`); contrast.py **0 AA
  failures (accent AAA 7.10:1)**. Logo brief + voice guide in brand.md;
  chrome title + index.html title now "PanelSim". Sweep with
  brand.json (name/domain/4 colours): **Clean** (exit0).

## Launch phase (2026-11-24)
- **pricing.md**: $0 forever, everything included — no Stripe by standing
  rule; internal-only comparison (vendor facts dated2026-11-24).
- **Landing page** `docs/index.html` (GitHub Pages-ready, self-contained:
  no CDN/fonts, violet brand, real screenshots only, no fake proof, no
  original name). Sections: hero(angle A) → problem → how it works →
  features → pricing → FAQ → CTA.
- **Screenshots**: Playwright chromium (deps installed via
  `playwright install-deps`) → `docs/assets/shot-{start,demo,landing}.png`
  (real captures: PLC demo running with live scan counter, ladder editor).
  Script: `scripts/screenshot.mjs`; playwright added as devDependency.
- **listing.json** (App Store + Play copy, reusable for MS Store text) →
  `listing.py`: **0 errors, 0 warnings** after trimming keywords to98/100
  and short description to67/80, removing "free" claims from short fields.
- **launch-plan.md**: channels (GitHub Releases live; Pages pending user's
  go; Store = user's account step), audience map, first-10 conversations,
  no-telemetry stance, honest metrics.
- **Preflight (all green)**: sweep clean · listing0/0 · parity exit0 ·
  tsc clean · vitest 50/50 · vite build OK.

## Art v3 — realistic relative sizes (2026-11-25)
- User check: "sizes must be realistic — battery was smaller than the relay".
  Full55-type audit against real-world size ladder
  (`replica/design/real-sizes.md`):16 geometry edits.
- Battery → wide 56×32 block (now widest non-motor); relay shrunk to cube
  30×36; transformer enlarged 46×46; DC/AC sources raised to PSU height
  40×48 (taller than contactor, as real DIN PSUs are); breaker-1p slimmed to
  20 w (18 mm pole); SPD slimmed 21 w; protection heights normalised to 46
  (overload/rccb/mccb/breaker-3p); overload RESET label moved inside the
  button; prox/photo barrel lengthened (M12×60); generator enlarged; panel
  meter faces grown to Ø44; **ground got a faceplate chassis** (was a bare
  symbol — clarity win).
- Verified: tsc clean, vitest **50/50** (geometry contract holds — tabs still
  ±30), vite build OK, before/after sheets in replica/design/.

## Stone-polisher integration — option ج (2026-11-25)
- User's own Unity program (github.com/243275-ctrl/stone-polisher-simulator)
  supplies device drawings; choice ج = recolor theirs (vs أ direct import /
  ب redraw ourselves). Pipeline committed as
  `scripts/recolor-stone-icons.py`: crop card (drops baked terminal stubs),
  flood-fill background → transparent, nearest-color remap to our palette
  (15 pairs → C tokens + brand accent), header retext for the shared sensor
  art (STONE / FLOW / THICKNESS in white on the band).
- **15 icons** in `src/art/icons/` (207×223, 1.3–1.9 KB each) imported with
  vite `?inline` data URIs so the SVG→PNG exporter embeds them cleanly
  (verified: base64 free of NaN/undefined for the art.test contract).
- **Library 55 → 63**: +8 unique types from their program —
  three-phase-supply (Power), digital/ analog input+output ×4 (Automation),
  stone / water-flow / thickness sensors (Sensors). All honest `sim:false`
  (deferred like plc-expansion/transformers) — wiring them yields the
  "simulation model arrives in a later milestone" fault, not fake physics.
  Prefixes PS/DI/DO/AI/AO/SC/FS/TS (no collisions).
- **7 covered types** now wear recolored cards: DC source (POWER 24V),
  push buttons NO/NC (START/STOP), E-stop, control relay, overload (THERMAL),
  terminal block (TERMINAL). Shadow-bound five (contactor, breaker-1p,
  motor, vfd, plc) + lamp/meter stay on our SVG — tests bind them.
- Sizes follow the real-sizes ladder: cards 30–47 tall, below battery/motor.
- Verified: tsc clean · vitest **50/50** (63-type contract) · vite build ·
  art sheet regenerated (`replica/design/art-sheet-after.png`) · parity exit 0.
