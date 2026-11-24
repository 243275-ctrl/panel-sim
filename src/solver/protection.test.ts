import { describe, expect, it } from "vitest";
import { simulate } from "./solver";
import type { SolDevice, SolWire } from "./mna";

const build = () => {
  const devices: SolDevice[] = [
    { id: "V1", type: "source", name: "V1", params: { v: 24 } },
    { id: "F1", type: "overload", name: "F1", params: { in: 6.3 } },
    { id: "H1", type: "lamp", name: "H1", params: { r: 100 } },
  ];
  const wires: SolWire[] = [
    { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "F1", term: 0 } },
    { id: "w2", a: { dev: "F1", term: 1 }, b: { dev: "H1", term: 0 } },
    { id: "w3", a: { dev: "H1", term: 1 }, b: { dev: "V1", term: 0 } },
  ];
  return { devices, wires };
};

describe("M4 thermal overload protection", () => {
  it("passes current as a shunt while healthy", () => {
    const { devices, wires } = build();
    const sim = simulate(devices, wires, [], true);
    expect(sim.faults).toEqual([]);
    // 24 V / (0.001 + 100) ≈ 0.24 A through the overload and lamp
    expect(Math.abs(sim.readings.F1.i)).toBeCloseTo(0.24, 2);
    expect(Math.abs(sim.readings.H1.v)).toBeGreaterThan(23);
    expect(sim.closed).toBe(true);
  });

  it("opens the circuit when tripped (latched, until reset)", () => {
    const { devices, wires } = build();
    const sim = simulate(devices, wires, [], true, { tripped: { F1: true } });
    expect(Math.abs(sim.readings.F1.i)).toBe(0);
    expect(Math.abs(sim.readings.H1.v)).toBeLessThan(0.01);
    expect(sim.closed).toBe(false);
    expect(sim.energized.has("H1")).toBe(false);
    // voltage across the open device is still readable for diagnostics
    expect(Math.abs(sim.readings.F1.v)).toBeCloseTo(24, 1);
  });

  it("a tripped overload in a PLC circuit kills downstream power", async () => {
    const { plcDemoProject } = await import("../state/store");
    const { scanPlc } = await import("./solver");
    const { devices, wires, program } = plcDemoProject();
    // add an overload between the contactor and the motor path
    const withOl: SolDevice[] = [
      ...devices,
      { id: "F1", type: "overload" as const, name: "F1", params: { in: 6.3 } },
    ];
    // splice F1 in series with the motor: drop A1:1→M1:0, route A1→F1→M1
    const rewired: SolWire[] = wires
      .filter((w) => w.id !== "w8")
      .concat([
        { id: "s1", a: { dev: "A1", term: 1 }, b: { dev: "F1", term: 0 } },
        { id: "s2", a: { dev: "F1", term: 1 }, b: { dev: "M1", term: 0 } },
      ]);
    let io = scanPlc(withOl, rewired, [], true, program, {
      inputs: [false, false, false, false],
      outputs: [false, false, false, false],
      mem: [false, false, false, false, false, false, false, false],
      timers: [0, 0, 0, 0],
      scan: 0,
    });
    io = scanPlc(
      withOl.map((d) => (d.id === "SQ1" ? { ...d, params: { ...d.params, target: 1 } } : d)),
      rewired,
      [],
      true,
      program,
      { ...io, inputs: [false, false, false, false] },
    );
    io = scanPlc(withOl, rewired, [], true, program, io);
    expect(io.outputs[0]).toBe(true);
    // healthy first: motor spins through F1
    let sim = simulate(withOl, rewired, [], true, { plcOut: io.outputs });
    expect(sim.spin.has("M1")).toBe(true);
    expect(Math.abs(sim.readings.F1.i)).toBeGreaterThan(0);
    // now trip it — motor stops, coil still pulled but power path open
    sim = simulate(withOl, rewired, [], true, { plcOut: io.outputs, tripped: { F1: true } });
    expect(sim.spin.has("M1")).toBe(false);
    expect(Math.abs(sim.readings.M1.v)).toBeLessThan(0.01);
  });
});
