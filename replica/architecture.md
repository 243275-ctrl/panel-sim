# Architecture: panel-sim (a rebuild of EduVolt Designer's core features)

Platform: Windows 10/11 desktop (64-bit). Local-first, offline, no account
in v1. Sources: `replica/recon.md`, `replica/features.csv`.

## Stack

| layer | choice | why |
| --- | --- | --- |
| desktop shell | Electron (main process: TypeScript) | one language across shell + UI, mature packaging to NSIS/MSI, canvas-heavy UI is web-native; Tauri noted as smaller alternative but would split the codebase into Rust + TS for no v1 gain |
| UI | React + Vite + TypeScript | component model fits palette/canvas/dialogs; fast iteration; agent-writable |
| renderer | custom SVG scene (pan/zoom transforms, pointer events) | pictorial devices are our own SVG sprites; no heavy canvas lib needed at panel scale (hundreds of nodes) |
| solver | pure TypeScript module in a worker (vitest-tested) | deterministic, unit-testable in CI/Linux; WASM swap later only if profiling demands |
| storage | SQLite (better-sqlite3) for app data + versioned `.psim` JSON project files | offline, atomic saves (temp+rename), files stay human-debuggable and exportable |
| export | SVG→PNG (offscreen), PDF via print pipeline | Store feature: "export them to image or PDF" |
| i18n | i18next, EN/ES | Store lists English and Spanish |
| packaging | electron-builder → NSIS installer (+ portable exe), GitHub Actions `windows-latest` | builds the Windows artifact in CI; no local Windows box needed |
| payments | none in v1 | free tier first; later Pro via Lemon Squeezy/Paddle (VAT handled, fits a solo global seller) |
| backend | none in v1 | simulator is 100% local; a minimal license API appears only with Pro licensing (own design) |

One process model: main (file I/O, dialogs, export) + renderer (UI) + worker
(solver). No microservices, no cloud in v1.

## Schema

Tables (SQLite `app.db`): 3. Project entities (in `.psim` files): 8.
Access rules: local single-user app — filesystem permissions only; no RLS.
(When the license API lands: bearer-token checks per route.)

See `replica/schema.sql` for DDL and the `.psim` structure.

Hard constraints (from recon):
- wires reference existing devices/terminals — validated on load and save
  (referential checks inside the project document, fail-closed)
- unique device ids per project; atomic save via temp file + rename
- motor `connection` ∈ (6 | 9 | 12) validated against motor type in
  properties dialog and on load — wrong lead mapping must not simulate
- simulation runs on a fixed timestep with recorded seed/config → same
  project + same inputs = same waveform (determinism)
- schema_version on every project file; loader migrates old versions or
  refuses cleanly (recon: "projects from earlier versions open as before")

## API

Desktop IPC (Electron `ipcMain.handle`), renderer is the only caller:

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `project:new` | create empty project | local user | name | Project | F01 |
| `project:open` | open `.psim` (dialog or recent) | local user | path | Project | F05 |
| `project:save` | atomic save | local user | Project | {savedAt} | F05 |
| `project:export` | export image/PDF | local user | Project, {format, area} | file path | F05 |
| `device:place` | add device to canvas | local user | typeKey, x, y | Device | F01 |
| `device:update` | edit nameplate/params | local user | id, params | Device | F03 |
| `device:remove` | delete device (+ attached wires) | local user | id | ok | F01 |
| `wire:connect` | wire terminal→terminal | local user | from, to | Wire | F01 |
| `sim:run` / `sim:stop` / `sim:reset` | transport | local user | — | ack | F01–F03 |
| `sim:measure` | multimeter/clamp reading | local user | probes, mode | reading | F04 |
| `plc:download` (phase 2) | load ladder program | local user | program | ack | F06 |
| `vfd:setParam` (phase 2) | write VFD parameter | local user | deviceId, param, value | ack | F07 |
| `sim:tick` (event, main→renderer) | stream SimState to UI | — | — | SimState | all |
| `settings:get` / `settings:set` | app settings, language | local user | key/value | value | S10 |
| `recent:list` | recent projects | local user | — | list | S01 |

Webhooks in: none (v1). Webhooks out: none (v1).
Jobs: autosave every 120 s when dirty; crash-recovery write on quit.

## The parts that bite

- **Solver robustness:** floating nets, missing ground reference, ideal
  sources → singular matrices. Guard: detect unconnected groups at Run,
  show a per-net warning instead of NaN; epsilon-based pivot tolerance.
- **Races (sim vs edits):** single command queue — renderer mutations are
  applied between ticks; during Run the UI stays editable but queued
  changes are staged and applied on pause (no torn state).
- **Determinism:** fixed timestep (e.g. 1 ms sim-time), monotonic sim clock
  (wall clock is irrelevant); relay/coil timing uses sim time only.
- **Fidelity vs simplicity:** motor and trip models are behavioural
  (nameplate-driven), not FEA-grade — documented assumptions in-app +
  educational disclaimer (same class of disclaimer the original carries).
- **Windows packaging:** unsigned builds trip SmartScreen (their FAQ
  proves users hit this). Plan: CI signing when a cert exists; Store
  path as the recommended channel; portable exe fallback.
- **Electron security:** `contextIsolation: true`, `nodeIntegration: false`,
  strict CSP, no remote content in the shell.
- **IP guardrails:** all sprites/fonts our own (replica-design + sweep at
  brand stage); generic device names — no manufacturer logos or trademarks.
- **Offline by design:** no telemetry, no network calls in v1; later Pro
  license check is own design (grace window + device limit), never the
  original's activation scheme.

## Build order

1. **Vertical slice (M0):** shell window, blank canvas grid, place lamp +
   button + source, wire, Run → lamp lights, Stop. Screens: S01 (new), S02,
   S05 (minimal). Tables: `.psim` load/save only. Routes: `project:new`,
   `device:place`, `wire:connect`, `sim:*`. Proves the stack end to end.
2. **Must-haves:**
   - **M1 editor:** S03 library (categories + search), S04 properties,
     grid/snap/rotate/mirror, undo/redo, open/save (S09), `.psim` v1.
   - **M2 solver:** DC nodal solver in worker, run/stop/reset, live
     voltage/current highlighting, fault banner (singular/floating).
   - **M3 motors + control:** 3-phase motor (6/9/12), DOL, star-delta,
     contactors/relays/timers, buttons/lights, interlocks.
   - **M4 protection + instruments + export:** overload/breaker/fuse trips,
     phase loss, multimeter + clamp (S06), export image/PDF (S09).
3. **Should-haves:** ladder editor + compact PLC (S07), analog 0–10 V /
   4–20 mA + Pt100 (S07-adjacent), VFD keypad (S08), starter templates,
   EN/ES i18n (S10), safety-relay behaviors.
4. **Could-haves:** subcircuits, device library packs, free/Pro gating.
5. **Fixes from replica-entrepreneur** once it has run.
6. **Brand → launch → deploy:** rename + sweep, store listing, GitHub
   Releases CI + Microsoft Store submission.

Each milestone lands as one commit (or a short series) pushed to
`243275-ctrl/panel-sim`.
