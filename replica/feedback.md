# Feedback research — EduVolt Designer (our clone: PanelSim)

**Sample size: 0 public reviews found.** `reviews.py` was run on
`reviews.csv` (header only) and correctly refused to invent rows (exit 2).
This file states what was checked and what evidence legitimately exists.

## What was checked (2026-11-24)

| source | where | result |
| --- | --- | --- |
| Microsoft Store | https://apps.microsoft.com/detail/9P9D260MDWVK | **"There aren't any reviews yet."** — zero ratings/reviews on the official listing |
| Google Play | search `site:play.google.com "EduVolt Designer"` | no listing (the app ships Store + own-site APK) |
| apkpure / apkmirror | search "EduVolt Designer" | only an unrelated Brazilian app "Eduvolt" by Plape — different product, excluded |
| Reddit | search "EduVolt Designer" reviews/alternative | no threads |
| Hacker News | Algolia-style query via web search | no threads |
| G2 / Capterra / Trustpilot | web search | no product pages |
| Product Hunt | web search | none |

An "évolt" Capterra page and an "Eduvolt" APK exist but are **different
products** — excluded rather than passed off as evidence.

## Evidence that does exist (product facts, not reviews)

These are verbatim statements from the vendor's own public pages — facts
about the product, never presented as user quotes:

1. **Microsoft Store listing** (https://apps.microsoft.com/detail/9P9D260MDWVK,
   read 2026-11-24):
   - "The free version never expires and includes 45 devices. Pro plans
     unlock the full library for the length of the plan and are purchased on
     the EduVolt Academy website."
   - "The app needs to go online from time to time to verify the license."
   - "In-App Purchases" (store billing badge).
   - "There aren't any reviews yet."
2. **Vendor pricing/course pages** (https://eduvoltacademy.com/, read
   2026-11-24): Free45 vs Pro 117 device tiers; brands shown (Siemens,
   Delta, Schneider, WEG, Pilz).
3. **Commissioner brief** (direct stakeholder, 2026-11-24 — recorded as a
   brief, not as a store review): overall simulator level "50%", parts
   drawing quality once "60% unacceptable"; standing demand for a
   **professional simulator with PLC programming, VFD parameterization and
   functional sensors**, and a hard rule: **every part free forever, no
   tiers, no payments, no license server ever**.

## Thin-theme warning

With 0 public reviews, no theme can be ranked. Do not present any list below
as "what users say". The fix plan in `fixes.md` is grounded only in the three
evidence classes above, each item labelled with its source class.
