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
}
export type Program = Rung[];

export interface PlcIO {
  inputs: boolean[];
  outputs: boolean[];
  mem: boolean[];
  /** completed scan cycles since Run — visible in the status bar */
  scan: number;
}

export const INPUTS = ["I0.0", "I0.1", "I0.2", "I0.3"];
export const OUTPUTS = ["Q0.0", "Q0.1", "Q0.2", "Q0.3"];
export const MEM = ["M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7"];
export const ALL_TAGS = [...INPUTS, ...OUTPUTS, ...MEM];

export const emptyIO = (): PlcIO => ({
  inputs: [false, false, false, false],
  outputs: [false, false, false, false],
  mem: [false, false, false, false, false, false, false, false],
  scan: 0,
});

export function tagState(tag: string, io: PlcIO): boolean {
  const i = INPUTS.indexOf(tag);
  if (i >= 0) return io.inputs[i] ?? false;
  const o = OUTPUTS.indexOf(tag);
  if (o >= 0) return io.outputs[o] ?? false;
  const m = MEM.indexOf(tag);
  if (m >= 0) return io.mem[m] ?? false;
  return false;
}

/** one scan: read inputs (given), evaluate every rung twice so cross-rung
 * references settle, write outputs/markers. Pure & deterministic. */
export function evalLadder(program: Program, io: PlcIO): PlcIO {
  const out: PlcIO = {
    inputs: [...io.inputs],
    outputs: [...io.outputs],
    mem: [...io.mem],
    scan: io.scan,
  };
  for (let pass = 0; pass < 2; pass++) {
    for (const rung of program) {
      const pass = (c: LContact) => {
        const s = tagState(c.tag, out);
        return c.nc ? !s : s;
      };
      const on =
        rung.branches.some((br) => br.contacts.every(pass)) &&
        (rung.tail ?? []).every(pass);
      const o = OUTPUTS.indexOf(rung.coil);
      if (o >= 0) out.outputs[o] = on;
      const m = MEM.indexOf(rung.coil);
      if (m >= 0) out.mem[m] = on;
    }
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
