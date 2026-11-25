# Competitive note — WireONa (wireona.com)

Read 2026-11-24 from the public site (home + /plans). Ideas only — clean-room
rule: no code, no assets, no name, no copy. Their trademarks stay theirs.

## What they are
Electrical CAD + simulation, Windows / Android / iOS-TestFlight, positioning
"Electrical training that behaves like the real thing". Highlights on the
site: real circuit simulation, **oscilloscope (time/XY/FFT, phase, cursors)**,
**Arduino** kits (Uno, PWM, drivers), **PLC editors** (Siemens LOGO! FBD,
Schneider Zelio ladder),19 languages, missions/levels + certificates,
HMI panels, automation labs, workshare, claimed ~733k installs / ~806k
accounts (their self-published numbers — treat as claims, not verified).

## Pricing (verbatim structure, read 2026-11-24)
- **Free**: first **10 missions** only + live meters + workshare.
  Full device library is NOT free.
- Advanced Monthly: **US$8.19/mo** (struck10.99) — full library, PLC + HMI,
  labs, certificate.
- Advanced Yearly: **US$41.99/yr** after14-day trial (~US$3.50/mo).
- Advanced Lifetime: **US$99.99** one-time.
- Sign-in required to work in the app ("No account required to download").

## Where we already differ (our edges, verifiable)
| us (PanelSim) | them (WireONa) |
| --- | --- |
| every device + PLC + VFD + timers + export: **$0 forever** | free = first10 missions; library/PLC behind paywall |
| **no account, ever** — works the second it launches | sign-in required to start working |
| offline by design, no telemetry | account/workshare online |
| no license checks | plan-gated features |

## Feature ideas worth adopting (priority for M5 discussion)
1. **Oscilloscope instrument** (time + cursors; FFT/XY later) — our biggest
   instrument gap; makes analog work teachable.
2. **Arabic UI (i18n)** — they ship19 languages; our audience includes the
   Arabic-speaking market where our commissioner is. High differentiation.
3. **Arduino** microcontroller simulation (Uno, PWM, sensors) — adjacent to
   PLC training, big student audience.
4. **Function-block diagram (LOGO!-style)** as a second PLC language next to
   ladder.
5. **Missions/levels** (guided exercises) + completion certificate — pedagogy
   layer for classrooms.
6. HMI panels — nice, heavier; park on roadmap.
7. 3D scenes — skip (heavy, low ROI for us).

Do NOT copy: their device art, UI layouts, name, mission text, or code.
