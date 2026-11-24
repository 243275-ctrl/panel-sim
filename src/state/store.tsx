import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { emptyIO, type PlcIO, type Program } from "../solver/ladder";
import { scanPlc, simulate } from "../solver/solver";

export type ToolMode = "select" | "wire" | "place";
export type DeviceType =
  | "source"
  | "ac-source"
  | "ground"
  | "transformer-1p"
  | "transformer-3p"
  | "battery"
  | "generator"
  | "button"
  | "button-nc"
  | "estop"
  | "selector"
  | "switch-2way"
  | "keyswitch"
  | "lamp"
  | "lamp-amber"
  | "buzzer"
  | "beacon"
  | "contactor"
  | "contactor-rev"
  | "relay"
  | "aux-no"
  | "aux-nc"
  | "changeover"
  | "fuse"
  | "breaker-1p"
  | "breaker-3p"
  | "mccb"
  | "overload"
  | "surge"
  | "rccb"
  | "resistor"
  | "capacitor"
  | "inductor"
  | "potentiometer"
  | "thermistor"
  | "motor"
  | "motor-1ph"
  | "motor-dc"
  | "vfd"
  | "servo-drive"
  | "multimeter"
  | "clamp"
  | "voltmeter"
  | "ammeter"
  | "pt100"
  | "pressure-sensor"
  | "proximity-sensor"
  | "photo-sensor"
  | "level-sensor"
  | "plc"
  | "plc-expansion"
  | "analog-module"
  | "terminal-block"
  | "junction-box"
  | "connector";

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  rot?: 0 | 90 | 180 | 270;
  flip?: boolean;
  params: Record<string, number>;
}

export interface Wire {
  id: string;
  a: { dev: string; term: number };
  b: { dev: string; term: number };
}

export type Selection = { kind: "d" | "w"; id: string } | null;

interface DocSnap {
  devices: Device[];
  wires: Wire[];
  projectName: string;
  selection: Selection;
}

export interface State {
  started: boolean;
  projectName: string;
  devices: Device[];
  wires: Wire[];
  tool: ToolMode;
  placeType: DeviceType | null;
  selection: Selection;
  wireFrom: { dev: string; term: number } | null;
  running: boolean;
  pressed: string[];
  notice: string | null;
  past: DocSnap[];
  future: DocSnap[];
  /** ladder program edited in the Program panel */
  program: Program;
  /** PLC image zone state — advanced one scan per tick while running */
  plc: PlcIO;
  /** Program (ladder) editor overlay */
  ladderOpen: boolean;
  /** latched overload trips — manual reset */
  tripped: Record<string, boolean>;
}

export type Action =
  | { t: "start"; example: 0 | 1 | 2 | 3 | 4 }
  | { t: "tool"; tool: ToolMode }
  | { t: "placeType"; dt: DeviceType }
  | { t: "place"; id: string; x: number; y: number }
  | { t: "select"; sel: Selection }
  | { t: "wireClick"; dev: string; term: number }
  | { t: "deleteSel" }
  | { t: "run" }
  | { t: "stop" }
  | { t: "reset" }
  | { t: "press"; id: string }
  | { t: "release"; id: string }
  | { t: "rename"; id: string; name: string }
  | { t: "param"; id: string; key: string; value: number }
  | { t: "rotate" }
  | { t: "flip" }
  | { t: "undo" }
  | { t: "redo" }
  | { t: "open"; projectName: string; devices: Device[]; wires: Wire[]; id: string; program?: Program }
  | { t: "notice"; text: string | null }
  | { t: "tick" }
  | { t: "ladder" }
  | { t: "pgAddRung" }
  | { t: "pgDelRung"; id: string }
  | { t: "pgAddBranch"; id: string }
  | { t: "pgDelBranch"; id: string; idx: number }
  | { t: "pgAddContact"; id: string; branch: number }
  | { t: "pgDelContact"; id: string; branch: number; idx: number }
  | { t: "pgSetContact"; id: string; branch: number; idx: number; tag?: string; nc?: boolean }
  | { t: "pgSetCoil"; id: string; tag: string }
  | { t: "pgSetComment"; id: string; text: string }
  | { t: "pgSetPreset"; id: string; sec: number }
  | { t: "trip"; id: string }
  | { t: "resetTrip"; id: string };

