import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  useDispatchApp,
  useApp,
  type Device,
} from "../state/store";
import { simulate } from "../solver/solver";

const SNAP = 20;
const TERM_DX = 30;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;

export function terminalPos(d: Device, term: 0 | 1) {
  return { x: d.x + (term === 0 ? -TERM_DX : TERM_DX), y: d.y };
}

export function Canvas() {
  const s = useApp();
  const dispatch = useDispatchApp();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const sim = simulate(s.devices, s.wires, s.pressed, s.running);

  // release all held buttons on any pointer-up (window wide)
  useEffect(() => {
    const up = () => {
      for (const id of s.pressed) dispatch({ t: "release", id });
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, [s.pressed, dispatch]);

  // keyboard: tools + delete
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        dispatch({ t: "deleteSel" });
      } else if (e.key === "Escape") {
        dispatch({ t: "tool", tool: "select" });
        dispatch({ t: "select", sel: null });
      } else if (e.key === "w" || e.key === "W") {
        dispatch({ t: "tool", tool: "wire" });
      } else if (e.key === "v" || e.key === "V") {
        dispatch({ t: "tool", tool: "select" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dispatch]);

  const toLocal = (e: React.PointerEvent | React.MouseEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget && !(e.target as SVGElement).dataset?.bg)
      return;
    const p = toLocal(e);
    if (s.tool === "place" && s.placeType) {
      dispatch({ t: "place", id: "x", x: snap(p.x), y: snap(p.y) });
    } else if (s.tool === "select") {
      dispatch({ t: "select", sel: null });
    } else if (s.tool === "wire") {
      dispatch({ t: "select", sel: null }); // keeps wireFrom; click empty cancels below
      if (s.wireFrom) dispatch({ t: "tool", tool: "select" });
    }
  };

  const onDevicePointerDown = (e: React.PointerEvent, d: Device) => {
    e.stopPropagation();
    if (s.tool === "wire") return; // terminals handle wiring
    if (s.tool === "place") return;
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
        data-bg="1"
        onClick={onSurfaceClick}
        onPointerMove={(e) => setMouse(toLocal(e))}
        onPointerLeave={() => setMouse(null)}
      >
        <defs>
          <pattern id="gridMinor" width={SNAP} height={SNAP} patternUnits="userSpaceOnUse">
            <path
              d={`M ${SNAP} 0 L 0 0 0 ${SNAP}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
          </pattern>
          <pattern id="gridMajor" width={SNAP * 5} height={SNAP * 5} patternUnits="userSpaceOnUse">
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
        <rect data-bg="1" width="100%" height="100%" fill="var(--color-canvas)" />
        <rect data-bg="1" width="100%" height="100%" fill="url(#gridMajor)" />

        {/* wires */}
        {s.wires.map((w) => {
          const da = s.devices.find((d) => d.id === w.a.dev);
          const db = s.devices.find((d) => d.id === w.b.dev);
          if (!da || !db) return null;
          const pa = terminalPos(da, w.a.term);
          const pb = terminalPos(db, w.b.term);
          const isLive = s.running && sim.live.has(w.id);
          const isSel = s.selection?.kind === "w" && s.selection.id === w.id;
          return (
            <g key={w.id}>
              <line
                x1={pa.x}
                y1={pa.y}
                x2={pb.x}
                y2={pb.y}
                stroke="transparent"
                strokeWidth="14"
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
            selected={s.selection?.kind === "d" && s.selection.id === d.id}
            wireMode={s.tool === "wire"}
            wireFromHere={
              s.wireFrom?.dev === d.id
                ? s.wireFrom.term
                : null
            }
            onPointerDown={onDevicePointerDown}
            onTerminalClick={onTerminalClick}
          />
        ))}

        {/* ghost while placing */}
        {s.tool === "place" && s.placeType && mouse && (
          <g transform={`translate(${snap(mouse.x)},${snap(mouse.y)})`} opacity="0.5" pointerEvents="none">
            <Ghost type={s.placeType} name="?" lit={false} />
          </g>
        )}
      </svg>
    </div>
  );
}

function DeviceG(props: {
  d: Device;
  lit: boolean;
  selected: boolean;
  wireMode: boolean;
  wireFromHere: 0 | 1 | null;
  onPointerDown: (e: React.PointerEvent, d: Device) => void;
  onTerminalClick: (e: React.MouseEvent, d: Device, term: 0 | 1) => void;
}) {
  const { d, lit, selected, wireMode, wireFromHere } = props;
  return (
    <g
      transform={`translate(${d.x},${d.y})`}
      className={`device ${selected ? "sel" : ""}`}
      style={{ cursor: "pointer" }}
      onPointerDown={(e) => props.onPointerDown(e, d)}
      role="img"
      aria-label={`${d.name} ${d.type}${lit ? " lit" : ""}`}
    >
      {selected && <rect className="sel-ring" x={-44} y={-32} width={88} height={64} rx={8} />}
      <Ghost type={d.type} name={d.name} lit={lit} />
      {([0, 1] as const).map((t) => (
        <g key={t} transform={`translate(${t === 0 ? -TERM_DX : TERM_DX},0)`}>
          <circle
            className={`term ${wireMode ? "hot" : ""} ${wireFromHere === t ? "on" : ""}`}
            r={wireMode ? 7 : 5}
            onClick={(e) => props.onTerminalClick(e, d, t)}
            style={{ cursor: wireMode ? "crosshair" : "default" }}
          />
          {wireMode && <circle r={14} fill="transparent" onClick={(e) => props.onTerminalClick(e, d, t)} />}
        </g>
      ))}
    </g>
  );
}

function Ghost({ type, name, lit }: { type: Device["type"]; name: string; lit: boolean }) {
  if (type === "source")
    return (
      <g>
        <line x1={-TERM_DX} y1={0} x2={-10} y2={0} className="wire" />
        <line x1={10} y1={0} x2={TERM_DX} y2={0} className="wire" />
        <line x1={-10} y1={-16} x2={-10} y2={16} className="sym" strokeWidth="2.5" />
        <line x1={10} y1={-8} x2={10} y2={8} className="sym" strokeWidth="5" />
        <text className="dev-label" y={34} textAnchor="middle">
          {name} ·24 V
        </text>
      </g>
    );
  if (type === "button")
    return (
      <g>
        <line x1={-TERM_DX} y1={0} x2={-12} y2={0} className="wire" />
        <line x1={12} y1={0} x2={TERM_DX} y2={0} className="wire" />
        <circle cx={-12} cy={0} r={3} className="sym-fill" />
        <circle cx={12} cy={0} r={3} className="sym-fill" />
        <line x1={-12} y1={0} x2={12} y2={-14} className="sym" strokeWidth="2.5" />
        <line x1={0} y1={-14} x2={0} y2={-24} className="sym" strokeWidth="2.5" />
        <rect x={-8} y={-30} width={16} height={7} rx={3} className="sym" strokeWidth="2" />
        <text className="dev-label" y={34} textAnchor="middle">
          {name} · NO
        </text>
      </g>
    );
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
      <text className="dev-label" y={34} textAnchor="middle">
        {name} · pilot light
      </text>
    </g>
  );
}
