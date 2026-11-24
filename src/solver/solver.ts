// panel-sim circuit solver — M3: loop detection + MNA + PLC scan + settling.
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
  type SolDevice,
  type SolWire,
} from "./mna";
import { evalLadder, INPUTS, type PlcIO, type Program } from "./ladder";

export type { SolDevice, SolWire };

export interface SimResult {
  lit: Set<string>;
  live: Set<string>;
  current: number;
  faults: string[];
  closed: boolean;
  readings: Record<string, Reading>;
  /** contactor/relay coils with voltage across them (>12 V = pulled in) */
  energized: Set<string>;
  /** motors with applied voltage (spinning) */
  spin: Set<string>;
  /** linked aux/contact switch final state after settling */
  switches: Record<string, boolean>;
}

export interface SimCtx {
  /** PLC output image from the last scan (drives DO sourcing channels) */
  plcOut?: boolean[];
}

const termKey = (dev: string, term: number) => `${dev}:${term}`;

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

/** types the solver models — everything else reports a milestone fault */
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
  "voltmeter",
  "ammeter",
  "multimeter",
  "clamp",
  "proximity-sensor",
  "photo-sensor",
  "pressure-sensor",
  "level-sensor",
  "plc",
  "terminal-block",
  "junction-box",
  "connector",
];

const COIL_TYPES: DeviceType[] = ["contactor", "contactor-rev", "relay"];
const AUX_TYPES: DeviceType[] = ["aux-no", "aux-nc", "changeover"];

/** initial switch state from device params (before any solve) */
function initialSwitches(devices: SolDevice[], pressed: string[], running: boolean): Record<string, boolean> {
  const sw: Record<string, boolean> = {};
  for (const d of devices)
    if (AUX_TYPES.includes(d.type)) sw[d.id] = d.type === "aux-nc";
  void pressed;
  void running;
  return sw;
}

/** linked-contact + VFD command states derived from the latest readings */
function deriveStates(
  devices: SolDevice[],
  readings: Record<string, Reading>,
  plcOut: boolean[],
): { switches: Record<string, boolean>; runMap: Record<string, boolean> } {
  const switches: Record<string, boolean> = {};
  // coil energisation → linked aux contacts follow their group tag
  const coilOn = (grp: number | undefined) => {
    if (!grp || grp <= 0) return false;
    return devices.some(
      (d) =>
        COIL_TYPES.includes(d.type) &&
        (d.params.grp ?? 1) === grp &&
        Math.abs(readings[d.id]?.v ?? 0) > 12,
    );
  };
  for (const d of devices) {
    if (d.type === "aux-no" || d.type === "changeover") {
      switches[d.id] = coilOn(d.params.grp ?? 1);
    } else if (d.type === "aux-nc") {
      switches[d.id] = !coilOn(d.params.grp ?? 1);
    }
  }
  // VFD: local panel run OR remote DI1 command (>12 V vs COM)
  const runMap: Record<string, boolean> = {};
  for (const d of devices)
    if (d.type === "vfd") {
      const di = (readings[d.id]?.tv?.[4] ?? 0) - (readings[d.id]?.tv?.[5] ?? 0);
      runMap[d.id] = d.params.run === 1 || di > 12;
    }
  void plcOut;
  return { switches, runMap };
}