export const uid = (prefix: string) =>
  prefix + Math.random().toString(36).slice(2, 9);

const PREFIX: Record<DeviceType, string> = {
  source: "V",
  "ac-source": "U",
  ground: "PE",
  "transformer-1p": "TC",
  "transformer-3p": "TM",
  battery: "BT",
  generator: "GEN",
  button: "S",
  "button-nc": "S",
  estop: "SB",
  selector: "SA",
  "switch-2way": "SW",
  keyswitch: "SK",
  lamp: "H",
  "lamp-amber": "H",
  buzzer: "BZ",
  beacon: "YL",
  contactor: "KM",
  "contactor-rev": "KMR",
  relay: "KA",
  "aux-no": "KM",
  "aux-nc": "KM",
  changeover: "KA",
  fuse: "FU",
  "breaker-1p": "QF",
  "breaker-3p": "QF",
  mccb: "QF",
  overload: "FR",
  surge: "FSP",
  rccb: "QF",
  resistor: "R",
  capacitor: "C",
  inductor: "L",
  potentiometer: "RV",
  thermistor: "PTC",
  motor: "M",
  "motor-1ph": "M",
  "motor-dc": "MD",
  vfd: "U",
  "servo-drive": "SV",
  multimeter: "TQ",
  clamp: "TQ",
  voltmeter: "PV",
  ammeter: "PA",
  pt100: "TT",
  "pressure-sensor": "PT",
  "proximity-sensor": "SQ",
  "photo-sensor": "B",
  "level-sensor": "LG",
  plc: "PLC",
  "plc-expansion": "EX",
  "analog-module": "AM",
  "terminal-block": "XT",
  "junction-box": "JX",
  connector: "XS",
};

const counts = (s: State, type: DeviceType) =>
  s.devices.filter((d) => d.type === type).length + 1;

export function exampleProject() {
  const v: Device = {
    id: "V1",
    type: "source",
    name: "V1",
    x: 180,
    y: 240,
    params: { v: 24 },
  };
  const s: Device = {
    id: "S1",
    type: "button",
    name: "S1",
    x: 440,
    y: 240,
    params: {},
  };
  const h: Device = {
    id: "H1",
    type: "lamp",
    name: "H1",
    x: 700,
    y: 240,
    params: { r: 100 },
  };
  const wires: Wire[] = [
    { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "S1", term: 0 } },
    { id: "w2", a: { dev: "S1", term: 1 }, b: { dev: "H1", term: 0 } },
    { id: "w3", a: { dev: "H1", term: 1 }, b: { dev: "V1", term: 0 } },
  ];
  return { devices: [v, s, h], wires };
}

/** demo: sensor → ladder (seal-in) → PLC output → contactor → motor */
export function plcDemoProject() {
  const dev = (
    id: string,
    type: DeviceType,
    name: string,
    x: number,
    y: number,
    params: Record<string, number> = {},
  ): Device => ({ id, type, name, x, y, params });
  const devices: Device[] = [
    dev("V1", "source", "V1", 120, 150, { v: 24 }),
    dev("PLC1", "plc", "PLC1", 360, 150, {}),
    dev("SQ1", "proximity-sensor", "SQ1", 120, 350, { target: 0 }),
    dev("KM1", "contactor", "KM1", 500, 350, { grp: 1, r: 1200 }),
    dev("U1", "ac-source", "U1", 660, 150, { v: 230 }),
    dev("A1", "aux-no", "A1", 660, 350, { grp: 1 }),
    dev("M1", "motor", "M1", 800, 350, { connection: 12, r: 200 }),
  ];
  const w = (id: string, ad: string, at: number, bd: string, bt: number): Wire => ({
    id,
    a: { dev: ad, term: at },
    b: { dev: bd, term: bt },
  });
  const wires: Wire[] = [
    w("w1", "V1", 1, "PLC1", 0), // L+
    w("w2", "V1", 0, "PLC1", 1), // M
    w("w3", "V1", 1, "SQ1", 0), // sensor feed
    w("w4", "SQ1", 1, "PLC1", 2), // → I0.0
    w("w5", "PLC1", 6, "KM1", 0), // Q0.0 → coil
    w("w6", "KM1", 1, "V1", 0), // coil return to M
    w("w7", "U1", 1, "A1", 0), // power through linked NO contact
    w("w8", "A1", 1, "M1", 0),
    w("w9", "M1", 1, "U1", 0),
  ];
  const program: Program = [
    {
      id: "r1",
      branches: [
        { contacts: [{ tag: "I0.0", nc: false }] },
        { contacts: [{ tag: "Q0.0", nc: false }] },
      ],
      tail: [],
      coil: "Q0.0",
      comment: "Proximity start with seal-in",
    },
  ];
  return { devices, wires, program };
}

