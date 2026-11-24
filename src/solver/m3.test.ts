import { describe, expect, it } from "vitest";
import { plcDemoProject } from "../state/store";
import { simulate, scanPlc } from "./solver";
import { emptyIO, type PlcIO } from "./ladder";

describe("M3 — PLC demo end-to-end", () => {
  it("sensor → ladder seal → output → contactor → linked contact → motor", () => {
    const { devices, wires, program } = plcDemoProject();

    // 1) idle: no target → input low, output off
    let io: PlcIO = emptyIO();
    io = scanPlc(devices, wires, [], true, program, io);
    expect(io.inputs[0]).toBe(false);
    expect(io.outputs[0]).toBe(false);

    // 2) target appears → I0.0 high → rung seals Q0.0 in the same scan
    const withTarget = devices.map((d) =>
      d.id === "SQ1" ? { ...d, params: { ...d.params, target: 1 } } : d,
    );
    io = scanPlc(withTarget, wires, [], true, program, { ...io, inputs: [false, false, false, false] });
    expect(io.inputs[0]).toBe(true);
    expect(io.outputs[0]).toBe(true);

    // 3) target leaves — seal contact Q0.0 holds the output
    io = scanPlc(devices, wires, [], true, program, io);
    expect(io.inputs[0]).toBe(false);
    expect(io.outputs[0]).toBe(true);

    // 4) with Q0.0 sourcing, KM1 coil energises and its linked NO contact closes
    const sim = simulate(devices, wires, [], true, { plcOut: io.outputs });
    expect(Math.abs(sim.readings.KM1?.v ?? 0)).toBeGreaterThan(12);
    expect(sim.energized.has("KM1")).toBe(true);
    expect(sim.switches.A1).toBe(true);

    // 5) power path through the closed contact: motor spins at line voltage
    expect(sim.closed).toBe(true);
    expect(sim.readings.M1 && Math.abs(sim.readings.M1.v)).toBeGreaterThan(200);
    expect(sim.spin.has("M1")).toBe(true);

    // 6) with the output forced off the chain drops out
    const off = simulate(devices, wires, [], true, {
      plcOut: [false, false, false, false],
    });
    expect(off.energized.has("KM1")).toBe(false);
    expect(off.switches.A1).toBe(false);
    expect(off.spin.has("M1")).toBe(false);
  });

  it("VFD: local run sources variable output; DI1 command works too", () => {
    const src = { id: "U1", type: "ac-source" as const, name: "U1", params: { v: 230 } };
    const vfd = { id: "VF1", type: "vfd" as const, name: "VF1", params: { f: 25, run: 1, dir: 0 } };
    const mot = { id: "M1", type: "motor" as const, name: "M1", params: { r: 200 } };
    const wires = [
      { id: "w1", a: { dev: "VF1", term: 0 }, b: { dev: "M1", term: 0 } },
      { id: "w2", a: { dev: "VF1", term: 1 }, b: { dev: "M1", term: 1 } },
      { id: "w3", a: { dev: "U1", term: 1 }, b: { dev: "VF1", term: 2 } },
      { id: "w4", a: { dev: "U1", term: 0 }, b: { dev: "VF1", term: 3 } },
    ];
    const sim = simulate([src, vfd, mot], wires, [], true);
    // drive runs at 25 Hz → E = 400·25/50 = 200 V across the motor
    expect(Math.abs(sim.readings.M1?.v ?? 0)).toBeCloseTo(200, 0);
    expect(sim.spin.has("M1")).toBe(true);
    // line side draws power from the 230 V mains
    expect(sim.readings.VF1?.tv?.[2]).toBeCloseTo(230, 0);

    // stopped → motor loses supply
    const stopped = simulate(
      [src, { ...vfd, params: { ...vfd.params, run: 0 } }, mot],
      wires,
      [],
      true,
    );
    expect(stopped.spin.has("M1")).toBe(false);
  });

  it("PLC inputs read through a wired sensor loop", () => {
    const v1 = { id: "V1", type: "source" as const, name: "V1", params: { v: 24 } };
    const plc = { id: "PLC1", type: "plc" as const, name: "PLC1", params: {} };
    const sq = { id: "SQ1", type: "proximity-sensor" as const, name: "SQ1", params: { target: 0 } };
    const wires = [
      { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "PLC1", term: 0 } },
      { id: "w2", a: { dev: "V1", term: 0 }, b: { dev: "PLC1", term: 1 } },
      { id: "w3", a: { dev: "V1", term: 1 }, b: { dev: "SQ1", term: 0 } },
      { id: "w4", a: { dev: "SQ1", term: 1 }, b: { dev: "PLC1", term: 2 } },
    ];
    const plcId = "PLC1";
    const off = simulate([v1, plc, sq], wires, [], true);
    expect(off.readings[plcId]).toBeTruthy();
    const diOff = (off.readings[plcId].tv?.[2] ?? 0) - (off.readings[plcId].tv?.[1] ?? 0);
    expect(diOff).toBeLessThan(12);

    const on = simulate(
      [v1, plc, { ...sq, params: { target: 1 } }],
      wires,
      [],
      true,
    );
    const di = (on.readings[plcId].tv?.[2] ?? 0) - (on.readings[plcId].tv?.[1] ?? 0);
    expect(di).toBeGreaterThan(12);
  });
});
