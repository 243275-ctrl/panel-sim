import { describe, expect, it } from "vitest";
import { parseAndValidate, serialize } from "./psim";
import type { Device, Wire } from "./store";

const V: Device = { id: "V1", type: "source", name: "V1", x: 0, y: 0, params: { v: 24 } };
const H: Device = { id: "H1", type: "lamp", name: "H1", x: 100, y: 0, params: { r: 100 } };
const W: Wire = { id: "w1", a: { dev: "V1", term: 0 }, b: { dev: "H1", term: 0 } };

describe(".psim round trip", () => {
  it("serialises and re-validates a good project", () => {
    const text = serialize([V, H], [W], "Demo");
    const res = parseAndValidate(text);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.doc.meta.name).toBe("Demo");
      expect(res.doc.devices).toHaveLength(2);
      expect(res.doc.wires).toHaveLength(1);
    }
  });

  it("rejects invalid JSON", () => {
    const res = parseAndValidate("{nope");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors[0]).toContain("JSON");
  });

  it("rejects a wire pointing at a missing device", () => {
    const bad: Wire = { id: "w2", a: { dev: "V1", term: 0 }, b: { dev: "ZZ9", term: 1 } };
    const res = parseAndValidate(serialize([V, H], [bad], "X"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toContain("missing device");
  });

  it("rejects duplicate device ids", () => {
    const res = parseAndValidate(serialize([V, { ...H, id: "V1" }], [], "X"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toContain("duplicate id");
  });

  it("rejects an illegal rotation", () => {
    const bad: Device = { ...H, id: "H2", rot: 45 as Device["rot"] };
    const res = parseAndValidate(serialize([V, bad], [], "X"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toContain("rot");
  });

  it("rejects an illegal motor connection", () => {
    const m: Device = { id: "M1", type: "motor", name: "M1", x: 0, y: 0, params: { connection: 3 } };
    const res = parseAndValidate(serialize([m], [], "X"));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.join(" ")).toContain("6, 9 or 12");
  });
});
