// M2 — Modified Nodal Analysis (DC). Pure TS, no DOM, deterministic.
// Solves node voltages + source currents for the wired circuit:
//   · ideal shorts (wires, closed switches, fuses, inductor, ground) merge nodes
//   · resistive branches (loads, meters) are stamped as conductances
//   · voltage sources (DC/AC RMS/battery/generator) get branch-current unknowns
// Gaussian elimination with partial pivoting; singular systems report a fault.
import type { DeviceType } from "../state/store";

export interface Reading {
  /** voltage across the device, term0 → term1 (loads: positive when feeding) */
  v: number;
  /** current through the device, A (sources: delivered positive) */
  i: number;
}

export interface NodalResult {
  ok: boolean;
  fault?: string;
  readings: Record<string, Reading>;
}

export interface SolDevice {
  id: string;
  type: DeviceType;
  params: Record<string, number>;
}

export interface SolWire {
  id: string;
  a: { dev: string; term: 0 | 1 };
  b: { dev: string; term: 0 | 1 };
}

const termKey = (dev: string, term: 0 | 1) => `${dev}:${term}`;

export const SOURCE_TYPES: DeviceType[] = [
  "source",
  "ac-source",
  "battery",
  "generator",
];

/** ideal shorts: merge their two terminals (normally-closed paths) */
const SHORT_TYPES: DeviceType[] = [
  "ground",
  "fuse",
  "breaker-1p",
  "breaker-3p",
  "mccb",
  "surge",
  "rccb",
  "overload",
  "terminal-block",
  "junction-box",
  "connector",
  "inductor",
  "estop",
  "selector",
  "keyswitch",
  "switch-2way",
  "aux-nc",
];

export function isSource(d: SolDevice): boolean {
  return SOURCE_TYPES.includes(d.type);
}

/** does this device bridge its terminals right now? */
export function isShort(d: SolDevice, pressed: string[], running: boolean): boolean {
  if (SHORT_TYPES.includes(d.type)) return true;
  if (d.type === "button") return running && pressed.includes(d.id);
  if (d.type === "button-nc") return running && !pressed.includes(d.id);
  return false;
}

/** resistive branch resistance in Ω, or null when the type is not resistive */
export function resistanceOf(d: SolDevice): number | null {
  switch (d.type) {
    case "lamp":
    case "lamp-amber":
    case "resistor":
      return d.params.r || 100;
    case "potentiometer":
      return d.params.r || 10000;
    case "thermistor":
      return d.params.r || 1000;
    case "buzzer":
    case "beacon":
      return d.params.r || 500;
    case "voltmeter":
    case "multimeter":
      return 1e6;
    case "ammeter":
    case "clamp":
      return 1e-3;
    default:
      return null;
  }
}

export function isResistive(d: SolDevice): boolean {
  return resistanceOf(d) !== null;
}

/** default EMF per source type (params.v wins) */
export function emfOf(d: SolDevice): number {
  if (d.params.v) return d.params.v;
  if (d.type === "ac-source") return 230;
  if (d.type === "generator") return 400;
  return 24;
}

class Union {
  p = new Map<string, string>();
  find(x: string): string {
    if (!this.p.has(x)) this.p.set(x, x);
    let r = x;
    while (this.p.get(r) !== r) r = this.p.get(r)!;
    let c = x;
    while (this.p.get(c) !== r) {
      const n = this.p.get(c)!;
      this.p.set(c, r);
      c = n;
    }
    return r;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

/** Gaussian elimination with partial pivoting; null when singular. */
function gauss(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let r = k + 1; r < n; r++)
      if (Math.abs(A[r][k]) > Math.abs(A[p][k])) p = r;
    if (Math.abs(A[p][k]) < 1e-12) return null;
    if (p !== k) {
      const t = A[p];
      A[p] = A[k];
      A[k] = t;
      const tb = b[p];
      b[p] = b[k];
      b[k] = tb;
    }
    for (let r = k + 1; r < n; r++) {
      const f = A[r][k] / A[k][k];
      if (f === 0) continue;
      for (let c = k; c < n; c++) A[r][c] -= f * A[k][c];
      b[r] -= f * b[k];
    }
  }
  const x = new Array<number>(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / A[r][r];
  }
  return x;
}

