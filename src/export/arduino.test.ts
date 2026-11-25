import { describe, expect, it } from "vitest";
import type { Program } from "../solver/ladder";
import { generateArduinoSketch } from "./arduino";

const dol: Program = [
  {
    id: "r1",
    branches: [
      { contacts: [{ tag: "I0.0", nc: false }] },
      { contacts: [{ tag: "Q0.0", nc: false }] },
    ],
    tail: [],
    coil: "Q0.0",
    comment: "start seal-in",
  },
];

describe("Arduino sketch export", () => {
  it("emits a complete sketch: setup, loop, pin maps, output stage", () => {
    const src = generateArduinoSketch(dol, "demo");
    expect(src).toContain("void setup()");
    expect(src).toContain("void loop()");
    expect(src).toContain("const uint8_t DI_PIN[4] = {2, 3, 4, 5};");
    expect(src).toContain("const uint8_t DO_PIN[4] = {8, 9, 10, 11};");
    expect(src).toContain("pinMode(DI_PIN[i], INPUT_PULLUP);");
    expect(src).toContain("digitalRead(DI_PIN[0]) == LOW;");
    expect(src).toContain("digitalWrite(DO_PIN[3], Q[3] ? HIGH : LOW);");
  });

  it("mirrors the seal-in rung: OR branches, written in both passes", () => {
    const src = generateArduinoSketch(dol, "demo");
    expect(src).toContain("const bool on = ((I[0]) || (Q[0])); Q[0] = on;");
    expect(src).toContain("// start seal-in");
    // pass 1 writes it, pass 2 settles it — exactly twice
    expect(src.split("Q[0] = on;").length - 1).toBe(2);
  });

  it("negates NC contacts and ANDs the tail", () => {
    const p: Program = [
      {
        id: "r",
        branches: [{ contacts: [{ tag: "I0.0", nc: false }] }],
        tail: [{ tag: "I0.1", nc: true }],
        coil: "Q0.1",
        comment: "",
      },
    ];
    const src = generateArduinoSketch(p);
    expect(src).toContain("const bool on = ((I[0])) && (!(I[1])); Q[1] = on;");
  });

  it("TON timers: accumulate once (pass 1 only), preset in ms, reset on drop", () => {
    const p: Program = [
      {
        id: "t",
        branches: [{ contacts: [{ tag: "I0.2", nc: false }] }],
        tail: [],
        coil: "T0",
        preset: 5,
        comment: "delay",
      },
      {
        id: "f",
        branches: [{ contacts: [{ tag: "T0", nc: false }] }],
        tail: [],
        coil: "Q0.3",
        comment: "done",
      },
    ];
    const src = generateArduinoSketch(p);
    expect(src).toContain("T_sp[4] = {5000, 3000, 3000, 3000};");
    expect(src).toContain("if (on) T_acc[0] += dt; else T_acc[0] = 0;");
    // accumulation appears exactly once — pass 2 skips timer rungs
    expect(src.split("T_acc[0] += dt").length - 1).toBe(1);
    // timer contacts read the done bit
    expect(src).toContain("(T_acc[0] >= T_sp[0])");
  });

  it("maps marker coils and fails safe on unknown tags", () => {
    const p: Program = [
      {
        id: "m",
        branches: [{ contacts: [{ tag: "X9", nc: false }] }],
        tail: [],
        coil: "M2",
        comment: "",
      },
    ];
    const src = generateArduinoSketch(p);
    expect(src).toContain("const bool on = ((false)); M[2] = on;");
  });

  it("ignores unknown coils like the simulator does", () => {
    const p: Program = [
      {
        id: "z",
        branches: [{ contacts: [{ tag: "I0.0", nc: false }] }],
        tail: [],
        coil: "Z9",
        comment: "",
      },
    ];
    const src = generateArduinoSketch(p);
    expect(src).toContain("coil Z9 is not a known tag — no effect");
  });

  it("stays valid for an empty program and never emits undefined/NaN", () => {
    const src = generateArduinoSketch([], "empty");
    expect(src).toContain("void setup()");
    expect(src).toContain("void loop()");
    expect(src).toContain("0 rung(s)");
    expect(src).not.toContain("undefined");
    expect(src).not.toContain("NaN");
    const all = generateArduinoSketch(dol, "x");
    expect(all).not.toContain("undefined");
    expect(all).not.toContain("NaN");
  });

  it("closes every rung block before its trailing comment (g++ catches // swallowing } )", () => {
    const src = generateArduinoSketch(dol, "demo");
    for (const line of src.split("\n")) {
      if (!line.includes("{ const bool on")) continue;
      const close = line.indexOf("}");
      const cmt = line.indexOf("//");
      expect(cmt === -1 || close < cmt).toBe(true);
    }
  });

  it("escapes the project name into the header comment", () => {
    const src = generateArduinoSketch([], 'My "Proj"\nline2');
    expect(src).toContain('PanelSim Arduino export — "My \\"Proj\\" line2"');
  });
});
