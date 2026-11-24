# Recon map: EduVolt Designer (Windows desktop)

Scope: core loop — panel editor + electrical simulation + motor starters + protection + instruments + save/export (the free-tier experience; PLC/VFD/analog marked phase 2)
For: Windows desktop clone, own brand (user request via replica skills)
Date: 2026-11-24

## Terms check (done first)

Source #2 (ToS) §2 claims copyright on the apps, their code, design and
official device library, and **forbids reverse engineering, decompiling and
extracting the library**. Per replica-recon rules: no account used, no app
probing, no decompilation. **All sources below are public pages only.**
Rebuild is clean-room: functionality from public descriptions, own assets,
own names.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | product / pricing / FAQ page | https://eduvoltacademy.com/courses/eduvolt-designer-pro/ | features, gallery captions, plans ($24.90/6mo, $39.90/12mo), distribution, equipment brands, offline/2-device rules |
| 2 | terms of use | https://eduvoltacademy.com/terminos_y_condiciones_de_uso/ | IP restrictions, free never expires, license personal, no-refund, educational disclaimer |
| 3 | Microsoft Store listing | https://apps.microsoft.com/detail/9P9D260MDWVK | description, feature list, 5 screenshot captions, system reqs (Win10 18362+), size 61.8 MB, EN/ES, Education |

## Core loop

Draw an industrial panel with real-look devices, wire terminal to terminal,
power it up, and watch it behave: contactors close, motors spin, protections
trip; measure anywhere with virtual instruments; save and export.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Start / new project | app launch | open recent, new blank, from template | recent list, template picker | first run (no projects), with projects |
| S02 | Main editor canvas | S01 → project | lay out devices and wires | device palette, grid canvas, terminals, wires, toolbar, menu bar | empty canvas, populated, selection |
| S03 | Device library panel | S02 palette | browse devices by category (45 free / 117 pro) | category tree, device tiles, search | free tier (locked tiles), pro |
| S04 | Device properties dialog | double-click device | edit nameplate values (motor power/voltage/connection 6-9-12 lead, relay settings) | form fields, unit selectors, validation | valid, invalid input |
| S05 | Simulation runtime | S02 → Run | live circuit behavior | run/stop/reset transport, animated states (contactor, motor, lights), fault banner | stopped, running, faulted |
| S06 | Instruments | S05 → multimeter/clamp | read V/A at any point | probe placement, dial (V/A), readout | idle, measuring, out-of-range |
| S07 | PLC ladder editor | device → program | write ladder, watch it run in circuit (phase 2) | rung grid, contacts/coils palette, download-to-sim button, small display | empty ladder, running, online edits |
| S08 | VFD keypad view | double-click drive (phase 2) | parameters, run/stop, fault codes | segment display, arrow keys, param list | run, fault code |
| S09 | Save / export | File menu | save project, export image/PDF (evidence: Store features) | file dialog, export options | saving, success, error |
| S10 | Settings / about | menu | language EN/ES, units, grid options | toggles, language picker | defaults, changed |

Evidence: screenshot captions in #3 ("Build your circuit…", "Insert devices from the library and wire them", "Program the PLC in ladder…", "Measure and test sensors, timers and PLC outputs", "Measure electrical quantities using the instruments"); File menu items (save/export) in #3 description "Save your projects and export them to image or PDF".

## Flows

