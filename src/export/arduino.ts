// M5 — Arduino sketch export: mirrors src/solver/ladder.ts semantics 1:1.
// Rung on = (OR of series branches) AND tail contacts; TON timers accumulate
// while their rung is on and reset the moment it drops; pass 2 re-settles
// cross-rung references without extra accumulation. Unknown tags read OFF
// (same fail-safe as tagState).
import type { LContact, Program, Rung } from "../solver/ladder";
import { INPUTS, MEM, OUTPUTS, TIMERS, presetsOf } from "../solver/ladder";

/** Default wiring — I0.0..I0.3 → D2..D5, Q0.0..Q0.3 → D8..D11.
 *  Inputs use INPUT_PULLUP (switch to GND, LOW = ON); outputs HIGH = ON. */
export const ARDUINO_DI_PINS = [2, 3, 4, 5];
export const ARDUINO_DO_PINS = [8, 9, 10, 11];

/** escape a project name for a // comment line */
function cComment(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]+/g, " ");
}

function tagExpr(tag: string): string {
  let i = INPUTS.indexOf(tag);
  if (i >= 0) return `I[${i}]`;
  i = OUTPUTS.indexOf(tag);
  if (i >= 0) return `Q[${i}]`;
  i = MEM.indexOf(tag);
  if (i >= 0) return `M[${i}]`;
  i = TIMERS.indexOf(tag);
  if (i >= 0) return `(T_acc[${i}] >= T_sp[${i}])`;
  return "false"; // unknown tag reads OFF — mirrors tagState()
}

function contactExpr(c: LContact): string {
  const base = tagExpr(c.tag);
  return c.nc ? `!(${base})` : base;
}

/** `on` expression for one rung — same shape as evalLadder's evaluate() */
function rungOnExpr(r: Rung): string {
  if (r.branches.length === 0) return "false"; // some() over [] is false
  const branches = r.branches.map(
    (b) => `(${b.contacts.map(contactExpr).join(" && ") || "true"})`,
  );
  const head = branches.join(" || ");
  const tail = (r.tail ?? []).map(contactExpr).map((t) => `(${t})`);
  return [`(${head})`, ...tail].join(" && ");
}

/** statement writing the coil — pass 1 only for timers (accumulation),
 *  pass 2 skips them exactly like evalLadder. Unknown coils: no effect. */
function coilStmt(r: Rung, on: string, pass: 1 | 2): string | null {
  const ti = TIMERS.indexOf(r.coil);
  if (ti >= 0) {
    if (pass === 2) return null;
    return `if (${on}) T_acc[${ti}] += dt; else T_acc[${ti}] = 0;`;
  }
  const o = OUTPUTS.indexOf(r.coil);
  if (o >= 0) return `Q[${o}] = ${on};`;
  const m = MEM.indexOf(r.coil);
  if (m >= 0) return `M[${m}] = ${on};`;
  return `// coil ${cComment(r.coil)} is not a known tag — no effect (as in the simulator)`;
}

function rungBlock(r: Rung, pass: 1 | 2): string[] {
  const stmt = coilStmt(r, "on", pass);
  if (stmt === null) return [];
  if (stmt.startsWith("//")) return [`  ${stmt}`]; // unmapped coil: no variable needed
  const label = r.comment ? ` // ${cComment(r.comment)}` : "";
  // closing brace MUST precede the trailing comment — `//` would swallow it
  return [`  { const bool on = ${rungOnExpr(r)}; ${stmt} }${label}`];
}

/** full .ino source for the current ladder program */
export function generateArduinoSketch(
  program: Program,
  projectName = "PanelSim",
): string {
  const presets = presetsOf(program);
  const name = cComment(projectName || "PanelSim");
  const di = ARDUINO_DI_PINS.join(", ");
  const doPins = ARDUINO_DO_PINS.join(", ");
  const sp = presets.join(", ");

  const out: string[] = [];
  out.push(`// PanelSim Arduino export — "${name}"`);
  out.push(`// ${program.length} rung(s). Semantics mirror the PanelSim simulator:`);
  out.push("//   rung on = (OR of series branches) AND tail contacts;");
  out.push("//   TON timers accumulate while their rung is on, reset when it drops;");
  out.push("//   pass 2 re-settles cross-rung references (no extra accumulation).");
  out.push("// Wiring (edit the constants to match your board):");
  out.push(`//   I0.0..I0.3 -> D${ARDUINO_DI_PINS.join(", D")} — switch to GND (INPUT_PULLUP, LOW = ON)`);
  out.push(`//   Q0.0..Q0.3 -> D${ARDUINO_DO_PINS.join(", D")} — HIGH = ON`);
  out.push("");
  out.push(`const uint8_t DI_PIN[4] = {${di}};`);
  out.push(`const uint8_t DO_PIN[4] = {${doPins}};`);
  out.push("");
  out.push("bool I[4] = {0, 0, 0, 0};");
  out.push("bool Q[4] = {0, 0, 0, 0};");
  out.push("bool M[8] = {0, 0, 0, 0};");
  out.push("unsigned long T_acc[4] = {0, 0, 0, 0};");
  out.push(`const unsigned long T_sp[4] = {${sp}}; // ms, from rung presets`);
  out.push("unsigned long t_last = 0;");
  out.push("");
  out.push("void setup() {");
  out.push("  for (uint8_t i = 0; i < 4; i++) {");
  out.push("    pinMode(DI_PIN[i], INPUT_PULLUP);");
  out.push("    pinMode(DO_PIN[i], OUTPUT);");
  out.push("    digitalWrite(DO_PIN[i], LOW);");
  out.push("  }");
  out.push("}");
  out.push("");
  out.push("void loop() {");
  out.push("  unsigned long now = millis();");
  out.push("  unsigned long dt = now - t_last;");
  out.push("  t_last = now;");
  out.push("  if (dt > 500UL) dt = 500UL; // stall clamp after pauses");
  out.push("");
  out.push("  // live inputs (active LOW)");
  for (let i = 0; i < 4; i++) out.push(`  I[${i}] = digitalRead(DI_PIN[${i}]) == LOW;`);
  out.push("");
  out.push("  // pass 1 — live logic + timer accumulation");
  for (const r of program) {
    for (const line of rungBlock(r, 1)) out.push(line);
  }
  out.push("  // pass 2 — settle cross-rung references");
  for (const r of program) {
    for (const line of rungBlock(r, 2)) out.push(line);
  }
  out.push("");
  out.push("  // outputs");
  for (let i = 0; i < 4; i++) {
    out.push(`  digitalWrite(DO_PIN[${i}], Q[${i}] ? HIGH : LOW);`);
  }
  out.push("}");
  out.push("");
  return out.join("\n");
}
