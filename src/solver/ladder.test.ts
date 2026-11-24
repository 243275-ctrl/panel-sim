import { describe, expect, it } from "vitest";
import { emptyIO, evalLadder, tagState, type Program } from "./ladder";

describe("ladder scan", () => {
  it("passes power through a NO contact to the coil", () => {
    const p: Program = [
      { id: "r1", branches: [{ contacts: [{ tag: "I0.0", nc: false }] }], tail: [], coil: "Q0.0", comment: "" },
    ];
    const off = evalLadder(p, emptyIO());
    expect(off.outputs[0]).toBe(false);
    const on = evalLadder(p, { ...emptyIO(), inputs: [true, false, false, false] });
    expect(on.outputs[0]).toBe(true);
  });

  it("inverts an NC contact", () => {
    const p: Program = [
      { id: "r1", branches: [{ contacts: [{ tag: "I0.1", nc: true }] }], tail: [], coil: "Q0.1", comment: "" },
    ];
    const idle = evalLadder(p, { ...emptyIO(), inputs: [false, true, false, false] });
    expect(idle.outputs[1]).toBe(false);
    const released = evalLadder(p, emptyIO());
    expect(released.outputs[1]).toBe(true);
  });

  it("holds a seal-in; series stop breaks the latch", () => {
    const p: Program = [
      {
        id: "r1",
        branches: [
          { contacts: [{ tag: "I0.0", nc: false }] },
          { contacts: [{ tag: "Q0.0", nc: false }] },
        ],
        tail: [],
        coil: "Q0.0",
        comment: "DOL seal-in",
      },
    ];
    // pulse start → latched
    const s1 = evalLadder(p, { ...emptyIO(), inputs: [true, false, false, false] });
    expect(s1.outputs[0]).toBe(true);
    // release start → seal contact holds
    const s2 = evalLadder(p, { ...s1, inputs: [false, false, false, false] });
    expect(s2.outputs[0]).toBe(true);

    // proper DOL: stop NC in series AFTER the OR-group kills the seal
    const dol: Program = [
      {
        id: "r1",
        branches: [
          { contacts: [{ tag: "I0.0", nc: false }] },
          { contacts: [{ tag: "Q0.0", nc: false }] },
        ],
        tail: [{ tag: "I0.1", nc: true }],
        coil: "Q0.0",
        comment: "start / seal / stop",
      },
    ];
    const stopped = evalLadder(dol, { ...s2, inputs: [false, true, false, false] });
    expect(stopped.outputs[0]).toBe(false);
    // and once released with start still held out, it stays off (seal broken)
    const after = evalLadder(dol, { ...stopped, inputs: [false, false, false, false] });
    expect(after.outputs[0]).toBe(false);
    // restart possible
    const restart = evalLadder(dol, { ...after, inputs: [true, false, false, false] });
    expect(restart.outputs[0]).toBe(true);
  });

  it("resolves cross-rung references within one scan", () => {
    const p: Program = [
      { id: "r1", branches: [{ contacts: [{ tag: "I0.0", nc: false }] }], tail: [], coil: "M0", comment: "" },
      { id: "r2", branches: [{ contacts: [{ tag: "M0", nc: false }] }], tail: [], coil: "Q0.2", comment: "" },
    ];
    const out = evalLadder(p, { ...emptyIO(), inputs: [true, false, false, false] });
    expect(out.mem[0]).toBe(true);
    expect(out.outputs[2]).toBe(true);
  });

  it("treats unknown tags as open (fail-safe)", () => {
    const p: Program = [
      { id: "r1", branches: [{ contacts: [{ tag: "I9.9", nc: false }] }], tail: [], coil: "Q0.3", comment: "" },
    ];
    const out = evalLadder(p, emptyIO());
    expect(out.outputs[3]).toBe(false);
    expect(tagState("I9.9", emptyIO())).toBe(false);
  });

  it("passes the IO image through unchanged when there are no rungs", () => {
    const io = emptyIO();
    io.outputs[0] = true;
    expect(evalLadder([], io).outputs[0]).toBe(true);
  });
});