/** template: stage 1 immediately, stage 2 (motor) after a 3 s on-delay */
export function sequenceTemplate() {
  const dev = (
    id: string,
    type: DeviceType,
    name: string,
    x: number,
    y: number,
    params: Record<string, number> = {},
  ): Device => ({ id, type, name, x, y, params });
  const devices: Device[] = [
    dev("V1", "source", "V1", 120, 150, { v: 24 }),
    dev("PLC1", "plc", "PLC1", 360, 150, {}),
    dev("S1", "button", "S1", 120, 350, {}),
    dev("H1", "lamp-amber", "H1", 520, 350, { r: 100 }),
    dev("KM2", "contactor", "KM2", 640, 350, { grp: 2, r: 1200 }),
    dev("U1", "ac-source", "U1", 760, 150, { v: 230 }),
    dev("A2", "aux-no", "A2", 760, 350, { grp: 2 }),
    dev("M1", "motor", "M1", 880, 350, { connection: 12, r: 200 }),
  ];
  const w = (id: string, ad: string, at: number, bd: string, bt: number): Wire => ({
    id,
    a: { dev: ad, term: at },
    b: { dev: bd, term: bt },
  });
  const wires: Wire[] = [
    w("w1", "V1", 1, "PLC1", 0),
    w("w2", "V1", 0, "PLC1", 1),
    w("w3", "V1", 1, "S1", 0),
    w("w4", "S1", 1, "PLC1", 2), // start → I0.0
    w("w5", "PLC1", 6, "H1", 0), // Q0.0 → amber lamp (stage 1)
    w("w6", "H1", 1, "V1", 0),
    w("w7", "PLC1", 7, "KM2", 0), // Q0.1 → contactor (stage 2)
    w("w8", "KM2", 1, "V1", 0),
    w("w9", "U1", 1, "A2", 0),
    w("w10", "A2", 1, "M1", 0),
    w("w11", "M1", 1, "U1", 0),
  ];
  const program: Program = [
    {
      id: "r1",
      branches: [
        { contacts: [{ tag: "I0.0", nc: false }] },
        { contacts: [{ tag: "Q0.0", nc: false }] },
      ],
      tail: [],
      coil: "Q0.0",
      comment: "Stage 1 with seal-in",
    },
    { id: "r2", branches: [{ contacts: [{ tag: "Q0.0", nc: false }] }], tail: [], coil: "T0", comment: "on-delay", preset: 3 },
    { id: "r3", branches: [{ contacts: [{ tag: "T0", nc: false }] }], tail: [], coil: "Q0.1", comment: "Stage 2 after 3 s" },
  ];
  return { devices, wires, program };
}

/** template: Q0.0 flashes a beacon at ~1 Hz via T0 ↔ M0 oscillation */
export function flasherTemplate() {
  const devices: Device[] = [
    { id: "V1", type: "source", name: "V1", x: 160, y: 150, params: { v: 24 } },
    { id: "PLC1", type: "plc", name: "PLC1", x: 400, y: 150, params: {} },
    { id: "YL1", type: "beacon", name: "YL1", x: 640, y: 340, params: {} },
  ];
  const wires: Wire[] = [
    { id: "w1", a: { dev: "V1", term: 1 }, b: { dev: "PLC1", term: 0 } },
    { id: "w2", a: { dev: "V1", term: 0 }, b: { dev: "PLC1", term: 1 } },
    { id: "w3", a: { dev: "PLC1", term: 6 }, b: { dev: "YL1", term: 0 } },
    { id: "w4", a: { dev: "YL1", term: 1 }, b: { dev: "V1", term: 0 } },
  ];
  const program: Program = [
    { id: "r1", branches: [{ contacts: [{ tag: "M0", nc: true }] }], tail: [], coil: "T0", comment: "charge while dark", preset: 1 },
    { id: "r2", branches: [{ contacts: [{ tag: "T0", nc: false }] }], tail: [], coil: "M0", comment: "" },
    { id: "r3", branches: [{ contacts: [{ tag: "M0", nc: false }] }], tail: [], coil: "Q0.0", comment: "flash output" },
  ];
  return { devices, wires, program };
}

