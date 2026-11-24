import { describe, expect, it } from "vitest";
import { emptyIO, evalLadder, presetsOf, type PlcIO, type Program } from "./ladder";

const seq: Program = [
  {
    id: "r1",
    branches: [{ contacts: [{ tag: "I0.0", nc: false }] }],
    tail: [],
    coil: "T0",
    comment: "on-delay 2 s",
    preset: 2,
  },
  { id: "r2", branches: [{ contacts: [{ tag: "T0", nc: false }] }], tail: [], coil: "Q0.0", comment: "" },
];

describe("M4 timers (TON)", () => {
  it("derives presets from the program", () => {
    expect(presetsOf(seq)[0]).toBe(2000);
    expect(presetsOf([])).toEqual([3000, 3000, 3000, 3000]);
  });

  it("delays the contact until the preset elapses", () => {
    let io: PlcIO = { ...emptyIO(), inputs: [true, false, false, false] };
    // 12 scans × 150 ms = 1.8 s < 2 s → still off
    for (let i = 0; i < 12; i++) io = evalLadder(seq, io, 150);
    expect(io.timers[0]).toBe(1800);
    expect(io.outputs[0]).toBe(false);
    // 2 more scans → 2.1 s → done, output on
    io = evalLadder(seq, io, 150);
    io = evalLadder(seq, io, 150);
    expect(io.timers[0]).toBe(2100);
    expect(io.outputs[0]).toBe(true);
  });

  it("resets immediately when the enabling rung drops", () => {
    let io: PlcIO = { ...emptyIO(), inputs: [true, false, false, false] };
    for (let i = 0; i < 15; i++) io = evalLadder(seq, io, 150);
    expect(io.outputs[0]).toBe(true);
    // input drops → TON resets on the very next scan
    io = evalLadder(seq, { ...io, inputs: [false, false, false, false] }, 150);
    expect(io.timers[0]).toBe(0);
    expect(io.outputs[0]).toBe(false);
  });

  it("drives a flasher loop (T0 ↔ M0 oscillation)", () => {
    const flasher: Program = [
      { id: "r1", branches: [{ contacts: [{ tag: "M0", nc: true }] }], tail: [], coil: "T0", comment: "", preset: 1 },
      { id: "r2", branches: [{ contacts: [{ tag: "T0", nc: false }] }], tail: [], coil: "M0", comment: "" },
      { id: "r3", branches: [{ contacts: [{ tag: "M0", nc: false }] }], tail: [], coil: "Q0.0", comment: "" },
    ];
    let io = emptyIO();
    const highs: boolean[] = [];
    for (let i = 0; i < 40; i++) {
      // strict single-pass semantics inside eval; drive scan-by-scan
      io = evalLadder(flasher, io, 150);
      highs.push(io.outputs[0]);
    }
    const onCount = highs.filter(Boolean).length;
    expect(onCount).toBeGreaterThan(0);
    expect(onCount).toBeLessThan(40); // it really oscillates
    expect(highs.some((v, i) => i > 0 && v !== highs[i - 1])).toBe(true);
  });

  it("sequence template: stage 2 arms only after the delay", () => {
    const program: Program = [
      {
        id: "r1",
        branches: [
          { contacts: [{ tag: "I0.0", nc: false }] },
          { contacts: [{ tag: "Q0.0", nc: false }] },
        ],
        tail: [],
        coil: "Q0.0",
        comment: "stage 1",
      },
      { id: "r2", branches: [{ contacts: [{ tag: "Q0.0", nc: false }] }], tail: [], coil: "T0", comment: "", preset: 3 },
      { id: "r3", branches: [{ contacts: [{ tag: "T0", nc: false }] }], tail: [], coil: "Q0.1", comment: "stage 2" },
    ];
    // start pulse
    let io = evalLadder(program, { ...emptyIO(), inputs: [true, false, false, false] }, 150);
    expect(io.outputs[0]).toBe(true);
    expect(io.outputs[1]).toBe(false);
    // hold start released — seal keeps stage 1; tick 3 s worth of scans
    io = evalLadder(program, { ...io, inputs: [false, false, false, false] }, 150);
    for (let i = 0; i < 19; i++) io = evalLadder(program, io, 150);
    expect(io.outputs[0]).toBe(true);
    expect(io.outputs[1]).toBe(true);
  });
});
