// panel-sim circuit solver — M0/M1 loop detection + M2 nodal (MNA) readings.
// Pure module, no DOM, deterministic.

import type { DeviceType } from "../state/store";
import {
  emfOf,
  isResistive,
  isShort,
  isSource,
  resistanceOf,
  solveNodal,
  type Reading,
} from "./mna";

export interface SolDevice {
  id: string;
  type: DeviceType;
  name: string;
  params: Record<string, number>;
}

export interface SolWire {
  id: string;
  a: { dev: string; term: 0 | 1 };
  b: { dev: string; term: 0 | 1 };
}

export interface SimResult {
  /** lamp ids that are lit */
  lit: Set<string>;
  /** wire ids carrying current (closed loop) */
  live: Set<string>;
  /** source current in amps (0 when open / stopped / shorted) */
  current: number;
  /** human-readable problems; empty = healthy */
  faults: string[];
  /** true when source's two terminals are joined through closed devices */
  closed: boolean;
  /** per-device MNA readings (sources + resistive branches) */
  readings: Record<string, Reading>;
}

const termKey = (dev: string, term: 0 | 1) => `${dev}:${term}`;

class Union {
  p = new Map<string, string>();
  find(x: string): string {
    let r = x;
    while (this.p.get(r) !== undefined && this.p.get(r) !== r)
      r = this.p.get(r)!;
    if (!this.p.has(x)) this.p.set(x, r === undefined ? x : r);
    if (this.p.get(x) !== x) this.p.set(x, this.find(r));
    return this.p.get(x) ?? x;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
  same(a: string, b: string) {
    return this.find(a) === this.find(b);
  }
}

/** types the solver models today (everything else reports a milestone fault) */
const MODELLED: DeviceType[] = [
  "source",
  "ac-source",
  "battery",
  "generator",
  "ground",
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
  "aux-nc",
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
  "voltmeter",
  "ammeter",
  "multimeter",
  "clamp",
  "terminal-block",
  "junction-box",
  "connector",
];

export function simulate(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
): SimResult {
  const faults: string[] = [];
  const lit = new Set<string>();
  const live = new Set<string>();
  let readings: Record<string, Reading> = {};
  let current = 0;

  // dangling terminals
  const touched = new Set<string>();
  for (const w of wires) {
    touched.add(termKey(w.a.dev, w.a.term));
    touched.add(termKey(w.b.dev, w.b.term));
  }
  for (const d of devices)
    for (const t of [0, 1] as const)
      if (!touched.has(termKey(d.id, t)))
        faults.push(`${d.name}: terminal ${t === 0 ? "1" : "2"} not connected`);

  const sources = devices.filter(isSource);
  if (devices.length > 0 && sources.length === 0)
    faults.push("No power source in the circuit");

  // unmodelled types: only complain about parts that are actually wired in
  const wired = new Set<string>();
  for (const w of wires) {
    wired.add(w.a.dev);
    wired.add(w.b.dev);
  }
  for (const d of devices)
    if (!MODELLED.includes(d.type) && wired.has(d.id))
      faults.push(`${d.name}: simulation model arrives in a later milestone`);

  // connectivity view: wires + everything that bridges its terminals right now
  const uf = new Union();
  for (const d of devices) {
    uf.find(termKey(d.id, 0));
    uf.find(termKey(d.id, 1));
  }
  for (const w of wires) uf.union(termKey(w.a.dev, w.a.term), termKey(w.b.dev, w.b.term));
  const bridges = (d: SolDevice) =>
    isShort(d, pressed, running) || isResistive(d);
  for (const d of devices)
    if (bridges(d)) uf.union(termKey(d.id, 0), termKey(d.id, 1));

  // loop detection + short-circuit guard (a source never bridges itself)
  let closed = false;
  let shorted = false;
  const source = sources[0];
  if (source && running) {
    closed = uf.same(termKey(source.id, 0), termKey(source.id, 1));
    if (closed) {
      const root = uf.find(termKey(source.id, 0));
      const loads = devices.filter(
        (d) => isResistive(d) && uf.find(termKey(d.id, 0)) === root,
      );
      const totalR = loads.reduce((s, d) => s + (resistanceOf(d) ?? 0), 0);
      if (loads.length === 0 || totalR < 0.01) {
        faults.push(
          loads.length === 0
            ? "Short circuit — no load in the loop"
            : "Short circuit — path resistance too low",
        );
        closed = false;
        shorted = true;
      }
    }
  }

  // nodal analysis: real voltages/currents whenever the model is solvable
  if (running && source && !shorted) {
    const nodal = solveNodal(devices, wires, pressed, running);
    if (nodal.ok) {
      readings = nodal.readings;
      const sr = readings[source.id];
      if (sr) current = sr.i;
      for (const d of devices)
        if (d.type === "lamp" || d.type === "lamp-amber") {
          const r = readings[d.id];
          if (r && Math.abs(r.v) > 0.05) lit.add(d.id);
        }
      if (closed) {
        const loopRoot = uf.find(termKey(source.id, 0));
        for (const w of wires)
          if (
            uf.find(termKey(w.a.dev, w.a.term)) === loopRoot &&
            uf.find(termKey(w.b.dev, w.b.term)) === loopRoot
          )
            live.add(w.id);
      }
    } else if (nodal.fault) {
      faults.push(nodal.fault);
    }
  }

  return { lit, live, current, faults, closed, readings };
}

/** default EMF re-exported for labels/UI */
export { emfOf };
