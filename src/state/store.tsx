import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

export type ToolMode = "select" | "wire" | "place";
export type DeviceType = "source" | "button" | "lamp";

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  params: Record<string, number>;
}

export interface Wire {
  id: string;
  a: { dev: string; term: 0 | 1 };
  b: { dev: string; term: 0 | 1 };
}

export type Selection = { kind: "d" | "w"; id: string } | null;

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
  | { t: "param"; id: string; key: string; value: number };

export const uid = (prefix: string) =>
  prefix + Math.random().toString(36).slice(2, 9);

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
};

export function reducer(state: State, a: Action): State {
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
      const prefix = type === "source" ? "V" : type === "button" ? "S" : "H";
      const device: Device = {
        id: uid(prefix),
        type,
        name: `${prefix}${counts(state, type)}`,
        x: a.x,
        y: a.y,
        params: type === "source" ? { v: 24 } : type === "lamp" ? { r: 100 } : {},
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
      const wire: Wire = { id: uid("w"), a: first, b: { dev: a.dev, term: a.term } };
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
      return { ...state, running: true };
    case "stop":
      return { ...state, running: false, pressed: [] };
    case "reset":
      return { ...state, running: false, pressed: [], selection: null, wireFrom: null };
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
    default:
      return state;
  }
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
