// .psim project files — versioned JSON with fail-closed validation.
import type { Device, DeviceType, Wire } from "./store";
import { termCount } from "../data/library";
import { ALL_TAGS, type Program } from "../solver/ladder";

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
  /** ladder program (M3) — optional so v1 files without one still load */
  program?: Program;
}

export const DEVICE_TYPES: DeviceType[] = [
  "source",
  "ac-source",
  "ground",
  "transformer-1p",
  "transformer-3p",
  "battery",
  "generator",
  "button",
  "button-nc",
  "estop",
  "selector",
  "switch-2way",
  "keyswitch",
  "lamp",
  "lamp-amber",
  "buzzer",
  "beacon",
  "contactor",
  "contactor-rev",
  "relay",
  "aux-no",
  "aux-nc",
  "changeover",
  "fuse",
  "breaker-1p",
  "breaker-3p",
  "mccb",
  "overload",
  "surge",
  "rccb",
  "resistor",
  "capacitor",
  "inductor",
  "potentiometer",
  "thermistor",
  "motor",
  "motor-1ph",
  "motor-dc",
  "vfd",
  "servo-drive",
  "multimeter",
  "clamp",
  "voltmeter",
  "ammeter",
  "pt100",
  "pressure-sensor",
  "proximity-sensor",
  "photo-sensor",
  "level-sensor",
  "plc",
  "plc-expansion",
  "analog-module",
  "terminal-block",
  "junction-box",
  "connector",
];

function isTerm(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0;
}

export function serialize(
  devices: Device[],
  wires: Wire[],
  projectName: string,
  prev?: PsimMeta,
  program?: Program,
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
    program: program && program.length ? program : undefined,
  };
  return JSON.stringify(doc, null, 2);
}

/** fail-closed ladder program shape check */
function validateProgram(p: unknown, errors: string[]): Program | undefined {
  if (p === undefined) return undefined;
  if (!Array.isArray(p)) {
    errors.push("program must be an array");
    return undefined;
  }
  const contact = (c: unknown, at: string) => {
    const ct = c as { tag?: unknown; nc?: unknown };
    if (typeof ct?.tag !== "string" || !ALL_TAGS.includes(ct.tag))
      errors.push(`${at}: unknown tag "${String(ct?.tag)}"`);
    if (typeof ct?.nc !== "boolean") errors.push(`${at}: nc must be boolean`);
  };
  p.forEach((r, i) => {
    const at = `program[${i}]`;
    const rung = r as Record<string, unknown>;
    if (typeof rung?.id !== "string" || !rung.id) errors.push(`${at}: id missing`);
    if (!Array.isArray(rung?.branches)) errors.push(`${at}: branches missing`);
    else
      (rung.branches as unknown[]).forEach((b, j) => {
        const br = b as { contacts?: unknown };
        if (!Array.isArray(br?.contacts)) errors.push(`${at}.branches[${j}]: contacts missing`);
        else (br.contacts as unknown[]).forEach((c, k) => contact(c, `${at}.branches[${j}].contacts[${k}]`));
      });
    if (rung?.tail !== undefined) {
      if (!Array.isArray(rung.tail)) errors.push(`${at}: tail must be an array`);
      else (rung.tail as unknown[]).forEach((c, j) => contact(c, `${at}.tail[${j}]`));
    }
    if (typeof rung?.coil !== "string" || !ALL_TAGS.includes(rung.coil as string))
      errors.push(`${at}: coil must be a known tag`);
    if (rung?.comment !== undefined && typeof rung.comment !== "string")
      errors.push(`${at}: comment must be a string`);
  });
  if (errors.length) return undefined;
  return p as Program;
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
    const typeById = new Map(d.devices!.map((x) => [x.id, x.type]));
    for (const end of [w?.a, w?.b]) {
      if (!end || typeof end.dev !== "string" || !isTerm(end.term)) {
        errors.push(`${at}: malformed endpoint`);
        continue;
      }
      if (!ids.has(end.dev)) {
        errors.push(`${at}: wire references missing device "${end.dev}"`);
        continue;
      }
      const t = typeById.get(end.dev);
      const max = t ? termCount(t) : 2;
      if (end.term >= max)
        errors.push(`${at}: terminal ${end.term} out of range for "${end.dev}" (has ${max})`);
    }
  }
  const program = validateProgram(d.program, errors);
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    doc: {
      schema_version: SCHEMA_VERSION,
      meta: d.meta as PsimMeta,
      devices: d.devices as Device[],
      wires: d.wires as Wire[],
      annotations: [],
      program,
    },
  };
}
