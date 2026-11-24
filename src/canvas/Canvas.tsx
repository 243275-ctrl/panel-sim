import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  useDispatchApp,
  useApp,
  type Device,
} from "../state/store";
import { TYPE_META, termCount } from "../data/library";
import { DeviceArt } from "../art/Pictorial";
import { simulate } from "../solver/solver";

const SNAP = 20;
const TERM_DX = 30;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Terminal position in content coords, honouring flip + rotation.
 * terms 0/1 sit on the sides (±30, 0); extra I/O terminals run across the
 * top (odd channels) and bottom edges — see termsOf() labels in library. */
export function terminalPos(d: Device, term: number) {
  const count = termCount(d.type);
  let dx: number;
  let dy: number;
  if (term <= 1) {
    dx = term === 0 ? -TERM_DX : TERM_DX;
    dy = 0;
  } else {
    const extra = count - 2;
    const topN = Math.ceil(extra / 2);
    const botN = extra - topN;
    const spread = (i: number, n: number) => (n <= 1 ? 0 : -18 + i * (36 / (n - 1)));
    const idx = term - 2;
    if (idx < topN) {
      dx = spread(idx, topN);
      dy = -31;
    } else {
      dx = spread(idx - topN, botN);
      dy = 31;
    }
  }
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

  const sim = simulate(s.devices, s.wires, s.pressed, s.running, {
    plcOut: s.plc.outputs,
    tripped: s.tripped,
  });

  // release held buttons on any pointer-up
  useEffect(() => {
    const up = () => {
      for (const id of s.pressed) dispatch({ t: "release", id });
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [s.pressed, dispatch]);

  // PLC scan clock — one ladder scan per tick while running
  useEffect(() => {
    if (!s.running) return;
    const id = window.setInterval(() => dispatch({ t: "tick" }), 150);
    return () => window.clearInterval(id);
  }, [s.running, dispatch]);

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
    if ((d.type === "button" || d.type === "button-nc") && s.running)
      dispatch({ t: "press", id: d.id });
  };

  const onTerminalClick = (e: React.MouseEvent, d: Device, term: number) => {
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

          {/* panel board backdrop (our own generic enclosure + DIN rails) */}
          <g pointerEvents="none">
            <rect x={60} y={80} width={840} height={340} rx={10} fill="#e9ebee" stroke="#b9c0c7" strokeWidth="3" />
            <rect x={72} y={92} width={816} height={316} rx={6} fill="none" stroke="#f5f6f8" strokeWidth="2" />
            {[240, 350].map((ry) => (
              <g key={ry}>
                <rect x={90} y={ry - 6} width={780} height={12} rx={2} fill="#c8ced4" stroke="#8a939c" strokeWidth="1.4" />
                <line x1={94} y1={ry - 3} x2={866} y2={ry - 3} stroke="#eef0f2" strokeWidth="1.6" />
                <ScrewDot x={100} y={ry} />
                <ScrewDot x={860} y={ry} />
              </g>
            ))}
            <text x={78} y={410} fontSize={11} fill="#8a939c" fontWeight="600">
              DIN rail panel
            </text>
          </g>

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
              lit={
                sim.lit.has(d.id) &&
                !(d.type === "overload" && s.tripped[d.id])
              }
              readings={sim.readings}
              io={
                d.type === "plc"
                  ? { ins: s.plc.inputs, outs: s.plc.outputs }
                  : undefined
              }
              readout={
                d.type === "overload" && s.tripped[d.id]
                  ? { text: "TRIP", frac: 1 }
                  : meterReadout(d, sim.readings[d.id])
              }
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
              opacity="0.55"
              pointerEvents="none"
            >
              <DeviceArt type={s.placeType} />
              <text className="dev-label" y={44} textAnchor="middle">
                {TYPE_META[s.placeType]?.short ?? s.placeType}
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

function ScrewDot({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={3.4} fill="#aab4bd" stroke="#3d4852" strokeWidth="1.1" />
      <line x1={x - 2} y1={y} x2={x + 2} y2={y} stroke="#3d4852" strokeWidth="1.2" />
    </g>
  );
}

function meterReadout(
  d: Device,
  r?: { v: number; i: number },
): { text: string; frac?: number } | undefined {
  if (!r) return undefined;
  switch (d.type) {
    case "voltmeter":
      return { text: `${r.v.toFixed(1)} V`, frac: r.v / 500 };
    case "ammeter":
      return { text: `${r.i.toFixed(2)} A`, frac: r.i / 50 };
    case "multimeter":
      return { text: `${r.v.toFixed(2)} V` };
    case "clamp":
      return { text: `${r.i.toFixed(2)} A` };
    case "overload": {
      const rating = d.params.in ?? 6.3;
      return { text: `${r.i.toFixed(2)} A`, frac: Math.min(1, r.i / rating) };
    }
    case "vfd": {
      const run = d.params.run === 1;
      return { text: run ? `${(d.params.f ?? 50).toFixed(1)} Hz` : "STOP" };
    }
    default:
      return undefined;
  }
}

function deviceLabel(d: Device, readings?: Record<string, { v: number }>): string {
  const short = (TYPE_META[d.type]?.short ?? d.type).toLowerCase();
  if (d.type === "source") return `${d.name} · ${d.params.v ?? 24} V`;
  if (d.type === "resistor" || d.type === "lamp" || d.type === "lamp-amber")
    return `${d.name} · ${d.params.r ?? 100} Ω`;
  if (d.type === "motor" || d.type === "motor-1ph" || d.type === "motor-dc") {
    const v = Math.abs(readings?.[d.id]?.v ?? 0);
    return v > 10
      ? `${d.name} · ${Math.round((1500 * Math.min(v, 400)) / 400)} rpm`
      : `${d.name} · stopped`;
  }
  if (d.type === "vfd")
    return `${d.name} · ${d.params.run === 1 ? `${d.params.f ?? 50} Hz` : "stopped"}`;
  return `${d.name} · ${short}`;
}

function DeviceG(props: {
  d: Device;
  lit: boolean;
  readout?: { text: string; frac?: number };
  readings?: Record<string, { v: number }>;
  io?: { ins: boolean[]; outs: boolean[] };
  selected: boolean;
  wireMode: boolean;
  wireFromHere: number | null;
  k: number;
  onPointerDown: (e: React.PointerEvent, d: Device) => void;
  onTerminalClick: (e: React.MouseEvent, d: Device, term: number) => void;
}) {
  const { d, lit, readout, readings, io, selected, wireMode, wireFromHere, k } = props;
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
        <DeviceArt type={d.type} lit={lit} readout={readout} io={io} />
      </g>
      <text className="dev-label" y={44} textAnchor="middle">
        {deviceLabel(d, readings)}
      </text>
      {Array.from({ length: termCount(d.type) }, (_, t) => {
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
