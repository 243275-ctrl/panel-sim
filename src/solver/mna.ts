// M3 — Modified Nodal Analysis (DC/RMS) with multi-channel devices.
// Node graph from wires + ideal shorts; resistive branches; voltage-source
// branch currents; per-terminal voltages (tv) for PLC input sensing.
// Multi-terminal devices: PLC (pwr + 4 DI + 4 DO), VFD (out/in/DI).
import type { DeviceType } from "../state/store";

export interface Reading {
  /** voltage across the device's main pair (term0 → term1 for loads) */
  v: number;
  /** current through the main pair, A (sources: delivered positive) */
  i: number;
  /** node voltage at EVERY terminal relative to the reference node */
  tv?: number[];
}

export interface NodalResult {
  ok: boolean;
  fault?: string;
  readings: Record<string, Reading>;
}

export interface SolDevice {
  id: string;
  type: DeviceType;
  name: string;
  params: Record<string, number>;
}

export interface SolWire {
  id: string;
  a: { dev: string; term: number };
  b: { dev: string; term: number };
}

/** per-solve switch overrides (linked aux contacts) + PLC/VFD commands */
export interface SolveOpt {
  switches?: Record<string, boolean>;
  plcOut?: boolean[];
  runMap?: Record<string, boolean>;
}

const termKey = (dev: string, term: number) => `${dev}:${term}`;

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
];

export function isSource(d: SolDevice): boolean {
  return SOURCE_TYPES.includes(d.type);
}

/** does this device bridge its terminals right now? */
export function isShort(
  d: SolDevice,
  pressed: string[],
  running: boolean,
  switches?: Record<string, boolean>,
): boolean {
  if (switches && d.id in switches) return switches[d.id];
  if (SHORT_TYPES.includes(d.type)) return true;
  if (d.type === "button") return running && pressed.includes(d.id);
  if (d.type === "button-nc") return running && !pressed.includes(d.id);
  // field sensors close when their process condition is met (params drive them)
  if (d.type === "proximity-sensor") return (d.params.target ?? 0) === 1;
  if (d.type === "photo-sensor") return (d.params.blocked ?? 0) === 1;
  if (d.type === "pressure-sensor")
    return (d.params.pv ?? 0) >= (d.params.sp ?? 10);
  if (d.type === "level-sensor") return (d.params.lv ?? 0) >= (d.params.sp ?? 5);
  // unlinked NC contacts rest closed; NO contacts rest open (linked overrides
  // arrive through the switches map from the settle loop)
  if (d.type === "aux-nc") return true;
  return false;
}

/** resistive branch resistance in Ω (main pair), or null when not resistive */
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
    case "motor":
    case "motor-1ph":
    case "motor-dc":
      return d.params.r || 200;
    case "pt100":
      // standard Pt100 curve: R = 100·(1 + 0.00385·t) — wire it in series
      // with an ammeter or across a divider to read temperature live
      return 100 * (1 + 0.00385 * (d.params.t ?? 20));
    case "contactor":
    case "contactor-rev":
    case "relay":
      return d.params.r || 1200; // coil
    case "plc":
      return 100; // power-pair consumption (stamps skip it & add DI/DO)
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

function gauss(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const x = new Array<number>(n).fill(0);
  const pivotCol = new Array<number>(n).fill(-1);
  let row = 0;
  for (let k = 0; k < n && row < n; k++) {
    // partial pivot over the active rows
    let p = -1;
    for (let r = row; r < n; r++)
      if (p < 0 || Math.abs(A[r][k]) > Math.abs(A[p][k])) {
        if (Math.abs(A[r][k]) > 1e-12) p = r;
      }
    if (p < 0) continue; // column k never pivots → unknown stays free (0)
    if (p !== row) {
      const t = A[p];
      A[p] = A[row];
      A[row] = t;
      const tb = b[p];
      b[p] = b[row];
      b[row] = tb;
    }
    const kp = A[row][k];
    for (let r = row + 1; r < n; r++) {
      const f = A[r][k] / kp;
      if (f === 0) continue;
      for (let c = k; c < n; c++) A[r][c] -= f * A[row][c];
      b[r] -= f * b[row];
    }
    pivotCol[row] = k;
    row++;
  }
  // leftover rows: all-zero coefficients must carry a zero rhs,
  // otherwise the circuit is over-constrained (conflicting ideal sources)
  for (let r = row; r < n; r++) if (Math.abs(b[r]) > 1e-9) return null;
  // back-substitution over pivot rows
  for (let r = row - 1; r >= 0; r--) {
    const k = pivotCol[r];
    let s = b[r];
    for (let c = k + 1; c < n; c++) s -= A[r][c] * x[c];
    x[k] = s / A[r][k];
  }
  return x;
}

