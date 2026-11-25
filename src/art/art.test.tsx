import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DeviceArt } from "./Pictorial";
import { DEVICE_TYPES } from "../state/psim";

const render = (type: (typeof DEVICE_TYPES)[number], extra = {}) =>
  renderToStaticMarkup(
    <svg viewBox="-44 -40 88 80">
      <DeviceArt type={type} {...extra} />
    </svg>,
  );

describe("pictorial art coverage", () => {
  it("renders every device type with real artwork", () => {
    expect(DEVICE_TYPES.length).toBe(63);
    for (const t of DEVICE_TYPES) {
      const html = render(t);
      expect(html.length, `type ${t} produced empty art`).toBeGreaterThan(400);
      expect(html, `type ${t} has undefined`).not.toContain("undefined");
      expect(html, `type ${t} has NaN`).not.toContain("NaN");
      // shared material system present
      expect(html, `type ${t} missing gradients`).toContain("ps-metal");
    }
  });

  it("keeps the wire-tab contract at ±30,0 for every type", () => {
    for (const t of DEVICE_TYPES) {
      const html = render(t);
      // tabs (or ground's entry stubs) must reach x=±30 so wires land on metal
      const has = html.includes('x="-30"') || html.includes('x1="-30"');
      expect(has, `type ${t} missing terminal geometry at x=-30`).toBe(true);
      const hasR = html.includes('x="20"') || html.includes('x1="30"');
      expect(hasR, `type ${t} missing terminal geometry at x=+30`).toBe(true);
    }
  });

  it("lights lamps and shows meter readouts", () => {
    const dark = render("lamp");
    const bright = render("lamp", { lit: true });
    expect(bright).not.toBe(dark);
    expect(bright).toContain("ps-glow");

    const vm = render("voltmeter", { readout: { text: "23.4 V", frac: 0.5 } });
    expect(vm).toContain("23.4 V");
    const am = render("ammeter", { readout: { text: "0.24 A", frac: 0.1 } });
    expect(am).toContain("0.24 A");
    const mm = render("multimeter", { readout: { text: "12.00 V" } });
    expect(mm).toContain("12.00 V");
  });

  it("uses drop shadows for depth on enclosure types", () => {
    for (const t of ["contactor", "breaker-1p", "motor", "vfd", "plc"] as const) {
      expect(render(t), `${t} lacks shadow filter`).toContain("ps-sh");
    }
  });
});
