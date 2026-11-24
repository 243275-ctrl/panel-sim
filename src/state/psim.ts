// .psim project files — versioned JSON with fail-closed validation.
import type { Device, DeviceType, Wire } from "./store";

export const SCHEMA_VERSION = 1;

export interface PsimMeta {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface PsimDoc {
  schema_version: number;
  meta: PsimMeta;
  devices: Device[];
  wires: Wire[];
  annotations: unknown[];
}

export const DEVICE_TYPES: DeviceType[] = [
  "source",
  "ac-source",
  "ground",
  "button",
  "button-nc",
  "selector",
  "lamp",
  "resistor",
  "capacitor",
  "inductor",
  "fuse",
  "breaker",
  "overload",
  "contactor",
  "motor",
];

function isTerm(v: unknown): v is 0 | 1 {
  return v === 0 || v === 1;
}

export function serialize(
  devices: Device[],
  wires: Wire[],
  projectName: string,
  prev?: PsimMeta,
): string {
  const now = new Date().toISOString();
  const doc: PsimDoc = {
    schema_version: SCHEMA_VERSION,
    meta: {
      id: prev?.id ?? crypto.randomUUID(),
      name: projectName || "Untitled",
      created_at: prev?.created_at ?? now,
      updated_at: now,
    },
    devices,
    wires,
    annotations: [],
  };
  return JSON.stringify(doc, null, 2);
}

export type ParseResult =
  | { ok: true; doc: PsimDoc }
  | { ok: false; errors: string[] };

/** Parse and validate fail-closed: bad reference = refuse to load. */
export function parseAndValidate(text: string): ParseResult {
  const errors: string[] = [];
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["File is not valid JSON"] };
  }
  if (typeof raw !== "object" || raw === null)
    return { ok: false, errors: ["File is not a project object"] };
  const d = raw as Partial<PsimDoc>;
  if (d.schema_version !== SCHEMA_VERSION)
    errors.push(`Unsupported schema_version: ${String(d.schema_version)}`);
  if (typeof d.meta?.name !== "string") errors.push("meta.name missing");
  if (!Array.isArray(d.devices)) errors.push("devices missing");
  if (!Array.isArray(d.wires)) errors.push("wires missing");
  if (errors.length) return { ok: false, errors };

  const ids = new Set<string>();
  for (const [i, dev] of d.devices!.entries()) {
    const at = `devices[${i}]`;
    if (typeof dev?.id !== "string" || !dev.id) errors.push(`${at}: id missing`);
    else if (ids.has(dev.id)) errors.push(`${at}: duplicate id "${dev.id}"`);
    else ids.add(dev.id);
    if (!DEVICE_TYPES.includes(dev?.type))
      errors.push(`${at}: unknown type "${String(dev?.type)}"`);
    if (typeof dev?.x !== "number" || typeof dev?.y !== "number")
      errors.push(`${at}: x/y must be numbers`);
    if (dev && dev.rot !== undefined && ![0, 90, 180, 270].includes(dev.rot))
      errors.push(`${at}: rot must be 0/90/180/270`);
    if (dev?.type === "motor") {
      const c = dev.params?.connection;
      if (c !== undefined && ![6, 9, 12].includes(c as number))
        errors.push(`${at}: motor connection must be 6, 9 or 12`);
    }
    if (dev?.params)
      for (const [k, v] of Object.entries(dev.params))
        if (typeof v !== "number") errors.push(`${at}: params.${k} must be a number`);
  }
  const wids = new Set<string>();
  for (const [i, w] of d.wires!.entries()) {
    const at = `wires[${i}]`;
    if (typeof w?.id !== "string" || !w.id) errors.push(`${at}: id missing`);
    else if (wids.has(w.id)) errors.push(`${at}: duplicate id "${w.id}"`);
    else wids.add(w.id);
    for (const end of [w?.a, w?.b]) {
      if (!end || typeof end.dev !== "string" || !isTerm(end.term)) {
        errors.push(`${at}: malformed endpoint`);
        continue;
      }
      if (!ids.has(end.dev))
        errors.push(`${at}: wire references missing device "${end.dev}"`);
    }
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    doc: {
      schema_version: SCHEMA_VERSION,
      meta: d.meta as PsimMeta,
      devices: d.devices as Device[],
      wires: d.wires as Wire[],
      annotations: [],
    },
  };
}
