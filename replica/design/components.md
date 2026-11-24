# Components — panel-sim design specs

Measured system: light industrial desktop UI (see `screens/ref-*.jpg`).
Every block: our own copy, our own icons (Lucide, MIT), Inter for type.
Phase-2 blocks are marked and stay stubs until their milestone.

## Primitives

Button
  variants  primary, secondary, ghost, danger
  sizes     sm 28px, md 32px, lg 40px (dense desktop tool)
  states    default, hover, active, focus-visible (2px ring, accent), disabled, loading
  tokens    bg accent, text on-accent, radius md, font sm/600
  a11y      real <button>, visible focus, loading keeps the label for SRs
  used on   S01, S02, S04, S05, S09

IconButton
  variants  ghost on chrome bar, ghost on light panels
  sizes     28px hit target minimum (44px touch on tablet later)
  states    default, hover, active, focus-visible, disabled, checked (toolbar toggles)
  tokens    icon 16px Lucide, radius sm, checked: accent tint bg
  a11y      aria-label required (icon-only), aria-pressed for toggles
  used on   S02 toolbar, S05 transport, S10

Input
  variants  text, search (leading icon), number (unit suffix)
  sizes     sm 28px, md 32px
  states    default, hover, focus (border accent + 2px ring), disabled, error (border danger + message)
  tokens    bg bg, border border-input, radius sm, font sm
  a11y      visible <label>, aria-describedby for hint/error, no placeholder-only labels
  used on   S03 search, S04 properties, S10 settings

Chip
  variants  filter (device category), toggle (run flags)
  states    default, hover, selected (accent tint + accent border), disabled
  tokens    bg surface, border border, radius pill, font xs
  a11y      role=button or real <button>, aria-pressed for toggles
  used on   S04 property quick-picks, S08 keypad (phase 2)

Badge / StatusPill
  variants  neutral, success, danger, warning, accent (Pro marker)
  states    static
  tokens    tinted bg (10% role), text = role, radius pill, font xs/600
  a11y      text always present — colour never the only signal
  used on   S05 fault states, S03 locked tiles, status bar

Dialog
  variants  confirm, properties (S04), export (S09)
  sizes     sm 360px, md 480px, lg 640px
  states    open, closing (motion base), backdrop dismiss disabled while saving
  tokens    bg bg, radius lg, shadow pop, header font lg
  a11y      role=dialog aria-modal, focus trap, Esc closes, focus returns to trigger
  used on   S04, S09, S01

Toast (undo)
  variants  info, success, danger
  states    entering, visible (auto-dismiss 6s), action (Undo), dismissed
  tokens    bg chrome, text on-chrome, radius md, shadow pop
  a11y      role=status aria-live=polite; undo is a real button
  used on   S02 complete/delete, S09 save

MenuBar
  variants  app menu (File Edit Draw Options Tools Help) — our wording
  states    idle, menu open (keyboard arrow navigation), item disabled
  tokens    bg bg, text text, hover bg surface, font sm
  a11y      role=menubar/menitem/menu, Alt to focus, Esc to close
  used on   S02, S09, S10

StatusBar
  variants  persistent bottom bar
  states    idle, sim running (live dot pulsing), fault (danger text)
  tokens    bg surface, border-t border, font xs, text-muted; live dot = live role
  a11y      role=status, sim state announced on change (aria-live)
  used on   S02, S05

Panel / Dock
  variants  left library (S03), right properties (S04), bottom instruments (S06)
  sizes     width var(--layout-panel-w), resizable 240–420px, collapsible
  states    expanded, collapsed, hidden
  tokens    bg surface, border border, header font sm/600
  a11y      collapse is a real button with aria-expanded; landmarks labelled
  used on   S03, S04, S06

PaletteTile
  variants  device tile, category header, search result
  states    default, hover, dragging, selected, locked (Pro tier — badge + tooltip)
  tokens    bg bg, radius md, sprite 40px, label font xs; locked: opacity .6 + Badge
  a11y      keyboard focusable, Enter places at canvas centre, aria-label = device name
  used on   S03

PropertyForm (S04)
  variants  motor nameplate (power, voltage, connection 6|9|12), relay trip, generic
  states    valid, invalid (inline error, simulation blocked), unsaved, saving
  tokens    groups separated by space-4, section titles font xs uppercase muted
  a11y      fieldset+legend per group, errors linked via aria-describedby,
            invalid connection shows plain-language reason
  used on   S04

DeviceSprite (canvas)
  variants  own SVG pictorial art per typeKey (contactors, relays, breakers,
            fuses, MCB, overload, buttons, pilot lights, motor, timer, ...)
  states    unpowered, energised (live role tint), tripped (danger badge), fault, selected (2px accent ring)
  tokens    own artwork only — no manufacturer logos; names generic
  a11y      role=img aria-label with device name+state; keyboard-selectable list fallback exists (S03)
  used on   S02, S05

Terminal / Wire (canvas)
  variants  screw terminal, wire, junction
  states    unconnected (hollow), connected, live (live role stroke, animated dash while sim runs), faulted
  tokens    stroke 2px, live = --color-live, neutral wire = text colour
  a11y      connection state mirrored in status bar text; full keyboard wiring mode: Tab to terminal, Enter to start/finish
  used on   S02

TransportControls
  variants  run (success), stop (neutral), reset (ghost) — one primary at a time
  states    stopped, running (Run becomes Pause), faulted (Reset promoted to primary)
  tokens    icons Lucide Play/Square/RotateCcw, 32px buttons, radius md
  a11y      aria-labels Run/Stop/Reset simulation, state announced via StatusBar
  used on   S05

FaultBanner
  variants  inline banner + canvas badge
  states    hidden, visible (danger: short/overload/phase-loss; warning: floating net), dismissed
  tokens    bg danger tint, text danger, radius md, icon TriangleAlert
  a11y      role=alert for faults; lists offending devices with jump links
  used on   S05

InstrumentOverlay (S06)
  variants  multimeter (V/AC, V/DC, A), clamp meter (A)
  states    idle, probing (drag probes), reading, out-of-range, invalid (both probes same net)
  tokens    mono font for readout, 7-seg style value (font mono xl), body bg chrome
  a11y      readout aria-live=polite; probe points choosable from a list, not drag-only
  used on   S06

LadderEditor (phase 2)
  variants  rung grid, instruction palette (NO/NC contact, coil, timer, reset)
  states    edit, monitoring (live power-flow highlight), error (unrung rung)
  tokens    grid 16px, rails 2px text colour, live rung stroke = live role
  a11y      table-like structure with keyboard row insert; monitoring announced politely
  used on   S07

VfdKeypad (phase 2)
  variants  segment display, navigation keys, param list
  states    run, param-edit, fault-code (danger)
  tokens    mono digits, chip keys, radius sm
  a11y      full keyboard equivalent of keypad; fault codes have text descriptions
  used on   S08

EmptyState
  variants  no project (S01), empty canvas (S02), no search results (S03)
  states    illustration-free (own simple icon), one action button
  tokens    text-muted, icon 32px, gap space-4, copy written fresh (never theirs)
  a11y      heading + action, single focus target
  used on   S01, S02, S03
