import { describe, expect, it } from "vitest";
import { simulate, type SolDevice, type SolWire } from "./solver";

const V: SolDevice = { id: "V1", type: "source", name: "V1", params: { v: 24 } };
const S: SolDevice = { id: "S1", type: "button", name: "S1", params: {} };
const H: SolDevice = { id: "H1", type: "lamp", name: "H1", params: { r: 100 } };

const loop: SolWire[] = [
  { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "S1", term: 0 } },
  { id: "w2", a: { dev: "S1", term: 1 }, b: { dev: "H1", term: 0 } },
  { id: "w3", a: { dev: "H1", term: 1 }, b: { dev: "V1", term: 0 } },
];

describe("simulate (M0 single loop)", () => {
  it("lights the lamp when running and button held", () => {
    const r = simulate([V, S, H], loop, ["S1"], true);
    expect(r.closed).toBe(true);
    expect(r.lit.has("H1")).toBe(true);
    expect(r.current).toBeCloseTo(0.24, 5);
    expect(r.live.size).toBe(3);
    expect(r.faults).toEqual([]);
  });

  it("stays dark while the button is released", () => {
    const r = simulate([V, S, H], loop, [], true);
    expect(r.closed).toBe(false);
    expect(r.lit.size).toBe(0);
    expect(r.current).toBe(0);
    expect(r.live.size).toBe(0);
  });

  it("ignores button presses when not running", () => {
    const r = simulate([V, S, H], loop, ["S1"], false);
    expect(r.closed).toBe(false);
    expect(r.lit.size).toBe(0);
  });

  it("flags dangling terminals", () => {
    const r = simulate([V, H], [], [], true);
    expect(r.faults.some((f) => f.includes("not connected"))).toBe(true);
  });

  it("flags a missing source", () => {
    const r = simulate([S, H], [loop[1]], [], true);
    expect(r.faults).toContain("No power source in the circuit");
  });

  it("detects a short circuit (no load)", () => {
    const short: SolWire[] = [
      { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "S1", term: 0 } },
      { id: "w2", a: { dev: "S1", term: 1 }, b: { dev: "V1", term: 0 } },
    ];
    const r = simulate([V, S], short, ["S1"], true);
    expect(r.faults.some((f) => f.includes("Short circuit"))).toBe(true);
    expect(r.closed).toBe(false);
  });

  it("is deterministic for identical inputs", () => {
    const a = simulate([V, S, H], loop, ["S1"], true);
    const b = simulate([V, S, H], loop, ["S1"], true);
    expect(a.current).toBe(b.current);
    expect([...a.lit]).toEqual([...b.lit]);
  });
});