export function solveNodal(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
): NodalResult {
  const sources = devices.filter(isSource);
  if (!running || sources.length === 0)
    return { ok: false, readings: {} };

  // 1) node graph: wires + ideal shorts
  const uf = new Union();
  for (const d of devices) {
    uf.find(termKey(d.id, 0));
    uf.find(termKey(d.id, 1));
  }
  for (const w of wires)
    uf.union(termKey(w.a.dev, w.a.term), termKey(w.b.dev, w.b.term));
  for (const d of devices)
    if (isShort(d, pressed, running))
      uf.union(termKey(d.id, 0), termKey(d.id, 1));

  // 2) node indices — reference = ground node when present, else source term0
  const ground = devices.find((d) => d.type === "ground");
  const refKey = ground
    ? uf.find(termKey(ground.id, 0))
    : uf.find(termKey(sources[0].id, 0));
  const indexOf = new Map<string, number>();
  const nodeCount = (root: string) => {
    if (root === refKey) return -1;
    if (!indexOf.has(root)) indexOf.set(root, indexOf.size);
    return indexOf.get(root)!;
  };
  // pre-register every node so the numbering is stable
  for (const d of devices) {
    nodeCount(uf.find(termKey(d.id, 0)));
    nodeCount(uf.find(termKey(d.id, 1)));
  }

  const n = indexOf.size;
  const m = sources.length;
  const size = n + m;
  const A: number[][] = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0),
  );
  const b = new Array<number>(size).fill(0);

  const idx = (dev: string, term: 0 | 1) => nodeCount(uf.find(termKey(dev, term)));

  // 3) stamp resistive branches
  for (const d of devices) {
    const R = resistanceOf(d);
    if (R === null) continue;
    const a = idx(d.id, 0);
    const bb = idx(d.id, 1);
    if (a === bb) continue; // both ends on one node → 0 V across
    const G = 1 / R;
    if (a >= 0) A[a][a] += G;
    if (bb >= 0) A[bb][bb] += G;
    if (a >= 0 && bb >= 0) {
      A[a][bb] -= G;
      A[bb][a] -= G;
    }
  }

  // 4) stamp voltage sources: + at term1, − at term0 → v(term1) − v(term0) = E
  //    KCL: i leaves the + node into the source branch (passive sign convention);
  //    the delivered current shown to the user is −i.
  const srcRow = new Map<string, number>();
  sources.forEach((s, k) => {
    const row = n + k;
    srcRow.set(s.id, row);
    const a = idx(s.id, 1); // + node
    const bb = idx(s.id, 0); // − node
    // branch-current unknowns appear in the KCL rows of both nodes
    if (a >= 0) A[a][row] += 1;
    if (bb >= 0) A[bb][row] -= 1;
    // constitutive row: v(a) − v(bb) = E (reference node voltage is 0)
    if (a >= 0) A[row][a] += 1;
    if (bb >= 0) A[row][bb] -= 1;
    b[row] = emfOf(s);
  });

  const x = gauss(A, b);
  if (!x)
    return {
      ok: false,
      fault: "Nodal solve failed — conflicting or floating ideal sources",
      readings: {},
    };

  const v = (dev: string, term: 0 | 1) => {
    const i = idx(dev, term);
    return i < 0 ? 0 : x[i];
  };

  // 5) readings
  const readings: Record<string, Reading> = {};
  for (const s of sources) {
    const row = srcRow.get(s.id)!;
    readings[s.id] = {
      v: emfOf(s),
      i: -x[row], // delivered current positive
    };
  }
  for (const d of devices) {
    const R = resistanceOf(d);
    if (R === null) continue;
    const dv = v(d.id, 0) - v(d.id, 1);
    readings[d.id] = { v: dv, i: dv / R };
  }
  // IEEE −0 would stringify as "-0.00" in the UI — normalise it away
  for (const r of Object.values(readings)) {
    if (Object.is(r.v, -0)) r.v = 0;
    if (Object.is(r.i, -0)) r.i = 0;
  }
  return { ok: true, readings };
}
