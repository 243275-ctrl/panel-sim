import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

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
  a: { dev: string; term: 0 | 1 };
  b: { dev: string; term: 0 | 1 };
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
  wireFrom: { dev: string; term: 0 | 1 } | null;
  running: boolean;
  pressed: string[];
  notice: string | null;
  past: DocSnap[];
  future: DocSnap[];
}

export type Action =
  | { t: "start"; example: boolean }
  | { t: "tool"; tool: ToolMode }
  | { t: "placeType"; dt: DeviceType }
  | { t: "place"; id: string; x: number; y: number }
  | { t: "select"; sel: Selection }
  | { t: "wireClick"; dev: string; term: 0 | 1 }
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
  | { t: "open"; projectName: string; devices: Device[]; wires: Wire[]; id: string }
  | { t: "notice"; text: string | null };

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
      if (a.example) {
        const ex = exampleProject();
        return {
          ...initial,
          started: true,
          projectName: "Example — pilot light",
          ...ex,
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
                ? { connection: 12 }
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
      return { ...state, running: true, notice: null };
    case "stop":
      return { ...state, running: false, pressed: [] };
    case "reset":
      return {
        ...state,
        running: false,
        pressed: [],
        selection: null,
        wireFrom: null,
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
