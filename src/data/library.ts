// Device catalog — our own names, categories and metadata (no manufacturer
// names, no copied artwork). `sim` marks what the solver understands today;
// the rest are editor-ready and light up as milestones land (M2/M3).
import type { DeviceType } from "../state/store";

export interface LibItem {
  type: DeviceType;
  label: string;
  meta: string;
  category: string;
  prefix: string;
  sim: boolean;
}

export const LIBRARY: LibItem[] = [
  // Power
  { type: "source", label: "DC source", meta: "24 V control supply", category: "Power", prefix: "V", sim: true },
  { type: "ac-source", label: "AC source", meta: "single-phase supply · M2", category: "Power", prefix: "U", sim: false },
  { type: "ground", label: "Ground", meta: "reference node · M2", category: "Power", prefix: "PE", sim: false },
  // Controls
  { type: "button", label: "Push button, NO", meta: "momentary, opens on release", category: "Controls", prefix: "S", sim: true },
  { type: "button-nc", label: "Push button, NC", meta: "stop / e-stop contact · M3", category: "Controls", prefix: "S", sim: false },
  { type: "selector", label: "Selector switch", meta: "hand/auto · M3", category: "Controls", prefix: "SA", sim: false },
  // Indicators
  { type: "lamp", label: "Pilot light", meta: "24 V indicator", category: "Indicators", prefix: "H", sim: true },
  // Passives
  { type: "resistor", label: "Resistor", meta: "load / divider", category: "Passives", prefix: "R", sim: true },
  { type: "capacitor", label: "Capacitor", meta: "filter · M2", category: "Passives", prefix: "C", sim: false },
  { type: "inductor", label: "Inductor", meta: "choke · M2", category: "Passives", prefix: "L", sim: false },
  // Protection
  { type: "fuse", label: "Fuse", meta: "overcurrent · M4", category: "Protection", prefix: "FU", sim: false },
  { type: "breaker", label: "Circuit breaker", meta: "miniature breaker · M4", category: "Protection", prefix: "QF", sim: false },
  { type: "overload", label: "Overload relay", meta: "motor protection · M4", category: "Protection", prefix: "FR", sim: false },
  // Switching
  { type: "contactor", label: "Contactor", meta: "3 main NO contacts · M3", category: "Switching", prefix: "KM", sim: false },
  // Motors
  { type: "motor", label: "Three-phase motor", meta: "6/9/12-lead · M3", category: "Motors", prefix: "M", sim: false },
];

export const CATEGORIES = [
  "Power",
  "Controls",
  "Indicators",
  "Passives",
  "Protection",
  "Switching",
  "Motors",
];

export const TYPE_META: Record<DeviceType, { short: string; prefix: string }> =
  Object.fromEntries(
    LIBRARY.map((l) => [l.type, { short: l.label.split(",")[0], prefix: l.prefix }]),
  ) as Record<DeviceType, { short: string; prefix: string }>;

export function matches(item: LibItem, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    item.label.toLowerCase().includes(s) ||
    item.meta.toLowerCase().includes(s) ||
    item.category.toLowerCase().includes(s)
  );
}
