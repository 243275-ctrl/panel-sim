# Fixes & positioning angle — PanelSim (clone of EduVolt Designer)

Evidence classes used below (0 public reviews exist — see `feedback.md`):
**[F]** vendor's own public product facts · **[B]** commissioner brief ·
**[P]** parity gap already tracked in `features.csv`.

## 1. What they hate — (no public complaint corpus)

No public complaints found. Nothing to rank. (Stated, not invented.)

## 2. What is missing (from users' own words)

No user-request corpus exists. The only first-party demand signals are the
commissioner brief **[B]**: "professional simulator", "program the PLC,
VFD, sensors", "every part free forever".

## 3. What is unsolved (positioning-grade gaps)

Ranked by evidence × how cheaply we fixed them:

| # | gap | evidence | our fix |
| --- | --- | --- | --- |
| 1 | **Paywall + online license checks**: free tier capped at45 devices; Pro unlocks117; app phones home to verify licenses | **[F]** Store listing quotes in feedback.md | All55+ device types free forever, no tiers, no payments, no license server, works offline (user rule **[B]**) — shipped M0→M4 |
| 2 | **Professional control depth must be paid**: PLC ladder + VFD + sensors sit behind Pro on the original | **[F]** store: "Pro plans unlock the full library"; **[B]** demand for professional PLC/VFD/sensors | Ladder editor with live150 ms scan, VFD keypad (Hz/dir/run/DI1), four functional sensors, T0–T3 timers — all in the free offline app — shipped M3/M4 |
| 3 | **Quality bar for pictorial art** | **[B]** "60% unacceptable" | v2 material system (gradients, shading, geometry contract tests) — shipped v0.3.1, gate raised to functionality after |
| 4 | **No review signal at all** (store launched2026-11-06, still zero reviews) | **[F]** "There aren't any reviews yet" | Not fixable by us; means our launch must earn reviews honestly, never fake them |

## Fix plan rows added to `features.csv` (original = no)

1. `Works fully offline — no license verification server` (original: no —
   their app verifies licenses online) · size S · replica-entrepreneur fact → shipped.
2. `All device types free forever — no tiers, no in-app purchases`
   (original: no —45 free / Pro plans + IAP) · size S · user rule **[B]** → shipped.

(Other parity rows — PLC editor, VFD, sensors, timers, export, protection —
are the original's own Pro features, so they are parity rows with
`original = yes`, already tracked since M3/M4.)

## The angle (positioning options)

Template: For {{who}} who {{hate this}}, {{app}} {{does this}}. Evidence:

**A — Free forever, offline, professional (RECOMMENDED)**
> For students, technicians and teachers who are tired of device caps and
> apps that must phone home to verify a license, **PanelSim** is a
> professional-grade industrial panel simulator where every device, PLC
> editor, VFD and sensor is free forever and works fully offline.
> Evidence: vendor's own store copy (45-device cap, online license
> verification) [F]; commissioner's no-tiers rule [B]; 0 public reviews —
> no complaint corpus to cite.

**B — The control toolkit, not just drawing**
> For learners who can already draw a circuit but hit a paywall when they
> want to program the PLC and parameterize the drive, **PanelSim** ships the
> whole control loop — sensor → ladder scan → contactor → VFD → motor —
> inside the free app.
> Evidence: store copy places PLC/VFD/sensors behind Pro [F]; the
> professional-simulator brief [B]; our M3/M4 acceptance tests.

**C — Built for the classroom demo**
> For instructors who need a projector-friendly, no-install-internet demo of
> a working panel — press Run, the PLC scans live, the motor spins, the
> overload trips — **PanelSim** does it on any Windows PC without accounts
> or activation.
> Evidence: start-screen demo projects + live scan UI (shipped); offline
> requirement [F/B].

**Recommendation: A** as the headline (it is the only angle that is both
factual and instantly checkable by any buyer of the original), with B as the
feature proof under it and C as the education sub-headline. Drives
`replica-brand`'s voice (direct, practical, no hype) and
`replica-launch`'s hero.
