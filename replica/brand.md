# Brand — PanelSim

Written by replica-brand, 2026-11-24. Feeds `brand.json` (sweep config),
replica-launch's hero, and the app chrome.

## Step 1 — Name candidates (20 generated → 5 shortlisted)

Generated across styles: descriptive (PanelSim, ControlLab, LadderLab,
SwitchLab, VoltBench, WireBench, RelayLab, AmpereLab, PanelLab, ContactSim),
compound (Panelwise, Voltbench, Switchcraft, Wirecraft), invented (Voltiq,
Circuito, Ampereon, Voltaris), metaphor (Anvil, Crucible, Beacon, Foundry),
verb (Energize, Switchon).

Shortlist5, with checks **run on 2026-11-24** (web screening; `to run` is
never presented as passed):

| # | name | vs original (EduVolt Designer) | same-category collision (run) | domain / handles | verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | **PanelSim** (current) | clearly dissimilar in sound, look, meaning ✓ | exact-name web search: only an R statistics package `saudiwin/panelsim` (unrelated field); adjacent `PSIM` (power-electronics sim) noted — distinct syllables & category; `ElectroDesk` is a same-category competitor under a different name | `whois` unavailable in this environment → **to run** (registrar search for panelsim.com / panelsim.app) | **KEEP** — zero-churn, passes the similarity test against the original |
| 2 | LadderLab | dissimilar to original ✓ | **CONFLICT — ladderlab.dev is a live PLC-training product (same category)** (run) | to run | reject |
| 3 | Voltiq | dissimilar ✓ | **CONFLICT —4+ live apps named Voltiq/VoltIQ across Play/App Store/energy SaaS** (run) | to run | reject |
| 4 | ControlBench | dissimilar ✓ | no result surfaced in today's search → inconclusive | to run | fallback only |
| 5 | SwitchLab | dissimilar ✓ | not searched today | to run | fallback only |

Trademark screening (USPTO/EU/WIPO): **to run** — this is screening, not
legal clearance; a lawyer does the real search before money is spent.

**Decision: the product name is PanelSim.** The repo slug `panel-sim`,
npm name and title-cased chrome `PanelSim` stay consistent. The original's
name never appears in the product name, listing, keywords or ads.

## Step 2 — Palette

Original's core identity (scanned from eduvoltacademy.com, 2026-11-24):
navy `#1a3a6b` + sky blue `#0ea5e9` / `#e0f2fe`, amber `#f5a623`, green
`#10b981`. Per the rule, our primary is **not a nearby blue**:

| role | was | now | why |
| --- | --- | --- | --- |
| accent | `#2f5bea` (blue) | **`#6d28d9` violet-700** | different hue family from navy/sky; white on it ≈7:1 (AA/AAA) |
| on-accent | `#ffffff` | `#ffffff` | keeps |
| live (energised wires) | `#c2410c` | unchanged | semantic, not brand |
| danger/success/warning | unchanged | unchanged | functional |
| chrome | `#1b2431` | unchanged | neutral charcoal |

Swapped in `replica/design/tokens.json` + `src/tokens.css` (roles unchanged,
as the design skill requires). The original's four hexes are recorded in
`brand.json → colors` so the sweep catches any survivor.
Contrast check: `python3 ~/.claude/skills/replica-design/contrast.py replica/design/tokens.json`.

## Step 3 — Logo brief (for a human, a designer, or an image model)

- **Idea:** the panel door as a canvas — a minimal DIN-rail silhouette whose
  breaker toggle forms a lightning bolt negative space; "PanelSim" set in a
  sturdy industrial grotesk with the **Sim** in violet.
- **Mark type:** symbol + wordmark (symbol alone must read at16px).
- **Constraints:** must work at16px favicon and as a1024×1024 app icon with
  no transparency; single accent (violet `#6d28d9`) + charcoal; no gradients
  in the symbol.
- **Deliverables:** SVG mark,1024 PNG icon (opaque), favicon set, social
  image1200×630.
- **Must not resemble the original's mark:** no shared shape, no navy/sky
  colour pair, no lightning-plus-wordmark mirroring their lockup — put their
  logo next to drafts before shipping.
- Current `build/icon.ico` is a placeholder — replace before store listing.

## Step 4 — Voice

**Three words: direct, practical, confident.**
- *Direct, not blunt* — say what it does in the first five words.
- *Practical, not academic* — verbs a technician uses: wire, press, run, trip.
- *Confident, not hype* — numbers and facts instead of "ultimate/best".

Do / don't:

| do | don't |
| --- | --- |
| "Every device, free forever." | "The most amazing simulator ever!" |
| "Works offline — no account, no activation." | "Seamless cloud-powered experience" |
| "Press Run: the PLC scans live every150 ms." | "Harness the power of next-gen automation" |
| "Overload trips at its rating; press Reset." | "Industry-grade fault intelligence (patent pending)" |
| "Built for classrooms and panel workshops." | "Trusted by millions of engineers" (unverifiable) |

Top strings already pass this check (they were written fresh in this
codebase): title `PanelSim`, buttons `▶ Run / ■ Stop / ↺ Reset / ▤
Program`, empty states (`Add a device from the library`), error copy
(`Cannot open: …`), notices (`Project downloaded (.psim)`). Nothing echoes
the original's phrasing.

## Step 5 — Sweep

`python3 ~/.claude/skills/replica-brand/sweep.py . --config replica/brand.json`
— run after the swap; result recorded in build-log. Exit0 = clean.