const initial: State = {
  started: false,
  projectName: "Untitled",
  devices: [],
  wires: [],
  tool: "select",
  placeType: null,
  selection: null,
  wireFrom: null,
  running: false,
  pressed: [],
  notice: null,
  past: [],
  future: [],
  program: [],
  plc: emptyIO(),
  ladderOpen: false,
  tripped: {},
};

function snap(s: State): DocSnap {
  return {
    devices: s.devices,
    wires: s.wires,
    projectName: s.projectName,
    selection: s.selection,
  };
}

function base(state: State, a: Action): State {
  switch (a.t) {
    case "start": {
      if (a.example === 1) {
        const ex = exampleProject();
        return {
          ...initial,
          started: true,
          projectName: "Example — pilot light",
          ...ex,
        };
      }
      if (a.example === 2) {
        const ex = plcDemoProject();
        return {
          ...initial,
          started: true,
          projectName: "PLC demo — sensor to motor",
          ...ex,
          notice:
            "PLC demo: open ▤ Program, press Run, then set SQ1 ‘target present’ in Properties — the ladder seals Q0.0, KM1 pulls in and the motor runs.",
        };
      }
      if (a.example === 3) {
        const ex = sequenceTemplate();
        return {
          ...initial,
          started: true,
          projectName: "Template — timed sequence",
          ...ex,
          notice:
            "Sequence template: press Run, hold S1 — lamp H1 lights at once, T0 counts 3 s, then stage 2 pulls KM2 and the motor runs.",
        };
      }
      if (a.example === 4) {
        const ex = flasherTemplate();
        return {
          ...initial,
          started: true,
          projectName: "Template — flasher",
          ...ex,
          notice:
            "Flasher template: Run and watch the beacon blink at ~1 Hz (T0 ↔ M0 oscillation).",
        };
      }
      return { ...initial, started: true };
    }
    case "tool":
      return { ...state, tool: a.tool, placeType: null, wireFrom: null };
    case "placeType":
      return { ...state, tool: "place", placeType: a.dt, wireFrom: null };
    case "place": {
      const type = state.placeType;
      if (!type) return state;
      const prefix = PREFIX[type];
      const device: Device = {
        id: uid(prefix),
        type,
        name: `${prefix}${counts(state, type)}`,
        x: a.x,
        y: a.y,
        params:
          type === "source"
            ? { v: 24 }
            : type === "lamp" || type === "resistor"
              ? { r: 100 }
              : type === "motor"
                ? { connection: 12, r: 200 }
                : type === "vfd"
                  ? { f: 50, run: 0, dir: 0 }
                  : type === "contactor" || type === "contactor-rev" || type === "relay"
                    ? { grp: 1, r: 1200 }
                    : type === "aux-no" || type === "aux-nc" || type === "changeover"
                      ? { grp: 1 }
                      : type === "proximity-sensor"
                        ? { target: 0 }
                        : type === "photo-sensor"
                          ? { blocked: 0 }
                          : type === "pressure-sensor"
                            ? { pv: 0, sp: 10 }
                            : type === "level-sensor"
                              ? { lv: 0, sp: 5 }
                              : type === "pt100"
                                ? { t: 20 }
                                : {},
      };
      return {
        ...state,
        devices: [...state.devices, device],
        tool: "select",
        placeType: null,
        selection: { kind: "d", id: device.id },
      };
    }
    case "select":
      return { ...state, selection: a.sel, wireFrom: null };
    case "wireClick": {
      const first = state.wireFrom;
      if (!first) return { ...state, wireFrom: { dev: a.dev, term: a.term } };
      if (first.dev === a.dev && first.term === a.term)
        return { ...state, wireFrom: null };
      const dup = state.wires.some(
        (w) =>
          (w.a.dev === first.dev &&
            w.a.term === first.term &&
            w.b.dev === a.dev &&
            w.b.term === a.term) ||
          (w.b.dev === first.dev &&
            w.b.term === first.term &&
            w.a.dev === a.dev &&
            w.a.term === a.term),
      );
      if (dup) return { ...state, wireFrom: null };
      const wire: Wire = {
        id: uid("w"),
        a: first,
        b: { dev: a.dev, term: a.term },
      };
      return { ...state, wires: [...state.wires, wire], wireFrom: null };
    }
    case "deleteSel": {
      if (!state.selection) return state;
      if (state.selection.kind === "d") {
        const id = state.selection.id;
        return {
          ...state,
          devices: state.devices.filter((d) => d.id !== id),
          wires: state.wires.filter((w) => w.a.dev !== id && w.b.dev !== id),
          selection: null,
          pressed: state.pressed.filter((p) => p !== id),
        };
      }
      return {
        ...state,
        wires: state.wires.filter((w) => w.id !== state.selection!.id),
        selection: null,
      };
    }
    case "run":
      return { ...state, running: true, notice: null, plc: emptyIO() };
    case "stop":
      return {
        ...state,
        running: false,
        pressed: [],
        plc: emptyIO(),
      };
    case "reset":
      return {
        ...state,
        running: false,
        pressed: [],
        selection: null,
        wireFrom: null,
        tripped: {},
      };
    case "press":
      if (!state.running || state.pressed.includes(a.id)) return state;
      return { ...state, pressed: [...state.pressed, a.id] };
    case "release":
      return { ...state, pressed: state.pressed.filter((p) => p !== a.id) };
    case "rename":
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === a.id ? { ...d, name: a.name } : d,
        ),
      };
    case "param":
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === a.id
            ? { ...d, params: { ...d.params, [a.key]: a.value } }
            : d,
        ),
      };
    case "rotate":
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === state.selection?.id && state.selection.kind === "d"
            ? { ...d, rot: (((d.rot ?? 0) + 90) % 360) as 0 | 90 | 180 | 270 }
            : d,
        ),
      };
    case "flip":
      return {
        ...state,
        devices: state.devices.map((d) =>
          d.id === state.selection?.id && state.selection.kind === "d"
            ? { ...d, flip: !d.flip }
            : d,
        ),
      };
    case "open":
      return {
        ...state,
        started: true,
        projectName: a.projectName,
        devices: a.devices,
        wires: a.wires,
        program: a.program ?? [],
        plc: emptyIO(),
        selection: null,
        wireFrom: null,
        running: false,
        pressed: [],
        notice: `Opened “${a.projectName}” — ${a.devices.length} devices`,
      };
    case "notice":
      return { ...state, notice: a.text };
    case "undo":
      if (!state.past.length) return state;
      {
        const prev = state.past[state.past.length - 1];
        return {
          ...state,
          ...prev,
          past: state.past.slice(0, -1),
          future: [snap(state), ...state.future].slice(0, 100),
          notice: "Undone",
        };
      }
    case "redo":
      if (!state.future.length) return state;
      {
        const next = state.future[0];
        return {
          ...state,
          ...next,
          past: [...state.past, snap(state)].slice(-100),
          future: state.future.slice(1),
          notice: "Redone",
        };
      }
    case "tick": {
      if (!state.running) return state;
      // thermal overload protection: latch a trip before the next scan
      const sim = simulate(state.devices, state.wires, state.pressed, true, {
        plcOut: state.plc.outputs,
        tripped: state.tripped,
      });
      for (const d of state.devices) {
        if (d.type !== "overload" || state.tripped[d.id]) continue;
        const i = Math.abs(sim.readings[d.id]?.i ?? 0);
        const rating = d.params.in ?? 6.3;
        if (i > rating + 1e-9) {
          return {
            ...state,
            tripped: { ...state.tripped, [d.id]: true },
            notice: `${d.name} tripped: ${i.toFixed(2)} A > ${rating} A rating`,
          };
        }
      }
      const io = scanPlc(
        state.devices,
        state.wires,
        state.pressed,
        true,
        state.program,
        state.plc,
        150,
        state.tripped,
      );
      return { ...state, plc: { ...io, scan: state.plc.scan + 1 } };
    }
    case "ladder":
      return { ...state, ladderOpen: !state.ladderOpen };
    case "pgAddRung": {
      const rung = {
        id: uid("r"),
        branches: [{ contacts: [{ tag: "I0.0", nc: false }] }],
        tail: [],
        coil: "Q0.0",
        comment: "",
      };
      return { ...state, program: [...state.program, rung] };
    }
    case "pgDelRung":
      return { ...state, program: state.program.filter((r) => r.id !== a.id) };
    case "pgAddBranch":
      return {
        ...state,
        program: state.program.map((r) =>
          r.id === a.id
            ? { ...r, branches: [...r.branches, { contacts: [{ tag: "I0.1", nc: false }] }] }
            : r,
        ),
      };
    case "pgDelBranch":
      return {
        ...state,
        program: state.program.map((r) =>
          r.id === a.id
            ? { ...r, branches: r.branches.filter((_, i) => i !== a.idx) }
            : r,
        ),
      };
    case "pgAddContact":
      return {
        ...state,
        program: state.program.map((r) => {
          if (r.id !== a.id) return r;
          const used = new Set(
            [...r.branches.flatMap((b) => b.contacts), ...(r.tail ?? [])].map((c) => c.tag),
          );
          const tag = ["I0.0", "I0.1", "Q0.0", "M0"].find((t) => !used.has(t)) ?? "M1";
          const c = { tag, nc: false };
          if (a.branch < 0) return { ...r, tail: [...(r.tail ?? []), c] };
          return {
            ...r,
            branches: r.branches.map((b, i) =>
              i === a.branch ? { ...b, contacts: [...b.contacts, c] } : b,
            ),
          };
        }),
      };
    case "pgDelContact":
      return {
        ...state,
        program: state.program.map((r) => {
          if (r.id !== a.id) return r;
          if (a.branch < 0) return { ...r, tail: (r.tail ?? []).filter((_, i) => i !== a.idx) };
          return {
            ...r,
            branches: r.branches.map((b, i) =>
              i === a.branch ? { ...b, contacts: b.contacts.filter((_, j) => j !== a.idx) } : b,
            ),
          };
        }),
      };
    case "pgSetContact":
      return {
        ...state,
        program: state.program.map((r) => {
          if (r.id !== a.id) return r;
          const patch = (c: { tag: string; nc: boolean }, i: number) =>
            i === a.idx ? { ...c, ...(a.tag !== undefined ? { tag: a.tag } : {}), ...(a.nc !== undefined ? { nc: a.nc } : {}) } : c;
          if (a.branch < 0) return { ...r, tail: (r.tail ?? []).map(patch) };
          return {
            ...r,
            branches: r.branches.map((b, i) =>
              i === a.branch ? { ...b, contacts: b.contacts.map(patch) } : b,
            ),
          };
        }),
      };
    case "pgSetCoil":
      return {
        ...state,
        program: state.program.map((r) => (r.id === a.id ? { ...r, coil: a.tag } : r)),
      };
    case "trip":
      if (state.tripped[a.id]) return state;
      return {
        ...state,
        tripped: { ...state.tripped, [a.id]: true },
        notice: `${state.devices.find((d) => d.id === a.id)?.name ?? "Overload"} tripped — press Reset in its properties`,
      };
    case "resetTrip": {
      const t = { ...state.tripped };
      delete t[a.id];
      return { ...state, tripped: t };
    }
    case "pgSetPreset":
      return {
        ...state,
        program: state.program.map((r) =>
          r.id === a.id ? { ...r, preset: Math.max(0.1, a.sec) } : r,
        ),
      };
    case "pgSetComment":
      return {
        ...state,
        program: state.program.map((r) => (r.id === a.id ? { ...r, comment: a.text } : r)),
      };
    default:
      return state;
  }
}

export function reducer(state: State, a: Action): State {
  if (a.t === "undo" || a.t === "redo") return base(state, a);
  const next = base(state, a);
  const docChanged =
    next.devices !== state.devices ||
    next.wires !== state.wires ||
    next.projectName !== state.projectName;
  if (docChanged)
    return {
      ...next,
      past: [...state.past, snap(state)].slice(0, 100),
      future: [],
    };
  return next;
}

const StateCtx = createContext<State>(initial);
const DispatchCtx = createContext<Dispatch<Action>>(() => {});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => state, [state]);
  return (
    <StateCtx.Provider value={value}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export const useApp = () => useContext(StateCtx);
export const useDispatchApp = () => useContext(DispatchCtx);
