# Deploy checklist: PanelSim

Date: 2026-11-25  Commit: `3e6629a`  Go from user: **yes** (public + Pages, given 2026-11-25)

Live: **https://243275-ctrl.github.io/panel-sim/**

Deploy target: GitHub Pages serving `docs/` (landing: index + privacy + terms
+ favicon + screenshots). The product itself ships via GitHub Releases
(Windows installer + portable zip).

## Preflight (all must pass)

- [x] test suite green: **vitest 50/50 (9 files)** · `tsc --noEmit` clean
      (no separate e2e suite — unit/contract tests are the suite for an
      offline desktop app)
- [x] no open S1 or S2 bugs: none open. `replica/fixes.md` holds
      competitor-derived enhancement notes (non-blocking backlog).
- [~] parity (`parity.py replica/features.csv`): **exit 0** (project gate,
      same criterion as the launch preflight). Informational score **69.7**,
      must-haves 11/16 — the 5 open items are unchanged since launch and are
      recorded roadmap (M5 / simulation depth) or deliberate scope
      ("clamp meter (pro tier)" — we have no pro tier; all parts free).
- [x] rebrand sweep clean: `sweep.py --config replica/brand.json` → **exit 0**
- [x] store listing: `listing.py replica/launch/listing.json` → **0 errors,
      0 warnings**
- [x] production build passes: `vite build` ✓ (373 kB / 120 kB gzip)
- [x] privacy policy and terms live: `docs/privacy.html` + `docs/terms.html`
      (commit `32ae451`), processors listed = **GitHub, Inc.** (Pages hosting +
      Releases delivery) — the complete list for an offline app with no
      backend.
- [N/A] account deletion: no accounts exist (offline, no auth, no server).
- [x] favicon, titles, OG image, app icon are yours: `docs/favicon.ico`
      (from `build/icon.ico`), `<title>` PanelSim, `og:image`
      `assets/shot-demo.png`; sweep clean across all of it.

### Stone-polisher ج (commit `ed14ffd`) verified in this preflight
- 8 new types (55 → 63) + 7 recolored icon cards; shadow-bound five and
  lamp/meter stay on our SVG (test-bound).
- art sheet regenerated: `replica/design/art-sheet-after.png`.

## BLOCKER found by the core-flow check — RESOLVED

- [x] **Repository was `private: true`** (all anonymous links 404'd).
  Fixed on the user's go (2026-11-25): repo made **public**, Pages enabled
  (`main /docs`). Anonymous verification after the flip: `/`,
  `/privacy.html`, `/terms.html`, `/favicon.ico`, `releases/latest`,
  repo root → **all 200**.

## Production — N/A by design

- No database, no env vars, no Stripe, no OAuth, no email service.
  The product stance is: no account, no licence server, no telemetry.

## Domain — not purchased

- Planned host: GitHub Pages (`<user>.github.io/panel-sim/`), HTTPS automatic.
- A custom domain is the user's purchase decision if ever wanted.

## Watch

- [x] error tracking: N/A (no backend); in-app fault panel reports simulator
      faults honestly.
- [x] uptime/analytics: none by design — stated on the landing FAQ and the
      privacy page.
- [x] core flow on the live site verified **anonymously** (2026-11-25):
      landing `/` → `releases/latest` → installer + zip asset URLs → all
      200. Live URL: https://243275-ctrl.github.io/panel-sim/
- [x] release **v0.7.0** shipped (user's go): `PanelSim.Setup.0.7.0.exe`
      (213,108,876 B, CI) + `PanelSim-win-x64-0.7.0.zip` (262,031,720 B,
      local `--win dir`), release notes set.

## Ready to execute on the user's go

1. `gh repo edit … --visibility public`
2. enable Pages (`main`, `/docs`) → wait for build
3. anonymous curl checks: `/`, `/privacy.html`, `/terms.html`,
   `/favicon.ico`, `releases/latest`, installer asset (expect 200s)
4. hand the live URL to the user
