import { useRef, useState, type ChangeEvent } from "react";
import {
  useDispatchApp,
  useApp,
} from "../state/store";
import { CATEGORIES, LIBRARY, matches, TYPE_META } from "../data/library";
import { DeviceArt } from "../art/Pictorial";
import { parseAndValidate, serialize } from "../state/psim";
import { simulate } from "../solver/solver";

const fmtV = (v: number) => `${v.toFixed(2)} V`;
const fmtI = (i: number) =>
  Math.abs(i) < 1 ? `${(i * 1000).toFixed(1)} mA` : `${i.toFixed(3)} A`;

export function TitleBar() {
  const s = useApp();
  return (
    <header className="titlebar">
      <span aria-hidden>⚡</span>
      <span>panel-sim</span>
      <span className="project">— {s.projectName}</span>
      <span className="spacer" />
      <span className="win-controls" aria-hidden>
        <span>–</span>
        <span>□</span>
        <span>✕</span>
      </span>
    </header>
  );
}

export function Toolbar() {
  const s = useApp();
  const dispatch = useDispatchApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const onSave = () => {
    const text = serialize(s.devices, s.wires, s.projectName, undefined, s.program);
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(s.projectName || "project").replace(/[^\w\- ]+/g, "")}.psim`;
    a.click();
    URL.revokeObjectURL(a.href);
    dispatch({ t: "notice", text: "Project downloaded (.psim)" });
  };

  const onOpenFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const res = parseAndValidate(text);
    if (!res.ok) {
      dispatch({
        t: "notice",
        text: `Cannot open: ${res.errors[0]}${res.errors.length > 1 ? ` (+${res.errors.length - 1})` : ""}`,
      });
      return;
    }
    dispatch({
      t: "open",
      projectName: res.doc.meta.name,
      devices: res.doc.devices,
      wires: res.doc.wires,
      program: res.doc.program,
      id: res.doc.meta.id,
    });
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Tools and simulation">
      <button
        className="tbtn"
        onClick={() => dispatch({ t: "undo" })}
        disabled={!s.past.length}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        className="tbtn"
        onClick={() => dispatch({ t: "redo" })}
        disabled={!s.future.length}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>
      <span className="sep" />
      <button className="tbtn" onClick={onSave} title="Download project (Ctrl+S)">
        💾 Save
      </button>
      <button
        className="tbtn"
        onClick={() => fileRef.current?.click()}
        title="Open .psim file"
      >
        📂 Open
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".psim,.json,application/json"
        hidden
        onChange={onOpenFile}
      />
      <span className="sep" />
      <button
        className={`tbtn ${s.tool === "select" ? "on" : ""}`}
        aria-pressed={s.tool === "select"}
        onClick={() => dispatch({ t: "tool", tool: "select" })}
        title="Select (V)"
      >
        ↖ Select
      </button>
      <button
        className={`tbtn ${s.tool === "wire" ? "on" : ""}`}
        aria-pressed={s.tool === "wire"}
        onClick={() => dispatch({ t: "tool", tool: "wire" })}
        title="Wire terminals (W)"
      >
        ⚡ Wire
      </button>
      <span className="sep" />
      <button
        className="tbtn run"
        onClick={() => dispatch({ t: "run" })}
        disabled={s.running}
        title="Run simulation"
      >
        ▶ Run
      </button>
      <button
        className="tbtn"
        onClick={() => dispatch({ t: "stop" })}
        disabled={!s.running}
        title="Stop simulation"
      >
        ■ Stop
      </button>
      <button
        className="tbtn"
        onClick={() => dispatch({ t: "reset" })}
        title="Reset"
      >
        ↺ Reset
      </button>
      <span className="sep" />
      <button
        className={`tbtn ${s.ladderOpen ? "on" : ""}`}
        aria-pressed={s.ladderOpen}
        onClick={() => dispatch({ t: "ladder" })}
        title="Ladder program editor"
      >
        ▤ Program
      </button>
      <span className="hint">
        {s.tool === "place"
          ? "Click the canvas to place — Esc cancels"
          : s.tool === "wire"
            ? "Click two terminals — Esc cancels"
            : "R rotate · M mirror · Del remove · hold a button while running"}
      </span>
    </div>
  );
}

export function StatusBar() {
  const s = useApp();
  const sim = simulate(s.devices, s.wires, s.pressed, s.running);
  return (
    <footer className="statusbar" role="status">
      <span>
        <span className={`dot ${s.running ? "run" : "stop"}`} />
        {s.running ? "Sim running" : "Stopped"}
      </span>
      <span>Mode: {s.tool}</span>
      <span>Snap: 20 px</span>
      <span>
        {s.devices.length} devices · {s.wires.length} wires
      </span>
      {s.notice && <span className="notice">{s.notice}</span>}
      <span className="mono">
        {s.running
          ? `${sim.current.toFixed(3)} A · ${sim.closed ? "loop closed" : "loop open"}`
          : "—"}
      </span>
      <span className="mono">
        {s.program.length ? `PLC scan ${s.plc.scan}` : "no program"}
      </span>
    </footer>
  );
}

export function LibraryPanel() {
  const s = useApp();
  const dispatch = useDispatchApp();
  const [q, setQ] = useState("");

  const visible = LIBRARY.filter((l) => matches(l, q));

  return (
    <aside className="panel" aria-label="Device library">
      <h2>Library</h2>
      <div className="pad">
        <input
          className="search"
          type="search"
          placeholder="Search devices…"
          aria-label="Search devices"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {CATEGORIES.map((cat) => {
          const items = visible.filter((l) => l.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat}>
              <h3 className="cat-head">{cat}</h3>
              {items.map((it) => (
                <button
                  key={it.type}
                  className={`tile ${s.tool === "place" && s.placeType === it.type ? "on" : ""}`}
                  onClick={() => dispatch({ t: "placeType", dt: it.type })}
                >
                  <span className="glyph" aria-hidden>
                    <svg viewBox="-44 -46 88 92" width="32" height="34">
                      <DeviceArt type={it.type} />
                    </svg>
                  </span>
                  <span>
                    {it.label}
                    <span className="meta">
                      {it.sim ? "simulated now" : it.meta}
                    </span>
                  </span>
                </button>
              ))}
            </section>
          );
        })}
        {!visible.length && <p className="hint-text">No devices match “{q}”.</p>}
        <p className="hint-text">
          {LIBRARY.length} types — every category, all free, nothing locked.
        </p>
      </div>
    </aside>
  );
}

export function PropertiesPanel() {
  const s = useApp();
  const dispatch = useDispatchApp();
  const sel =
    s.selection?.kind === "d"
      ? s.devices.find((d) => d.id === s.selection!.id)
      : undefined;
  const wireSel =
    s.selection?.kind === "w"
      ? s.wires.find((w) => w.id === s.selection!.id)
      : undefined;
  const sim = simulate(s.devices, s.wires, s.pressed, s.running);
  const live = sel && s.running ? sim.readings[sel.id] : undefined;

  return (
    <aside className="panel right" aria-label="Properties">
      <h2>Properties</h2>
      <div className="pad">
        {!sel && !wireSel && (
          <p className="hint-text">
            Select a device or a wire on the canvas to edit it.
          </p>
        )}
        {sel && (
          <>
            <div className="field">
              <label htmlFor="pname">Name</label>
              <input
                id="pname"
                value={sel.name}
                onChange={(e) =>
                  dispatch({ t: "rename", id: sel.id, name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <span className="ro">type</span>
              <div className="ro">{sel.type}</div>
            </div>
            <div className="field">
              <span className="ro">Terminals</span>
              <div className="terms">
                {[0, 1].map((t) => {
                  const w = s.wires.find(
                    (w) =>
                      (w.a.dev === sel.id && w.a.term === t) ||
                      (w.b.dev === sel.id && w.b.term === t),
                  );
                  const end = w
                    ? w.a.dev === sel.id
                      ? `${w.b.dev}:${w.b.term === 0 ? "1" : "2"}`
                      : `${w.a.dev}:${w.a.term === 0 ? "1" : "2"}`
                    : null;
                  const label =
                    TYPE_META[sel.type]?.terms?.[t] ?? String(t + 1);
                  return (
                    <div
                      key={t}
                      className={`term-row ${end ? "on" : "off"}`}
                    >
                      <span className="tno">{t + 1}</span>
                      <span className="tlabel">{label}</span>
                      <span className="tconn">
                        {end ? `→ ${end}` : "open"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="field">
              <span className="ro">Live</span>
              <div className={`ro ${live ? "live-on" : ""}`}>
                {!s.running
                  ? "stopped — press Run"
                  : live
                    ? `${fmtV(live.v)} · ${fmtI(live.i)}`
                    : "— (no model yet)"}
              </div>
            </div>
            <div className="row-btns">
              <button
                className="tbtn"
                onClick={() => dispatch({ t: "rotate" })}
                title="Rotate 90° (R)"
              >
                ↻ Rotate
              </button>
              <button
                className="tbtn"
                onClick={() => dispatch({ t: "flip" })}
                title="Mirror (M)"
              >
                ⇄ Mirror
              </button>
            </div>
            {sel.type === "source" && (
              <div className="field">
                <label htmlFor="pv">Voltage (V)</label>
                <input
                  id="pv"
                  type="number"
                  min={1}
                  max={1000}
                  value={sel.params.v ?? 24}
                  onChange={(e) =>
                    dispatch({
                      t: "param",
                      id: sel.id,
                      key: "v",
                      value: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
            {(sel.type === "lamp" || sel.type === "resistor") && (
              <div className="field">
                <label htmlFor="pr">Resistance (Ω)</label>
                <input
                  id="pr"
                  type="number"
                  min={1}
                  value={sel.params.r ?? 100}
                  onChange={(e) =>
                    dispatch({
                      t: "param",
                      id: sel.id,
                      key: "r",
                      value: Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
            {sel.type === "motor" && (
              <div className="field">
                <label htmlFor="pconn">Motor connection</label>
                <select
                  id="pconn"
                  value={sel.params.connection ?? 12}
                  onChange={(e) =>
                    dispatch({
                      t: "param",
                      id: sel.id,
                      key: "connection",
                      value: Number(e.target.value),
                    })
                  }
                >
                  <option value={6}>6-lead</option>
                  <option value={9}>9-lead</option>
                  <option value={12}>12-lead</option>
                </select>
              </div>
            )}
            {sel.type === "button" && (
              <p className="hint-text">
                Hold this button with the pointer while the simulation runs to
                close the contact.
              </p>
            )}

            {/* ---- VFD operator panel (drive programming) ---- */}
            {sel.type === "vfd" && (
              <>
                <div className="field">
                  <span className="ro">state</span>
                  <div className={`ro ${sel.params.run === 1 ? "live-on" : ""}`}>
                    {sel.params.run === 1
                      ? `RUN ${sel.params.dir === 1 ? "REV" : "FWD"} · ${(sel.params.f ?? 50).toFixed(1)} Hz`
                      : "STOP"}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="vf">Frequency setpoint (Hz)</label>
                  <input
                    id="vf"
                    type="range"
                    min={0}
                    max={120}
                    step={0.5}
                    value={sel.params.f ?? 50}
                    onChange={(e) =>
                      dispatch({ t: "param", id: sel.id, key: "f", value: Number(e.target.value) })
                    }
                  />
                  <span className="ro mono">{(sel.params.f ?? 50).toFixed(1)} Hz</span>
                </div>
                <div className="row-btns">
                  <button
                    className="tbtn"
                    onClick={() =>
                      dispatch({ t: "param", id: sel.id, key: "run", value: sel.params.run === 1 ? 0 : 1 })
                    }
                  >
                    {sel.params.run === 1 ? "■ Stop drive" : "▶ Run drive"}
                  </button>
                  <button
                    className="tbtn"
                    onClick={() =>
                      dispatch({ t: "param", id: sel.id, key: "dir", value: sel.params.dir === 1 ? 0 : 1 })
                    }
                  >
                    ⇄ {sel.params.dir === 1 ? "Reverse" : "Forward"}
                  </button>
                </div>
                <p className="hint-text">
                  Local control here; wire DI1/COM for a remote run command
                  (24 V on DI1 starts the drive).
                </p>
              </>
            )}

            {/* ---- PLC status + program ---- */}
            {sel.type === "plc" && (
              <>
                <div className="field">
                  <span className="ro">inputs</span>
                  <div className="io-row">
                    {s.plc.inputs.map((v, i) => (
                      <span key={i} className={`io-led ${v ? "on" : ""}`}>I0.{i}</span>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="ro">outputs</span>
                  <div className="io-row">
                    {s.plc.outputs.map((v, i) => (
                      <span key={i} className={`io-led out ${v ? "on" : ""}`}>Q0.{i}</span>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span className="ro">scan</span>
                  <div className="ro mono">{s.plc.scan} cycles · {s.program.length} rung(s)</div>
                </div>
                <div className="row-btns">
                  <button className="tbtn" onClick={() => dispatch({ t: "ladder" })}>
                    ▤ Open program editor
                  </button>
                </div>
              </>
            )}

            {/* ---- sensor process values ---- */}
            {sel.type === "proximity-sensor" && (
              <div className="field">
                <label htmlFor="tgt">Target present</label>
                <select
                  id="tgt"
                  value={sel.params.target ?? 0}
                  onChange={(e) =>
                    dispatch({ t: "param", id: sel.id, key: "target", value: Number(e.target.value) })
                  }
                >
                  <option value={0}>No target (output open)</option>
                  <option value={1}>Target in range (output closes)</option>
                </select>
              </div>
            )}
            {sel.type === "photo-sensor" && (
              <div className="field">
                <label htmlFor="blk">Beam</label>
                <select
                  id="blk"
                  value={sel.params.blocked ?? 0}
                  onChange={(e) =>
                    dispatch({ t: "param", id: sel.id, key: "blocked", value: Number(e.target.value) })
                  }
                >
                  <option value={0}>Free (output open)</option>
                  <option value={1}>Blocked (output closes)</option>
                </select>
              </div>
            )}
            {sel.type === "pressure-sensor" && (
              <>
                <div className="field">
                  <label htmlFor="pv">Process value (bar)</label>
                  <input
                    id="pv"
                    type="range"
                    min={0}
                    max={25}
                    step={0.5}
                    value={sel.params.pv ?? 0}
                    onChange={(e) =>
                      dispatch({ t: "param", id: sel.id, key: "pv", value: Number(e.target.value) })
                    }
                  />
                  <span className="ro mono">{(sel.params.pv ?? 0).toFixed(1)} bar / SP {(sel.params.sp ?? 10).toFixed(1)}</span>
                </div>
                <div className="field">
                  <label htmlFor="sp">Setpoint (bar)</label>
                  <input
                    id="sp"
                    type="number"
                    min={0}
                    max={25}
                    step={0.5}
                    value={sel.params.sp ?? 10}
                    onChange={(e) =>
                      dispatch({ t: "param", id: sel.id, key: "sp", value: Number(e.target.value) })
                    }
                  />
                </div>
              </>
            )}
            {sel.type === "level-sensor" && (
              <>
                <div className="field">
                  <label htmlFor="lv">Level (%)</label>
                  <input
                    id="lv"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sel.params.lv ?? 0}
                    onChange={(e) =>
                      dispatch({ t: "param", id: sel.id, key: "lv", value: Number(e.target.value) })
                    }
                  />
                  <span className="ro mono">{(sel.params.lv ?? 0).toFixed(0)} % / SP {(sel.params.sp ?? 5).toFixed(0)} %</span>
                </div>
                <div className="field">
                  <label htmlFor="lsp">Switch point (%)</label>
                  <input
                    id="lsp"
                    type="number"
                    min={0}
                    max={100}
                    value={sel.params.sp ?? 5}
                    onChange={(e) =>
                      dispatch({ t: "param", id: sel.id, key: "sp", value: Number(e.target.value) })
                    }
                  />
                </div>
              </>
            )}

            {sel.type === "pt100" && (
              <div className="field">
                <label htmlFor="tc">Temperature (°C)</label>
                <input
                  id="tc"
                  type="range"
                  min={0}
                  max={200}
                  step={1}
                  value={sel.params.t ?? 20}
                  onChange={(e) =>
                    dispatch({ t: "param", id: sel.id, key: "t", value: Number(e.target.value) })
                  }
                />
                <span className="ro mono">
                  {(sel.params.t ?? 20).toFixed(0)} °C ·{" "}
                  {(100 * (1 + 0.00385 * (sel.params.t ?? 20))).toFixed(1)} Ω
                </span>
              </div>
            )}

            {/* ---- coil / contact group linking ---- */}
            {["contactor", "contactor-rev", "relay", "aux-no", "aux-nc", "changeover"].includes(
              sel.type,
            ) && (
              <div className="field">
                <label htmlFor="grp">Linked tag group</label>
                <select
                  id="grp"
                  value={sel.params.grp ?? 1}
                  onChange={(e) =>
                    dispatch({ t: "param", id: sel.id, key: "grp", value: Number(e.target.value) })
                  }
                >
                  <option value={0}>Not linked</option>
                  <option value={1}>K1 (KM1 ↔ 13/14 contacts)</option>
                  <option value={2}>K2</option>
                  <option value={3}>K3</option>
                </select>
                <p className="hint-text">
                  Coils energise when &gt; 12 V appears across them; linked NO
                  contacts close and NC contacts open.
                </p>
              </div>
            )}
          </>
        )}
        {wireSel && (
          <>
            <div className="field">
              <span className="ro">wire</span>
              <div className="ro">
                {wireSel.a.dev}:{wireSel.a.term === 0 ? "1" : "2"} →{" "}
                {wireSel.b.dev}:{wireSel.b.term === 0 ? "1" : "2"}
              </div>
            </div>
            <p className="hint-text">Press Delete to remove this wire.</p>
          </>
        )}
      </div>
    </aside>
  );
}

export function StartOverlay() {
  const dispatch = useDispatchApp();
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Start">
      <div className="start-card">
        <h1>panel-sim</h1>
        <p>Industrial panel simulator for Windows — every part is free</p>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => dispatch({ t: "start", example: 0 })}
          >
            New blank project
          </button>
          <button
            className="btn secondary"
            onClick={() => dispatch({ t: "start", example: 1 })}
          >
            Load example — start / stop a pilot light
          </button>
          <button
            className="btn secondary"
            onClick={() => dispatch({ t: "start", example: 2 })}
          >
            PLC demo — sensor → ladder → contactor → motor
          </button>
          <button
            className="btn secondary"
            onClick={() => dispatch({ t: "start", example: 3 })}
          >
            Template — timed sequence (T0,3 s)
          </button>
          <button
            className="btn secondary"
            onClick={() => dispatch({ t: "start", example: 4 })}
          >
            Template — flasher (~1 Hz beacon)
          </button>
        </div>
        <p className="note">
          Offline · no account · no paid tiers — real voltage & current readings.
        </p>
      </div>
    </div>
  );
}
