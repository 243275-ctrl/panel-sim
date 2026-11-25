// Device catalog — our own names, categories and artwork metadata.
// Covers every public category of the reference product; all parts free.
// `sim` marks what the solver understands today (grows with M2/M3/M4).
import type { DeviceType } from "../state/store";

export interface LibItem {
  type: DeviceType;
  label: string;
  meta: string;
  category: string;
  prefix: string;
  sim: boolean;
  /** terminal labels indexed by terminal number (most devices: 2) */
  terms: string[];
}

export const LIBRARY: LibItem[] = [
  // ---- Power ----
  { type: "source", label: "DC source", meta: "24 V control supply", category: "Power", prefix: "V", sim: true, terms: ["+", "−"] },
  { type: "ac-source", label: "AC source", meta: "single-phase supply", category: "Power", prefix: "U", sim: true, terms: ["L", "N"] },
  { type: "ground", label: "Ground", meta: "PE reference", category: "Power", prefix: "PE", sim: true, terms: ["PE", "—"] },
  { type: "transformer-1p", label: "Transformer 1-phase", meta: "control transformer", category: "Power", prefix: "TC", sim: false, terms: ["H1", "H2"] },
  { type: "transformer-3p", label: "Transformer 3-phase", meta: "power transformer", category: "Power", prefix: "TM", sim: false, terms: ["H1", "H2"] },
  { type: "battery", label: "Battery", meta: "DC backup", category: "Power", prefix: "BT", sim: true, terms: ["+", "−"] },
  { type: "generator", label: "Generator set", meta: "genset", category: "Power", prefix: "GEN", sim: true, terms: ["L1", "L2"] },
  // ---- Controls ----
  { type: "button", label: "Push button, NO", meta: "momentary, starts", category: "Controls", prefix: "S", sim: true, terms: ["1", "2"] },
  { type: "button-nc", label: "Push button, NC", meta: "momentary, stops", category: "Controls", prefix: "S", sim: true, terms: ["1", "2"] },
  { type: "estop", label: "Emergency stop", meta: "mushroom head, NC", category: "Controls", prefix: "SB", sim: true, terms: ["11", "12"] },
  { type: "selector", label: "Selector switch", meta: "hand / off / auto", category: "Controls", prefix: "SA", sim: true, terms: ["13", "14"] },
  { type: "switch-2way", label: "Two-way switch", meta: "lighting changeover", category: "Controls", prefix: "SW", sim: true, terms: ["1", "2"] },
  { type: "keyswitch", label: "Key switch", meta: "locked mode select", category: "Controls", prefix: "SK", sim: true, terms: ["1", "2"] },
  // ---- Indicators ----
  { type: "lamp", label: "Pilot light, green", meta: "run indication", category: "Indicators", prefix: "H", sim: true, terms: ["X1", "X2"] },
  { type: "lamp-amber", label: "Pilot light, amber", meta: "warning indication", category: "Indicators", prefix: "H", sim: true, terms: ["X1", "X2"] },
  { type: "buzzer", label: "Buzzer", meta: "audible alarm", category: "Indicators", prefix: "BZ", sim: true, terms: ["A1", "A2"] },
  { type: "beacon", label: "Stack beacon", meta: "tower light", category: "Indicators", prefix: "YL", sim: true, terms: ["A1", "A2"] },
  // ---- Switching ----
  { type: "contactor", label: "Contactor", meta: "3 main NO contacts", category: "Switching", prefix: "KM", sim: false, terms: ["1", "2"] },
  { type: "contactor-rev", label: "Reversing contactor", meta: "pair for motor reverse", category: "Switching", prefix: "KMR", sim: false, terms: ["1", "2"] },
  { type: "relay", label: "Control relay", meta: "general purpose", category: "Switching", prefix: "KA", sim: false, terms: ["A1", "A2"] },
  { type: "aux-no", label: "Aux contact, NO", meta: "mirror contact", category: "Switching", prefix: "KM", sim: false, terms: ["13", "14"] },
  { type: "aux-nc", label: "Aux contact, NC", meta: "mirror contact", category: "Switching", prefix: "KM", sim: true, terms: ["21", "22"] },
  { type: "changeover", label: "Changeover contact", meta: "SPDT transfer", category: "Switching", prefix: "KA", sim: false, terms: ["C", "NO"] },
  // ---- Protection ----
  { type: "fuse", label: "Fuse", meta: "cylinder cartridge", category: "Protection", prefix: "FU", sim: true, terms: ["1", "2"] },
  { type: "breaker-1p", label: "Breaker 1P", meta: "miniature breaker", category: "Protection", prefix: "QF", sim: true, terms: ["1", "2"] },
  { type: "breaker-3p", label: "Breaker 3P", meta: "three-pole MCB", category: "Protection", prefix: "QF", sim: true, terms: ["1", "2"] },
  { type: "mccb", label: "Breaker MCCB", meta: "molded case, adjustable", category: "Protection", prefix: "QF", sim: true, terms: ["1", "2"] },
  { type: "overload", label: "Overload relay", meta: "motor protection", category: "Protection", prefix: "FR", sim: true, terms: ["95", "96"] },
  { type: "surge", label: "Surge protector", meta: "SPD type 2", category: "Protection", prefix: "FSP", sim: true, terms: ["L", "PE"] },
  { type: "rccb", label: "Residual current device", meta: "30 mA RCCB", category: "Protection", prefix: "QF", sim: true, terms: ["1", "2"] },
  // ---- Passives ----
  { type: "resistor", label: "Resistor", meta: "load / divider", category: "Passives", prefix: "R", sim: true, terms: ["1", "2"] },
  { type: "capacitor", label: "Capacitor", meta: "filter / factor", category: "Passives", prefix: "C", sim: true, terms: ["1", "2"] },
  { type: "inductor", label: "Inductor", meta: "choke", category: "Passives", prefix: "L", sim: true, terms: ["1", "2"] },
  { type: "potentiometer", label: "Potentiometer", meta: "adjustable divider", category: "Passives", prefix: "RV", sim: true, terms: ["1", "2"] },
  { type: "thermistor", label: "Thermistor", meta: "NTC inrush guard", category: "Passives", prefix: "PTC", sim: true, terms: ["1", "2"] },
  // ---- Motors ----
  { type: "motor", label: "Motor, 3-phase", meta: "6/9/12-lead induction", category: "Motors", prefix: "M", sim: false, terms: ["U1", "W1"] },
  { type: "motor-1ph", label: "Motor, 1-phase", meta: "with capacitor", category: "Motors", prefix: "M", sim: false, terms: ["U", "Z"] },
  { type: "motor-dc", label: "Motor, DC", meta: "shunt wound", category: "Motors", prefix: "MD", sim: false, terms: ["+", "−"] },
  // ---- Drives ----
  { type: "vfd", label: "Frequency inverter", meta: "VFD with keypad", category: "Drives", prefix: "U", sim: true, terms: ["U", "W", "L", "N", "DI1", "COM"] },
  { type: "servo-drive", label: "Servo drive", meta: "motion axis", category: "Drives", prefix: "SV", sim: false, terms: ["L1", "L2"] },
  // ---- Instruments ----
  { type: "multimeter", label: "Multimeter", meta: "V / A / Ω", category: "Instruments", prefix: "TQ", sim: true, terms: ["COM", "VΩ"] },
  { type: "clamp", label: "Clamp meter", meta: "non-contact current", category: "Instruments", prefix: "TQ", sim: true, terms: ["IN", "OUT"] },
  { type: "voltmeter", label: "Voltmeter", meta: "panel mount", category: "Instruments", prefix: "PV", sim: true, terms: ["+", "−"] },
  { type: "ammeter", label: "Ammeter", meta: "panel mount", category: "Instruments", prefix: "PA", sim: true, terms: ["+", "−"] },
  // ---- Sensors ----
  { type: "pt100", label: "Temperature probe Pt100", meta: "RTD with transmitter", category: "Sensors", prefix: "TT", sim: false, terms: ["+", "−"] },
  { type: "pressure-sensor", label: "Pressure sensor", meta: "4–20 mA", category: "Sensors", prefix: "PT", sim: false, terms: ["+", "−"] },
  { type: "proximity-sensor", label: "Proximity switch", meta: "inductive NO", category: "Sensors", prefix: "SQ", sim: false, terms: ["BN", "BU"] },
  { type: "photo-sensor", label: "Photoelectric sensor", meta: "through-beam", category: "Sensors", prefix: "B", sim: false, terms: ["BN", "BU"] },
  { type: "level-sensor", label: "Level switch", meta: "float type", category: "Sensors", prefix: "LG", sim: false, terms: ["1", "2"] },
  // ---- Automation ----
  { type: "plc", label: "Compact PLC", meta: "ladder controller", category: "Automation", prefix: "PLC", sim: true, terms: ["L+", "M", "I0.0", "I0.1", "I0.2", "I0.3", "Q0.0", "Q0.1", "Q0.2", "Q0.3"] },
  { type: "plc-expansion", label: "PLC expansion", meta: "I/O module", category: "Automation", prefix: "EX", sim: false, terms: ["L", "N"] },
  { type: "analog-module", label: "Analog module", meta: "0–10 V / 4–20 mA", category: "Automation", prefix: "AM", sim: false, terms: ["+", "−"] },
  // ---- Connection ----
  { type: "terminal-block", label: "Terminal block", meta: "feed-through", category: "Connection", prefix: "XT", sim: true, terms: ["1", "2"] },
  { type: "junction-box", label: "Junction box", meta: "4-way connection", category: "Connection", prefix: "JX", sim: true, terms: ["1", "2"] },
  { type: "connector", label: "Plug connector", meta: "industrial plug", category: "Connection", prefix: "XS", sim: true, terms: ["L", "N"] },
  // ---- stone-polisher integration: their program's unique parts ----
  { type: "three-phase-supply", label: "Three-phase supply", meta: "400 V line-to-line", category: "Power", prefix: "PS", sim: false, terms: ["L1", "L2"] },
  { type: "digital-input", label: "Digital input", meta: "24 V discrete in", category: "Automation", prefix: "DI", sim: false, terms: ["L", "N"] },
  { type: "digital-output", label: "Digital output", meta: "24 V discrete out", category: "Automation", prefix: "DO", sim: false, terms: ["L", "N"] },
  { type: "analog-input", label: "Analog input", meta: "0–10 V / 4–20 mA in", category: "Automation", prefix: "AI", sim: false, terms: ["+", "−"] },
  { type: "analog-output", label: "Analog output", meta: "0–10 V / 4–20 mA out", category: "Automation", prefix: "AO", sim: false, terms: ["+", "−"] },
  { type: "stone-sensor", label: "Stone sensor", meta: "presence detection", category: "Sensors", prefix: "SC", sim: false, terms: ["1", "2"] },
  { type: "water-flow-sensor", label: "Water flow sensor", meta: "flow monitoring", category: "Sensors", prefix: "FS", sim: false, terms: ["1", "2"] },
  { type: "thickness-sensor", label: "Thickness sensor", meta: "thickness measurement", category: "Sensors", prefix: "TS", sim: false, terms: ["1", "2"] },
];

export const CATEGORIES = [
  "Power",
  "Controls",
  "Indicators",
  "Switching",
  "Protection",
  "Passives",
  "Motors",
  "Drives",
  "Instruments",
  "Sensors",
  "Automation",
  "Connection",
];

const META: Record<string, { short: string; prefix: string; terms: string[] }> =
  Object.fromEntries(
    LIBRARY.map((l) => [
      l.type,
      { short: l.label.split(",")[0], prefix: l.prefix, terms: l.terms },
    ]),
  );

export const TYPE_META: Record<string, { short: string; prefix: string; terms: string[] }> = META;

/** terminal labels for a device type (always an array, length = terminal count) */
export function termsOf(type: string): string[] {
  return TYPE_META[type]?.terms ?? ["1", "2"];
}

/** how many terminals a type exposes (2 for almost everything) */
export function termCount(type: string): number {
  return termsOf(type).length;
}

export function matches(item: LibItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    item.label.toLowerCase().includes(s) ||
    item.meta.toLowerCase().includes(s) ||
    item.category.toLowerCase().includes(s)
  );
}
