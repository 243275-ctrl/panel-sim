# Launch plan — PanelSim (replica-launch, 2026-11-24)

## Pre-launch (this week)

1. **Landing page** `docs/index.html` (GitHub Pages) — built from
   `landing.md`, real screenshots only, no fake proof.
2. **Screenshots** via Playwright against the live dev build: start screen,
   PLC demo running, ladder editor open. Stored `docs/assets/`.
3. **Store listing copy** `listing.json`, linted with `listing.py`
   (Microsoft Store is the real channel; the same copy feeds a future
   Google Play build).
4. **Release hygiene**: every tag = Setup.exe + portable zip (CI), release
   notes in the brand voice, version in package.json before tagging.
5. **Legal pages** (before store submission): short privacy policy (the app
   collects nothing — no account, no telemetry, no server) and a disclaimer
   that this is a learning tool, not a certification of real installations.

## Distribution channels

| channel | state | next |
| --- | --- | --- |
| GitHub Releases (`243275-ctrl/panel-sim`) | live since v0.1.0 | keep as canonical download |
| GitHub Pages landing (`docs/`) | build this phase | enable Pages (user's GitHub settings) |
| Microsoft Store | not submitted | developer account + submission is the user's account step |
| Google Play (future) | not planned | APK currently Windows-first |

## Where the audience already is (from research)

-0 public reviews means no "unhappy users of the original" thread to
  answer — the honest play is to be findable: README keywords (PLC
  simulator, ladder logic, VFD, panel), r/PLC, r/AskElectronics,
  r/IndustrialAutomation, YouTube electronics-classroom channels, Spanish
  and Arabic technical communities (the original's market is Spanish-
  speaking — we are English-first today; i18n is roadmap).
- Product Hunt / Hacker News: lead with the fix angle from `fixes.md`
  ("every device free forever, offline, no license checks") — a factual
  claim anyone can verify in30 seconds.

## First10 users to talk to by hand

Real people, no fabrication: instructors who run lab sessions, panel-shop
technicians mentoring apprentices, and students learning ladder logic.
Ask three questions: what did they try before, what broke, would they
project this in class. Record quotes only with permission.

## Analytics & errors

None — deliberately. The app is offline by design; adding telemetry would
contradict the product and the privacy copy. Error feedback = the in-app
notice bar + GitHub Issues.

## Metrics that matter (checked monthly, no trackers needed)

- Release download counts (GitHub API).
- Issues opened / time-to-first-reply.
- Stars as a weak signal only.