export function solveNodal(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
  opt: SolveOpt = {},
): NodalResult {
  const sources = devices.filter(isSource);
  const plcOut = opt.plcOut ?? [false, false, false, false];
  const runMap = opt.runMap ?? {};
  const hasE =
    running &&
    (sources.length > 0 || plcOut.some(Boolean) || Object.values(runMap).some(Boolean));
  if (!hasE) return { ok: false, readings: {} };

  // 1) node graph: wires + ideal shorts (incl. switch overrides & sensors)
  const uf = new Union();
  const ufTerms = (d: SolDevice) => (d.type === "plc" ? 10 : d.type === "vfd" ? 6 : 2);
  for (const d of devices)
    for (let t = 0; t < ufTerms(d); t++) uf.find(termKey(d.id, t));
  for (const w of wires)
    uf.union(termKey(w.a.dev, w.a.term), termKey(w.b.dev, w.b.term));
  for (const d of devices)
    if (isShort(d, pressed, running, opt.switches))
      uf.union(termKey(d.id, 0), termKey(d.id, 1));

  // 2) node indices — reference = ground node when present, else source term0
  const ground = devices.find((d) => d.type === "ground");
  const refDevice = ground ?? sources[0] ?? devices[0];
  const refKey = uf.find(termKey(refDevice.id, 0));
  const indexOf = new Map<string, number>();
  const nodeCount = (root: string) => {
    if (root === refKey) return -1;
    if (!indexOf.has(root)) indexOf.set(root, indexOf.size);
    return indexOf.get(root)!;
  };
  // pre-register EVERY terminal (PLC: 10, VFD: 6) so n is final before
  // the matrix is allocated — lazy registration would corrupt indexing
  const termCountOf = (d: SolDevice) =>
    d.type === "plc" ? 10 : d.type === "vfd" ? 6 : 2;
  for (const d of devices)
    for (let t = 0; t < termCountOf(d); t++)
      nodeCount(uf.find(termKey(d.id, t)));

  const n = indexOf.size;
  const srcCount = sources.length;
  // extra branch-current unknowns: type sources + VFD outputs + PLC DO channels
  const vfdDevs = devices.filter(
    (d) => d.type === "vfd" && (runMap[d.id] || d.params.run === 1),
  );
  const doChans: { dev: SolDevice; ch: number }[] = [];
  const plc = devices.find((d) => d.type === "plc");
  if (plc) {
    for (let ch = 0; ch < 4; ch++)
      if (plcOut[ch]) doChans.push({ dev: plc, ch });
  }
  const branchUnknowns = srcCount + vfdDevs.length + doChans.length;
  const size = n + branchUnknowns;
  const A: number[][] = Array.from({ length: size }, () =>
    new Array<number>(size).fill(0),
  );
  const b = new Array<number>(size).fill(0);

  const idx = (dev: string, term: number) => nodeCount(uf.find(termKey(dev, term)));

  const stampR = (a: number, bb: number, R: number) => {
    if (a === bb) return;
    const G = 1 / R;
    if (a >= 0) A[a][a] += G;
    if (bb >= 0) A[bb][bb] += G;
    if (a >= 0 && bb >= 0) {
      A[a][bb] -= G;
      A[bb][a] -= G;
    }
  };
  let rowCursor = n;
  const stampV = (plus: number, minus: number, E: number) => {
    const row = rowCursor++;
    if (plus >= 0) {
      A[plus][row] += 1;
      A[row][plus] += 1;
    }
    if (minus >= 0) {
      A[minus][row] -= 1;
      A[row][minus] -= 1;
    }
    b[row] = E;
    return row;
  };
  const srcRow = new Map<string, number>();

  // 3) resistive main-pair devices (2-terminal loads & coils)
  for (const d of devices) {
    if (d.type === "plc" || d.type === "vfd") continue;
    const R = resistanceOf(d);
    if (R === null) continue;
    stampR(idx(d.id, 0), idx(d.id, 1), R);
  }

  // 4) type sources: + at term1, − at term0 → v(term1) − v(term0) = E
  for (const s of sources) {
    const row = stampV(idx(s.id, 1), idx(s.id, 0), emfOf(s));
    srcRow.set(s.id, row);
  }

  // 5) VFD channels: out pair (U=0,W=1) source at E = 400·f/50 when running;
  //    mains pair (L=2,N=3) R load; DI1 sense R to COM (5)
  const vfdRow = new Map<string, number>();
  for (const vf of vfdDevs) {
    const f = vf.params.f ?? 50;
    const E = 400 * (f / 50);
    vfdRow.set(vf.id, stampV(idx(vf.id, 1), idx(vf.id, 0), E));
    stampR(idx(vf.id, 2), idx(vf.id, 3), 2000); // line-side draw
    stampR(idx(vf.id, 4), idx(vf.id, 5), 1e4); // DI1 sense
  }

  // 6) PLC channels: pwr pair (L+=0, M=1) R load; DI (2+i ↔ 1) 10k sink;
  //    DO (6+i → 1) sourcing 24 V when the program turns the bit on
  const doRow = new Map<number, number>();
  if (plc) {
    stampR(idx(plc.id, 0), idx(plc.id, 1), 100);
    for (let ch = 0; ch < 4; ch++) stampR(idx(plc.id, 2 + ch), idx(plc.id, 1), 1e4);
    for (const { dev, ch } of doChans)
      doRow.set(ch, stampV(idx(dev.id, 6 + ch), idx(dev.id, 1), 24));
  }

  const x = gauss(A, b);
  if (!x)
    return {
      ok: false,
      fault: "Nodal solve failed — conflicting or floating ideal sources",
      readings: {},
    };

  const vAt = (dev: string, term: number) => {
    const i = idx(dev, term);
    return i < 0 ? 0 : x[i];
  };

  // 7) readings — main pair + per-terminal voltages for everyone
  const readings: Record<string, Reading> = {};
  for (const d of devices) {
    const tv: number[] = [];
    for (let t = 0; t < termCountOf(d); t++) tv.push(vAt(d.id, t));
    const dv = (tv[0] ?? 0) - (tv[1] ?? 0);
    readings[d.id] = { v: dv, i: 0, tv };
  }
  for (const s of sources) {
    const row = srcRow.get(s.id)!;
    readings[s.id] = { v: emfOf(s), i: -x[row], tv: readings[s.id].tv };
  }
  for (const vf of vfdDevs) {
    const row = vfdRow.get(vf.id)!;
    readings[vf.id] = { v: 400 * ((vf.params.f ?? 50) / 50), i: -x[row], tv: readings[vf.id].tv };
  }
  for (const d of devices) {
    const R = resistanceOf(d);
    if (R === null || isSource(d)) continue;
    const r = readings[d.id];
    r.i = r.v / R;
  }
  if (plc) {
    const r = readings[plc.id];
    const pwr = (r.tv?.[0] ?? 0) - (r.tv?.[1] ?? 0);
    r.v = pwr;
    r.i = pwr / 100;
  }
  // normalise IEEE −0 for the UI
  for (const r of Object.values(readings)) {
    if (Object.is(r.v, -0)) r.v = 0;
    if (Object.is(r.i, -0)) r.i = 0;
    if (r.tv) r.tv = r.tv.map((t) => (Object.is(t, -0) ? 0 : t));
  }
  return { ok: true, readings };
}