```
F01 Build and run the first panel (core loop)
    S01 new -> S02 canvas -> S03 place devices -> wire -> S05 Run -> motor runs
    happy path clicks: ~12 (new, 5 placements, 6 wires, run)
    edge: unconnected terminal, no ground/reference, wrong motor connection

F02 Direct-on-line starter with protection
    place motor + contactor + overload + buttons -> wire -> Run
    -> press start -> motor runs; force overload -> trip -> reset
    edge: phase loss trips overload; interlock prevents both contactors

F03 Star-delta start (12-lead motor)
    S04 set motor connection 12-lead -> wire 2 contactors + timer -> Run
    edge: transition timing, wrong lead mapping (validation error)

F04 Measure a point
    S06 select multimeter -> probes on two terminals -> read V
    edge: live vs de-energised, AC/DC mode, clamp around one conductor only

F05 Save and share the work
    File -> Save (S09); File -> Export PDF/image
    edge: overwrite, export while simulating

F06 Program the PLC and watch outputs drive the circuit (phase 2)
    S07 write rungs -> download -> S05 Run -> outputs energise contactors
    edge: scan cycle timing, forcing outputs, online edit while running

F07 Parameterise a VFD (phase 2)
    S08 set freq/accel -> Run -> motor at speed; inject fault -> code shown
    edge: fault reset, parameter write protection
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Pictorial device sprite (own art) | contactor, relay, breaker, fuse, MCB, overload, button (NO/NC), pilot light, 3-phase motor, timer, transformer, sensor | unpowered, energised, tripped, fault | S02, S05 |
| Terminal + wire | screw terminal, wire segment, junction | unconnected, connected, live-highlight | S02 |
| Device palette / library | category tree, tile grid | free, locked(pro), hover | S03 |
| Properties form | motor nameplate, relay settings, generic | valid, invalid, saved | S04 |
| Simulation transport | run / stop / reset | idle, running, faulted, paused | S05 |
| Fault banner | overload, short, phase loss | visible, dismissed | S05 |
| Instrument overlay | multimeter, clamp meter | idle, probing, reading | S06 |
| Ladder editor (phase 2) | rung grid, instruction palette | edit, run, monitoring | S07 |
| VFD keypad (phase 2) | segment display, keys | run, param, fault | S08 |
| Menu bar + dialogs | File/Edit/View, export, settings | open, closed | all |

## Inferred data model

```
Project     id, name, created_at, updated_at, canvas (devices[], wires[]),
            export_settings
            evidence: S01, S09 save/export (source #3)
            confidence: high

Device      id, type_id, name, x, y, rotation, terminals[],
            params (nameplate: power, voltage, connection 6|9|12, settings...),
            state (runtime)
            evidence: S02/S04, gallery captions "Full nameplate, 6, 9 and
            12-lead connections" (source #1)
            confidence: high

DeviceType  id, category, symbol asset (own), terminals schema, params schema,
            behavior model ref, tier (free|pro)
            evidence: "45 library devices" free / "All 117 devices" pro (#1, #3)
            confidence: high

Wire        id, from (device_id, terminal_id), to (device_id, terminal_id)
            evidence: "wire them terminal to terminal" (#3)
            confidence: high

Net         id, wire connectivity (computed) — nodes for the solver
            evidence: "computes voltages and currents across the whole circuit" (#1)
            confidence: high

SimState    t, node voltages, branch currents, device states[], faults[]
            evidence: "protection devices trip, interlocks work" (#3)
            confidence: high

MotorSpec   device_id, connection (6|9|12-lead), power, voltage, rpm
            evidence: gallery "motors ... DOL and star-delta starting" (#1)
            confidence: high

TripModel   device_id, kind (overload|breaker|fuse), thresholds,
            fault kinds (short|overload|phase loss)
            evidence: "acting on short circuits, overloads and phase loss" (#1)
            confidence: high

Instrument  kind (multimeter|clamp), mode (V|A), probe points[], reading
            evidence: "Multimeter and clamp meter to read voltage and current
            at any point" (#1); "one multimeter" free, "multimeters and clamps" pro
            confidence: high

LadderProgram (phase 2)  rungs[], contacts, coils, timers
            evidence: "LOGO! 8, LOGO! 9 and S7-1200 with ladder editor" (#1),
            Store screenshot 3 (#3)
            confidence: high

VfdProfile  (phase 2)  device_id, params[], faults[]
            evidence: "SINAMICS V20 and Delta VFD-EL-W with keypad, parameters
            and faults" (#1)
            confidence: high

AnalogIO    (phase 2)  channel (0-10V | 4-20mA), sensor (potentiometer,
            Pt100 + transmitter), value
            evidence: "Analog signals ... Pt100 with transmitter" (#1)
            confidence: high
```

Relationships: Project 1-n Device; DeviceType 1-n Device; Device 1-n Terminal; Wire n-1 Terminal; SimState derives from Project; MotorSpec/TripModel/VfdProfile 1-1 Device; LadderProgram 1-1 PLC Device; Instrument references Net points.

## Feature matrix

See `features.csv`. Must: 16, should: 8, could: 3, skip: 6.

## Out of scope (cannot or should not be cloned)

- EduVolt name, website copy, gallery images, store screenshots (brand/IP) — skip
- Their device-library pictorial artwork (ToS §2 claims it) — skip; own art only
- Manufacturer logos/trademarks (Siemens, Delta, Schneider, WEG, Pilz) — skip; behaviour from public datasheets, generic device names
- Their license-server activation scheme — skip; own licensing design
- Reverse engineering / decompiling the app or extracting its library — skip (ToS §2 + skill rules)
- The EduVolt Academy course platform — different product, not part of the app

## Size

Screens 10 (phase 2 adds S07/S08), flows 7, entities 11. Hard parts:
electrical solver for power+control circuits, 6/9/12-lead motor starter
behaviour, protection trip models, own pictorial device art, ladder VM (phase
2), Windows installer + code signing, own license model. Size: **L** for the
core slice, **XL** for full parity (PLC + VFD + analog). Next step:
`/replica-architect`.
