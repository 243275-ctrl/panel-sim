import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  useDispatchApp,
  useApp,
  type Device,
  type DeviceType,
} from "../state/store";
import { TYPE_META } from "../data/library";
import { simulate } from "../solver/solver";

const SNAP = 20;
const TERM_DX = 30;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Terminal position in content coords, honouring flip + rotation. */
export function terminalPos(d: Device, term: 0 | 1) {
  let dx = term === 0 ? -TERM_DX : TERM_DX;
  const dy = 0;
  if (d.flip) dx = -dx;
  const rot = d.rot ?? 0;
  const [rx, ry] =
    rot === 90
      ? [-dy, dx]
      : rot === 180
        ? [-dx, -dy]
        : rot === 270
          ? [dy, -dx]
          : [dx, dy];
  return { x: d.x + rx, y: d.y + ry };
}

export function Canvas() {
  const s = useApp();
  const dispatch = useDispatchApp();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(
    null,
  );
  const suppressClick = useRef(false);

  const sim = simulate(s.devices, s.wires, s.pressed, s.running);

  // release held buttons on any pointer-up
  useEffect(() => {
    const up = () => {
      for (const id of s.pressed) dispatch({ t: "release", id });
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [s.pressed, dispatch]);

  // wheel zoom (non-passive)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const v = viewRef.current;
      const k = clamp(v.k * Math.exp(-e.deltaY * 0.0015), 0.35, 3);
      const f = k / v.k;
      setView({ k, x: mx - (mx - v.x) * f, y: my - (my - v.y) * f });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // keyboard: tools, delete, undo/redo, rotate/flip
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        dispatch({ t: e.shiftKey ? "redo" : "undo" });
      } else if (mod && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        dispatch({ t: "redo" });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        dispatch({ t: "deleteSel" });
      } else if (e.key === "Escape") {
        dispatch({ t: "tool", tool: "select" });
        dispatch({ t: "select", sel: null });
      } else if (e.key === "w" || e.key === "W") {
        dispatch({ t: "tool", tool: "wire" });
      } else if (e.key === "v" || e.key === "V") {
        dispatch({ t: "tool", tool: "select" });
      } else if ((e.key === "r" || e.key === "R") && s.selection?.kind === "d") {
        dispatch({ t: "rotate" });
      } else if ((e.key === "m" || e.key === "M") && s.selection?.kind === "d") {
        dispatch({ t: "flip" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dispatch, s.selection]);

  const toLocal = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: (clientX - r.left - v.x) / v.k,
      y: (clientY - r.top - v.y) / v.k,
    };
  };

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    const target = e.target as SVGElement;
    if (!target.dataset?.bg) return;
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: view.x,
      oy: view.y,
    };
    suppressClick.current = false;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onSurfacePointerMove = (e: React.PointerEvent) => {
    setMouse(toLocal(e.clientX, e.clientY));
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) suppressClick.current = true;
    setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
  };

  const onSurfacePointerUp = () => {
    dragRef.current = null;
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const target = e.target as SVGElement;
    if (e.target !== e.currentTarget && !target.dataset?.bg) return;
    const p = toLocal(e.clientX, e.clientY);
    if (s.tool === "place" && s.placeType) {
      dispatch({ t: "place", id: "x", x: snap(p.x), y: snap(p.y) });
    } else if (s.tool === "select") {
      dispatch({ t: "select", sel: null });
    } else if (s.tool === "wire" && s.wireFrom) {
      dispatch({ t: "tool", tool: "select" });
    }
  };

  const onDevicePointerDown = (e: React.PointerEvent, d: Device) => {
    e.stopPropagation();
    if (s.tool === "wire" || s.tool === "place") return;
    dispatch({ t: "select", sel: { kind: "d", id: d.id } });
    if (d.type === "button" && s.running) dispatch({ t: "press", id: d.id });
  };

  const onTerminalClick = (e: React.MouseEvent, d: Device, term: 0 | 1) => {
    e.stopPropagation();
    if (s.tool !== "wire") return;
    dispatch({ t: "wireClick", dev: d.id, term });
  };

  const deviceByName = (id: string) => s.devices.find((d) => d.id === id)!;
  const fromPos =
    s.wireFrom && s.devices.some((d) => d.id === s.wireFrom!.dev)
      ? terminalPos(deviceByName(s.wireFrom.dev), s.wireFrom.term)
      : null;

  const transform = `translate(${view.x} ${view.y}) scale(${view.k})`;

  return (
    <div className="canvas-wrap">
      {s.running && sim.faults.length > 0 && (
        <div
          className={`banner ${sim.faults.some((f) => f.includes("Short")) ? "danger" : "warn"}`}
          role="alert"
        >
          <span aria-hidden>⚠</span> {sim.faults[0]}
          {sim.faults.length > 1 && ` (+${sim.faults.length - 1} more)`}
        </div>
      )}
      <svg
        ref={svgRef}
        className={`canvas tool-${s.tool}`}
        onClick={onSurfaceClick}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={onSurfacePointerUp}
        onPointerLeave={() => setMouse(null)}
      >
        <defs>
          <pattern
            id="gridMinor"
            width={SNAP}
            height={SNAP}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${SNAP} 0 L 0 0 0 ${SNAP}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          </pattern>
          <pattern
            id="gridMajor"
            width={SNAP * 5}
            height={SNAP * 5}
            patternUnits="userSpaceOnUse"
          >
            <rect width={SNAP * 5} height={SNAP * 5} fill="url(#gridMinor)" />
            <path
              d={`M ${SNAP * 5} 0 L 0 0 0 ${SNAP * 5}`}
              fill="none"
              stroke="var(--color-border-input)"
              strokeWidth="1"
              opacity="0.5"
            />
          </pattern>
        </defs>

        <g transform={transform}>
          <rect
            data-bg="1"
            x={-4000}
            y={-4000}
            width={12000}
            height={12000}
            fill="var(--color-canvas)"
          />
          <rect
            data-bg="1"
            x={-4000}
            y={-4000}
            width={12000}
            height={12000}
            fill="url(#gridMajor)"
          />

          {/* wires */}
          {s.wires.map((w) => {
            const da = s.devices.find((d) => d.id === w.a.dev);
            const db = s.devices.find((d) => d.id === w.b.dev);
            if (!da || !db) return null;
            const pa = terminalPos(da, w.a.term);
            const pb = terminalPos(db, w.b.term);
            const isLive = s.running && sim.live.has(w.id);
            const isSel =
              s.selection?.kind === "w" && s.selection.id === w.id;
            return (
              <g key={w.id}>
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="transparent"
                  strokeWidth={14 / view.k}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (s.tool === "select")
                      dispatch({ t: "select", sel: { kind: "w", id: w.id } });
                  }}
                />
                <line
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  className={isLive ? "wire hot" : "wire"}
                  stroke={isSel ? "var(--color-accent)" : undefined}
                  pointerEvents="none"
                />
              </g>
            );
          })}

          {/* wire preview */}
          {s.tool === "wire" && fromPos && mouse && (
            <line
              x1={fromPos.x}
              y1={fromPos.y}
              x2={snap(mouse.x)}
              y2={snap(mouse.y)}
              className="wire preview"
              pointerEvents="none"
            />
          )}

          {/* devices */}
          {s.devices.map((d) => (
            <DeviceG
              key={d.id}
              d={d}
              lit={sim.lit.has(d.id)}
              selected={
                s.selection?.kind === "d" && s.selection.id === d.id
              }
              wireMode={s.tool === "wire"}
              wireFromHere={s.wireFrom?.dev === d.id ? s.wireFrom.term : null}
              k={view.k}
              onPointerDown={onDevicePointerDown}
              onTerminalClick={onTerminalClick}
            />
          ))}

          {/* ghost while placing */}
          {s.tool === "place" && s.placeType && mouse && (
            <g
              transform={`translate(${snap(mouse.x)} ${snap(mouse.y)})`}
              opacity="0.5"
              pointerEvents="none"
            >
              <g transform="rotate(0)">
                <SymbolArt type={s.placeType} />
              </g>
              <text className="dev-label" y={40} textAnchor="middle">
                {PLACE_LABEL[s.placeType]}
              </text>
            </g>
          )}
        </g>
      </svg>
      <div className="zoom-badge" aria-hidden>
        {Math.round(view.k * 100)}% · scroll to zoom · drag to pan
      </div>
    </div>
  );
}

