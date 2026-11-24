import { describe, expect, it } from "vitest";
import { simulate, type SolDevice, type SolWire } from "./solver";

const V = (v = 24): SolDevice => ({ id: "V1", type: "source", name: "V1", params: { v } });
const R = (id: string, r: number): SolDevice => ({ id, type: "resistor", name: id, params: { r } });
const H = (id = "H1", r = 100): SolDevice => ({ id, type: "lamp", name: id, params: { r } });
const w = (id: string, ad: string, at: 0 | 1, bd: string, bt: 0 | 1): SolWire => ({
  id,
  a: { dev: ad, term: at },
  b: { dev: bd, term: bt },
});

describe("M2 nodal analysis", () => {
  it("solves a series voltage divider", () => {
    const r1 = R("R1", 100);
    const r2 = R("R2", 100);
    const wires = [w("w1", "V1", 1, "R1", 0), w("w2", "R1", 1, "R2", 0), w("w3", "R2", 1, "V1", 0)];
    const res = simulate([V(), r1, r2], wires, [], true);
    expect(res.closed).toBe(true);
    expect(res.faults).toEqual([]);
    expect(res.readings.R1.v).toBeCloseTo(12, 6);
    expect(res.readings.R1.i).toBeCloseTo(0.12, 6);
    expect(res.readings.R2.v).toBeCloseTo(12, 6);
    expect(res.readings.V1.i).toBeCloseTo(0.12, 6);
    expect(res.current).toBeCloseTo(0.12, 6);
  });

  it("solves parallel branches (each sees full voltage)", () => {
    const r1 = R("R1", 100);
    const r2 = R("R2", 100);
    const wires = [
      w("w1", "V1", 1, "R1", 0),
      w("w2", "V1", 1, "R2", 0),
      w("w3", "R1", 1, "V1", 0),
      w("w4", "R2", 1, "V1", 0),
    ];
    const res = simulate([V(), r1, r2], wires, [], true);
    expect(res.readings.R1.i).toBeCloseTo(0.24, 6);
    expect(res.readings.R2.i).toBeCloseTo(0.24, 6);
    expect(res.readings.V1.i).toBeCloseTo(0.48, 6);
    expect(res.lit.size).toBe(0);
  });

  it("voltmeter in parallel reads the branch voltage", () => {
    const r1 = R("R1", 100);
    const r2 = R("R2", 100);
    const vm: SolDevice = { id: "PV1", type: "voltmeter", name: "PV1", params: {} };
    const wires = [
      w("w1", "V1", 1, "R1", 0),
      w("w2", "R1", 1, "R2", 0),
      w("w3", "R2", 1, "V1", 0),
      w("w4", "PV1", 0, "R2", 0),
      w("w5", "PV1", 1, "R2", 1),
    ];
    const res = simulate([V(), r1, r2, vm], wires, [], true);
    expect(res.faults).toEqual([]);
    expect(res.readings.PV1.v).toBeCloseTo(12, 1); // 1 MΩ bleeds almost nothing
    expect(res.current).toBeCloseTo(0.12, 3);
  });

  it("ammeter in series carries the loop current", () => {
    const am: SolDevice = { id: "PA1", type: "ammeter", name: "PA1", params: {} };
    const lamp = H();
    const wires = [w("w1", "V1", 1, "PA1", 0), w("w2", "PA1", 1, "H1", 0), w("w3", "H1", 1, "V1", 0)];
    const res = simulate([V(), am, lamp], wires, [], true);
    expect(res.lit.has("H1")).toBe(true);
    expect(res.current).toBeCloseTo(0.24, 2);
    expect(res.readings.PA1.i).toBeCloseTo(res.current, 6);
    expect(res.readings.H1.v).toBeGreaterThan(23.9);
  });

  it("NC button conducts until it is held", () => {
    const nc: SolDevice = { id: "S1", type: "button-nc", name: "S1", params: {} };
    const lamp = H();
    const wires = [w("w1", "V1", 1, "S1", 0), w("w2", "S1", 1, "H1", 0), w("w3", "H1", 1, "V1", 0)];
    const on = simulate([V(), nc, lamp], wires, [], true);
    expect(on.closed).toBe(true);
    expect(on.lit.has("H1")).toBe(true);
    expect(on.current).toBeCloseTo(0.24, 6);
    const off = simulate([V(), nc, lamp], wires, ["S1"], true);
    expect(off.closed).toBe(false);
    expect(off.lit.size).toBe(0);
    expect(off.current).toBe(0);
    expect(off.readings.H1.v).toBeCloseTo(0, 9);
  });

  it("battery powers a resistive loop", () => {
    const bat: SolDevice = { id: "BT1", type: "battery", name: "BT1", params: {} };
    const r1 = R("R1", 100);
    const wires = [w("w1", "BT1", 1, "R1", 0), w("w2", "R1", 1, "BT1", 0)];
    const res = simulate([bat, r1], wires, [], true);
    expect(res.closed).toBe(true);
    expect(res.readings.BT1.i).toBeCloseTo(0.24, 6);
    expect(res.readings.R1.v).toBeCloseTo(24, 6);
  });

  it("ground anchors the reference node", () => {
    const gnd: SolDevice = { id: "PE1", type: "ground", name: "PE1", params: {} };
    const lamp = H();
    const wires = [w("w1", "V1", 1, "H1", 0), w("w2", "H1", 1, "PE1", 0), w("w3", "PE1", 1, "V1", 0)];
    const res = simulate([V(), gnd, lamp], wires, [], true);
    expect(res.faults).toEqual([]);
    expect(res.readings.H1.v).toBeCloseTo(24, 6);
    expect(res.readings.V1.i).toBeCloseTo(0.24, 6);
  });

  it("reports conflicting ideal sources as singular", () => {
    const v2: SolDevice = { id: "V2", type: "source", name: "V2", params: { v: 12 } };
    const r1 = R("R1", 100);
    const wires = [
      w("w1", "V1", 1, "V2", 1),
      w("w2", "V1", 0, "V2", 0),
      w("w3", "V1", 1, "R1", 0),
      w("w4", "R1", 1, "V1", 0),
    ];
    const res = simulate([V(), v2, r1], wires, [], true);
    expect(res.faults.some((f) => f.includes("conflicting"))).toBe(true);
    expect(res.current).toBe(0);
  });

  it("a voltmeter alone is a legal (tiny) load, not a short", () => {
    const vm: SolDevice = { id: "PV1", type: "voltmeter", name: "PV1", params: {} };
    const wires = [w("w1", "V1", 1, "PV1", 0), w("w2", "PV1", 1, "V1", 0)];
    const res = simulate([V(), vm], wires, [], true);
    expect(res.faults).toEqual([]);
    expect(res.closed).toBe(true);
    expect(res.readings.PV1.v).toBeCloseTo(24, 6);
    expect(res.current).toBeCloseTo(0.000024, 9);
  });

  it("open loop still reports zero readings for the load", () => {
    const s: SolDevice = { id: "S1", type: "button", name: "S1", params: {} };
    const lamp = H();
    const wires = [w("w1", "V1", 1, "S1", 0), w("w2", "S1", 1, "H1", 0), w("w3", "H1", 1, "V1", 0)];
    const res = simulate([V(), s, lamp], wires, [], true);
    expect(res.faults).toEqual([]);
    expect(res.current).toBe(0);
    expect(res.readings.H1.v).toBeCloseTo(0, 9);
    expect(res.readings.V1.i).toBeCloseTo(0, 9);
    expect(res.lit.size).toBe(0);
  });
});