export function simulate(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
  ctx: SimCtx = {},
): SimResult {
  const faults: string[] = [];
  const lit = new Set<string>();
  const live = new Set<string>();
  const spin = new Set<string>();
  let readings: Record<string, Reading> = {};
  let current = 0;
  const energized = new Set<string>();

  const plcOut = ctx.plcOut ?? [false, false, false, false];

  // dangling terminals
  const touched = new Set<string>();
  for (const w of wires) {
    touched.add(termKey(w.a.dev, w.a.term));
    touched.add(termKey(w.b.dev, w.b.term));
  }
  for (const d of devices) {
    const n = d.type === "plc" ? 10 : d.type === "vfd" ? 6 : 2;
    for (let t = 0; t < n; t++)
      if (!touched.has(termKey(d.id, t))) {
        // multi-terminal modules: only require the main pair + note I/O wiring
        if ((d.type === "plc" || d.type === "vfd") && t >= 2) continue;
        faults.push(`${d.name}: terminal ${t + 1} not connected`);
      }
  }

  const sources = devices.filter(isSource);
  if (devices.length > 0 && sources.length === 0 && plcOut.some(Boolean) === false && devices.some((d) => d.type === "plc" || d.type === "vfd") === false)
    faults.push("No power source in the circuit");

  const wired = new Set<string>();
  for (const w of wires) {
    wired.add(w.a.dev);
    wired.add(w.b.dev);
  }
  for (const d of devices)
    if (!MODELLED.includes(d.type) && wired.has(d.id))
      faults.push(`${d.name}: simulation model arrives in a later milestone`);

  // ---- settle: switch states & VFD commands vs MNA (max 5 passes) ----
  let switches = initialSwitches(devices, pressed, running);
  let runMap: Record<string, boolean> = {};
  for (const d of devices) if (d.type === "vfd") runMap[d.id] = d.params.run === 1;
  let nodal: { ok: boolean; readings: Record<string, Reading>; fault?: string } = {
    ok: false,
    readings: {},
  };
  for (let iter = 0; iter < 5; iter++) {
    nodal = solveNodal(devices, wires, pressed, running, { switches, plcOut, runMap });
    const next = deriveStates(devices, nodal.readings, plcOut);
    const same =
      JSON.stringify(next.switches) === JSON.stringify(switches) &&
      JSON.stringify(next.runMap) === JSON.stringify(runMap);
    switches = next.switches;
    runMap = next.runMap;
    if (same || !nodal.ok) break;
  }
  if (nodal.ok) readings = nodal.readings;
  else if (nodal.fault) faults.push(nodal.fault);

  // connectivity view with final switch states
  const uf = new Union();
  const ufTerms = (d: SolDevice) => (d.type === "plc" ? 10 : d.type === "vfd" ? 6 : 2);
  for (const d of devices)
    for (let t = 0; t < ufTerms(d); t++) uf.find(termKey(d.id, t));
  for (const w of wires) uf.union(termKey(w.a.dev, w.a.term), termKey(w.b.dev, w.b.term));
  const bridges = (d: SolDevice) =>
    isShort(d, pressed, running, switches) ||
    isResistive(d) ||
    (d.type === "vfd" && runMap[d.id] === true);
  for (const d of devices)
    if (bridges(d)) uf.union(termKey(d.id, 0), termKey(d.id, 1));

  // loop detection + short-circuit guard
  let closed = false;
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
      } else {
        current = nodal.ok ? (readings[source.id]?.i ?? 0) : 0;
        if (closed) {
          const loopRoot = root;
          for (const w of wires)
            if (
              uf.find(termKey(w.a.dev, w.a.term)) === loopRoot &&
              uf.find(termKey(w.b.dev, w.b.term)) === loopRoot
            )
              live.add(w.id);
        }
      }
    }
  }
  // sources outside the classic loop (e.g. VFD feeding a motor) still report
  if (!current && nodal.ok) {
    for (const s of sources) {
      const i = readings[s.id]?.i ?? 0;
      if (Math.abs(i) > Math.abs(current)) current = i;
    }
  }

  // device states from readings
  if (nodal.ok) {
    for (const d of devices) {
      if (d.type === "lamp" || d.type === "lamp-amber") {
        if (Math.abs(readings[d.id]?.v ?? 0) > 0.05) lit.add(d.id);
      }
      if (COIL_TYPES.includes(d.type) && Math.abs(readings[d.id]?.v ?? 0) > 12)
        energized.add(d.id);
      if (
        (d.type === "motor" || d.type === "motor-1ph" || d.type === "motor-dc") &&
        Math.abs(readings[d.id]?.v ?? 0) > 10
      )
        spin.add(d.id);
    }
  }

  return { lit, live, current, faults, closed, readings, energized, spin, switches };
}

/** one PLC scan: electrical image → inputs → ladder → outputs.
 * Caller (store tick) owns the scan counter. */
export function scanPlc(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
  program: Program,
  prev: PlcIO,
): PlcIO {
  if (!running) return prev;
  const sim = simulate(devices, wires, pressed, true, { plcOut: prev.outputs });
  const plc = devices.find((d) => d.type === "plc");
  const inputs = [false, false, false, false];
  if (plc) {
    const tv = sim.readings[plc.id]?.tv;
    if (tv)
      for (let i = 0; i < 4; i++)
        inputs[i] = (tv[2 + i] ?? 0) - (tv[1] ?? 0) > 12;
  }
  const base: PlcIO = { inputs, outputs: prev.outputs, mem: prev.mem, scan: prev.scan };
  if (program.length === 0 || !plc) {
    // STOP mode: outputs de-energise
    return { ...base, outputs: [false, false, false, false] };
  }
  return evalLadder(program, base);
}

/** default EMF re-exported for labels/UI */
export { emfOf, INPUTS };
