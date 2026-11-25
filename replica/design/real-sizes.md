# Realistic relative sizes — art reference (2026-11-25)

Rule: every device's drawn footprint must respect its **real-world size
order** (not literal mm — the wire-tab span caps width at ~60 units — but
the *ranking* must match physical reality). Motivation: user check
"البطارية أصغر من الريلاي" was wrong in reality and wrong in our art.

## Size ladder (small → large), used for the audit

| rank | real reference (mm) | our types | drawn footprint (units) |
| --- | --- | --- | --- |
| 1 | fuse 5×20, chip parts | fuse, resistor, inductor, capacitor, thermistor | ≤ 42×18 |
| 2 | cube relay 28×35 | relay | **30×36** (was 34×42 — shrank) |
| 3 | M12×60 prox barrel, Ø30 button head | prox/photo, buttons, lamps, aux | barrel 39 long; head Ø27–30 |
| 4 | MCB pole 18×45, SPD 18×45 | breaker-1p, surge | **20–21 wide × 46 tall** (slimmed) |
| 5 | contactor 45×81 | contactor/reversing | 42×50 |
| 6 | RCBO/RCD/MCCB 45–90 wide | rccb, mccb, breaker-3p, overload | heights normalised to **46** |
| 7 | small sealed battery ≫ relay | battery | **56×32 wide block** (was 42×30 — now widest non-motor, > relay ✓) |
| 8 | control transformer ≥ contactor | transformer-1p/3p | **46×46** (enlarged) |
| 9 | DIN PSU 45×100 (taller than contactor) | source, ac-source | **40×48** (were 38×34 squat) |
| 10 | genset ≫ contactor | generator | ~53×34 (enlarged) |
| 11 | panel meter Ø60–72 | voltmeter, ammeter | face **Ø44** (was Ø39) |
| 12 | handheld DMM, PLC module, VFD 0.4 kW | multimeter, plc, vfd, servo | 42–56 tall — unchanged class |
| 13 | motor, generators | motor family, generator | biggest — unchanged |

## Style/shape harmony fixes in the same pass

- **ground** had no chassis (bare symbol) → now a 34×30 faceplate with the
  earth symbol + wire stubs — reads like the rest of the family.
- **overload RESET** label sat outside the body → moved inside the red button.
- Everything else keeps the geometry contract: wire tabs at (±30, 0),
  light from top-left, shared ArtDefs materials.

## How to re-check

```bash
node scripts/shot-sheet.mjs replica/design/art-sheet-after.png
```

before/after sheets live next to this file. Contract test
(`src/art/art.test.tsx`) must stay green — it pins tab geometry.
