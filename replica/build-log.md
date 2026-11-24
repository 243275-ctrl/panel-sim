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