const PLACE_LABEL: Record<DeviceType, string> = {
  source: "DC source",
  "ac-source": "AC source",
  ground: "Ground",
  button: "Push button NO",
  "button-nc": "Push button NC",
  selector: "Selector switch",
  lamp: "Pilot light",
  resistor: "Resistor",
  capacitor: "Capacitor",
  inductor: "Inductor",
  fuse: "Fuse",
  breaker: "Circuit breaker",
  overload: "Overload relay",
  contactor: "Contactor",
  motor: "Three-phase motor",
};

function deviceLabel(d: Device): string {
  const short = TYPE_META[d.type].short.toLowerCase();
  if (d.type === "source") return `${d.name} · ${d.params.v ?? 24} V`;
  if (d.type === "resistor" || d.type === "lamp")
    return `${d.name} · ${d.params.r ?? 100} Ω`;
  return `${d.name} · ${short}`;
}

function DeviceG(props: {
  d: Device;
  lit: boolean;
  selected: boolean;
  wireMode: boolean;
  wireFromHere: 0 | 1 | null;
  k: number;
  onPointerDown: (e: React.PointerEvent, d: Device) => void;
  onTerminalClick: (e: React.MouseEvent, d: Device, term: 0 | 1) => void;
}) {
  const { d, lit, selected, wireMode, wireFromHere, k } = props;
  const rot = d.rot ?? 0;
  return (
    <g
      transform={`translate(${d.x} ${d.y})`}
      className={`device ${selected ? "sel" : ""}`}
      style={{ cursor: "pointer" }}
      onPointerDown={(e) => props.onPointerDown(e, d)}
      role="img"
      aria-label={`${d.name} ${d.type}${lit ? " lit" : ""}`}
    >
      {selected && (
        <rect
          className="sel-ring"
          x={-44}
          y={-40}
          width={88}
          height={80}
          rx={8}
        />
      )}
      <g transform={`rotate(${rot})${d.flip ? " scale(-1 1)" : ""}`}>
        <SymbolArt type={d.type} lit={lit} />
      </g>
      <text className="dev-label" y={44} textAnchor="middle">
        {deviceLabel(d)}
      </text>
      {([0, 1] as const).map((t) => {
        const p = terminalPos(d, t);
        const lx = p.x - d.x;
        const ly = p.y - d.y;
        return (
          <g key={t} transform={`translate(${lx} ${ly})`}>
            <circle
              className={`term ${wireMode ? "hot" : ""} ${wireFromHere === t ? "on" : ""}`}
              r={(wireMode ? 7 : 5) / Math.max(0.6, k)}
              onClick={(e) => props.onTerminalClick(e, d, t)}
              style={{ cursor: wireMode ? "crosshair" : "default" }}
            />
            {wireMode && (
              <circle
                r={16 / Math.max(0.6, k)}
                fill="transparent"
                onClick={(e) => props.onTerminalClick(e, d, t)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Own schematic artwork — drawn fresh, no external assets. */
function SymbolArt({ type, lit }: { type: DeviceType; lit?: boolean }) {
  switch (type) {
    case "source":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-10} y2={0} className="wire" />
          <line x1={10} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <line x1={-10} y1={-16} x2={-10} y2={16} className="sym" strokeWidth="2.5" />
          <line x1={10} y1={-8} x2={10} y2={8} className="sym" strokeWidth="5" />
        </g>
      );
    case "ac-source":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-16} y2={0} className="wire" />
          <line x1={16} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle r={16} className="lamp" />
          <path
            d="M -9 0 Q -4.5 -9 0 0 Q 4.5 9 9 0"
            className="sym"
            strokeWidth="2"
          />
        </g>
      );
    case "ground":
      return (
        <g>
          <line x1={0} y1={-24} x2={0} y2={0} className="wire" />
          <line x1={-16} y1={0} x2={16} y2={0} className="sym" strokeWidth="2.5" />
          <line x1={-10} y1={7} x2={10} y2={7} className="sym" strokeWidth="2.5" />
          <line x1={-4} y1={14} x2={4} y2={14} className="sym" strokeWidth="2.5" />
        </g>
      );
    case "button":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-12} y2={0} className="wire" />
          <line x1={12} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle cx={-12} cy={0} r={3} className="sym-fill" />
          <circle cx={12} cy={0} r={3} className="sym-fill" />
          <line x1={-12} y1={0} x2={12} y2={-14} className="sym" strokeWidth="2.5" />
          <line x1={0} y1={-14} x2={0} y2={-24} className="sym" strokeWidth="2.5" />
          <rect x={-8} y={-30} width={16} height={7} rx={3} className="sym" strokeWidth="2" />
        </g>
      );
    case "button-nc":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-12} y2={0} className="wire" />
          <line x1={12} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle cx={-12} cy={0} r={3} className="sym-fill" />
          <circle cx={12} cy={0} r={3} className="sym-fill" />
          <line x1={-14} y1={-4} x2={14} y2={-10} className="sym" strokeWidth="2.5" />
          <line x1={0} y1={-10} x2={0} y2={-22} className="sym" strokeWidth="2.5" />
          <rect x={-8} y={-28} width={16} height={7} rx={3} className="sym" strokeWidth="2" />
        </g>
      );
    case "selector":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-14} y2={0} className="wire" />
          <line x1={14} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle r={14} className="lamp" />
          <line x1={0} y1={0} x2={9} y2={-9} className="sym" strokeWidth="2.5" />
          <circle r={2.5} className="sym-fill" />
        </g>
      );
    case "lamp":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-16} y2={0} className="wire" />
          <line x1={16} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle r={16} className={`lamp ${lit ? "on" : ""}`} />
          <line x1={-8} y1={-8} x2={8} y2={8} className="sym" strokeWidth="2" />
          <line x1={-8} y1={8} x2={8} y2={-8} className="sym" strokeWidth="2" />
          {lit && (
            <g className="rays">
              <line x1={0} y1={-24} x2={0} y2={-30} className="sym" strokeWidth="2" />
              <line x1={17} y1={-17} x2={22} y2={-22} className="sym" strokeWidth="2" />
              <line x1={24} y1={0} x2={30} y2={0} className="sym" strokeWidth="2" />
              <line x1={-17} y1={-17} x2={-22} y2={-22} className="sym" strokeWidth="2" />
              <line x1={-24} y1={0} x2={-30} y2={0} className="sym" strokeWidth="2" />
            </g>
          )}
        </g>
      );
    case "resistor":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-20} y2={0} className="wire" />
          <line x1={20} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <path
            d="M -20 0 L -16 -9 L -8 9 L 0 -9 L 8 9 L 16 -9 L 20 0"
            className="sym"
            strokeWidth="2.5"
          />
        </g>
      );
    case "capacitor":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-6} y2={0} className="wire" />
          <line x1={6} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <line x1={-6} y1={-16} x2={-6} y2={16} className="sym" strokeWidth="3" />
          <line x1={6} y1={-16} x2={6} y2={16} className="sym" strokeWidth="3" />
        </g>
      );
    case "inductor":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-18} y2={0} className="wire" />
          <line x1={18} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <path
            d="M -18 0 A 6 6 0 0 1 -6 0 A 6 6 0 0 1 6 0 A 6 6 0 0 1 18 0"
            className="sym"
            strokeWidth="2.5"
          />
        </g>
      );
    case "fuse":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-16} y2={0} className="wire" />
          <line x1={16} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <rect x={-16} y={-9} width={32} height={18} rx={3} className="sym" strokeWidth="2" />
          <line x1={-16} y1={0} x2={16} y2={0} className="sym" strokeWidth="2" />
        </g>
      );
    case "breaker":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-12} y2={0} className="wire" />
          <line x1={12} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle cx={-12} cy={0} r={3} className="sym-fill" />
          <circle cx={12} cy={0} r={3} className="sym-fill" />
          <line x1={-12} y1={0} x2={10} y2={-13} className="sym" strokeWidth="2.5" />
          <path d="M -4 -14 Q 0 -20 5 -14" className="sym" strokeWidth="2" />
        </g>
      );
    case "overload":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-22} y2={0} className="wire" />
          <line x1={22} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <rect x={-22} y={-12} width={44} height={24} rx={4} className="sym" strokeWidth="2" />
          <path
            d="M -16 6 Q -10 -8 -4 6 Q 2 -8 8 6 Q 12 -4 16 0"
            className="sym"
            strokeWidth="2"
          />
        </g>
      );
    case "contactor":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-24} y2={0} className="wire" />
          <line x1={24} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle cx={-16} cy={0} r={3} className="sym-fill" />
          <circle cx={16} cy={0} r={3} className="sym-fill" />
          <line x1={-16} y1={0} x2={14} y2={-12} className="sym" strokeWidth="2.5" />
          <line x1={0} y1={-22} x2={0} y2={-12} className="sym" strokeWidth="2" />
          <rect x={-10} y={-30} width={20} height={8} rx={2} className="sym" strokeWidth="2" />
        </g>
      );
    case "motor":
      return (
        <g>
          <line x1={-TERM_DX} y1={0} x2={-18} y2={0} className="wire" />
          <line x1={18} y1={0} x2={TERM_DX} y2={0} className="wire" />
          <circle r={18} className="lamp" />
          <text className="dev-label" y={4} textAnchor="middle" fontSize={14}>
            M
          </text>
        </g>
      );
  }
}
