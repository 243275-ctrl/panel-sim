import { useRef, useState, type ChangeEvent } from "react";
import {
  useDispatchApp,
  useApp,
  type DeviceType,
} from "../state/store";
import { CATEGORIES, LIBRARY, matches } from "../data/library";
import { parseAndValidate, serialize } from "../state/psim";

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
    const text = serialize(s.devices, s.wires, s.projectName);
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
        {s.running ? "sim clock · dt 1 ms" : "—"}
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
                    {GLYPHS[it.type]}
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
          15 of 45+ types — all free, nothing locked. Full pictorial art and
          the remaining types land as M1 completes.
        </p>
      </div>
    </aside>
  );
}

const GLYPHS: Record<DeviceType, string> = {
  source: "▮▮",
  "ac-source": "∿",
  ground: "⏚",
  button: "⬤",
  "button-nc": "◍",
  selector: "◔",
  lamp: "◉",
  resistor: "⏛",
  capacitor: "⊭",
  inductor: "⋒",
  fuse: "▭",
  breaker: "⟂",
  overload: "∿▱",
  contactor: "☰",
  motor: "Ⓜ",
};

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
            onClick={() => dispatch({ t: "start", example: false })}
          >
            New blank project
          </button>
          <button
            className="btn secondary"
            onClick={() => dispatch({ t: "start", example: true })}
          >
            Load example — start / stop a pilot light
          </button>
        </div>
        <p className="note">
          Offline · no account · no paid tiers — M1 of the replica build.
        </p>
      </div>
    </div>
  );
}
