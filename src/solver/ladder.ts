// M3 — ladder program model + scan evaluation.
// Rung = OR of series-contact branches feeding one coil (classic DOL shape).
// Tags: physical inputs I0.x, outputs Q0.x, marker bits M0..M7.
// Unknown tags read as OFF (fail-safe, open contact).
export interface LContact {
  tag: string;
  nc: boolean;
}
export interface LBranch {
  contacts: LContact[];
}
export interface Rung {
  id: string;
  /** OR-group: any branch fully conducting energises the path */
  branches: LBranch[];
  /** series contacts AFTER the OR-group (stop conditions) — all must pass */
  tail: LContact[];
  coil: string;
  comment: string;
  /** on-delay preset in seconds — used when coil is a timer tag T0..T3 */
  preset?: number;
}
export type Program = Rung[];

export interface PlcIO {
  inputs: boolean[];
  outputs: boolean[];
  mem: boolean[];
  /** accumulated on-delay time per timer, ms */
  timers: number[];
  /** completed scan cycles since Run — visible in the status bar */
  scan: number;
}

export const INPUTS = ["I0.0", "I0.1", "I0.2", "I0.3"];
export const OUTPUTS = ["Q0.0", "Q0.1", "Q0.2", "Q0.3"];
export const MEM = ["M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7"];
/** on-delay timers T0..T3 — preset lives on the rung driving their coil */
export const TIMERS = ["T0", "T1", "T2", "T3"];
export const ALL_TAGS = [...INPUTS, ...OUTPUTS, ...MEM, ...TIMERS];

export const emptyIO = (): PlcIO => ({
  inputs: [false, false, false, false],
  outputs: [false, false, false, false],
  mem: [false, false, false, false, false, false, false, false],
  timers: [0, 0, 0, 0],
  scan: 0,
});

/** preset in ms for each timer tag, derived from the program rungs */
export function presetsOf(program: Program): number[] {
  return TIMERS.map((tag) => {
    const rung = program.find((r) => r.coil === tag);
    return Math.max(0, (rung?.preset ?? 3) * 1000);
  });
}

export function tagState(
  tag: string,
  io: PlcIO,
  presets?: number[],
): boolean {
  const i = INPUTS.indexOf(tag);
  if (i >= 0) return io.inputs[i] ?? false;
  const o = OUTPUTS.indexOf(tag);
  if (o >= 0) return io.outputs[o] ?? false;
  const m = MEM.indexOf(tag);
  if (m >= 0) return io.mem[m] ?? false;
  const t = TIMERS.indexOf(tag);
  if (t >= 0) {
    const setpoint = presets?.[t] ?? 3000;
    return (io.timers?.[t] ?? 0) >= setpoint;
  }
  return false;
}

/** one scan: evaluate rungs top-to-bottom (timers accumulate once, on the
 * first pass), then a second pass settles cross-rung references.
 * dtMs = time represented by this scan (150 ms live, injectable in tests). */
export function evalLadder(program: Program, io: PlcIO, dtMs = 0): PlcIO {
  const out: PlcIO = {
    inputs: [...io.inputs],
    outputs: [...io.outputs],
    mem: [...io.mem],
    timers: [...(io.timers ?? [0, 0, 0, 0])],
    scan: io.scan,
  };
  const presets = presetsOf(program);
  const evaluate = (rung: Rung) => {
    const test = (c: LContact) => {
      const s = tagState(c.tag, out, presets);
      return c.nc ? !s : s;
    };
    return (
      rung.branches.some((br) => br.contacts.every(test)) &&
      (rung.tail ?? []).every(test)
    );
  };

  // pass 1 — live logic + timer accumulation (dt applied exactly once)
  for (const rung of program) {
    const on = evaluate(rung);
    const ti = TIMERS.indexOf(rung.coil);
    if (ti >= 0) {
      if (on) out.timers[ti] = (out.timers[ti] ?? 0) + Math.max(0, dtMs);
      else out.timers[ti] = 0; // TON resets when its rung drops
      continue;
    }
    const o = OUTPUTS.indexOf(rung.coil);
    if (o >= 0) out.outputs[o] = on;
    const m = MEM.indexOf(rung.coil);
    if (m >= 0) out.mem[m] = on;
  }
  // pass 2 — settle cross-rung references (no extra accumulation)
  for (const rung of program) {
    const ti = TIMERS.indexOf(rung.coil);
    if (ti >= 0) continue;
    const on = evaluate(rung);
    const o = OUTPUTS.indexOf(rung.coil);
    if (o >= 0) out.outputs[o] = on;
    const m = MEM.indexOf(rung.coil);
    if (m >= 0) out.mem[m] = on;
  }
  return out;
}

/** does this rung reference tag X as a contact or coil? (editor helpers) */
export function touchesTag(program: Program, tag: string): boolean {
  return program.some(
    (r) =>
      r.coil === tag ||
      r.branches.some((b) => b.contacts.some((c) => c.tag === tag)) ||
      (r.tail ?? []).some((c) => c.tag === tag),
  );
}
