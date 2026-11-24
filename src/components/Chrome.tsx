import { useDispatchApp, useApp, type DeviceType } from "../state/store";

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
  return (
    <div className="toolbar" role="toolbar" aria-label="Tools and simulation">
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
      <span className="hint">
        {s.tool === "place"
          ? "Click the canvas to place — Esc cancels"
          : s.tool === "wire"
            ? "Click two terminals — Esc cancels"
            : "W wire · V select · Del remove · hold a button while running"}
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
      <span className="mono">
        {s.running ? "sim clock · dt 1 ms" : "—"}
      </span>
    </footer>
  );
}

const LIBRARY: { type: DeviceType; label: string; meta: string; glyph: string }[] = [
  { type: "source", label: "DC source", meta: "24 V control supply", glyph: "▮▮" },
  { type: "button", label: "Push button, NO", meta: "momentary contact", glyph: "⬤" },
  { type: "lamp", label: "Pilot light", meta: "24 V indicator", glyph: "◉" },
];

export function LibraryPanel() {
  const s = useApp();
  const dispatch = useDispatchApp();
  return (
    <aside className="panel" aria-label="Device library">
      <h2>Library</h2>
      <div className="pad">
        <input
          className="search"
          type="search"
          placeholder="Search devices…"
          aria-label="Search devices"
          disabled
          title="Search arrives with the full library (M1)"
        />
        {LIBRARY.map((it) => (
          <button
            key={it.type}
            className={`tile ${s.tool === "place" && s.placeType === it.type ? "on" : ""}`}
            onClick={() => dispatch({ t: "placeType", dt: it.type })}
          >
            <span className="glyph" aria-hidden>
              {it.glyph}
            </span>
            <span>
              {it.label}
              <span className="meta">{it.meta}</span>
            </span>
          </button>
        ))}
        <p className="hint-text">
          M0 ships 3 device types — the full library (45+ with our own pictorial
          art) lands in M1.
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
            {sel.type === "lamp" && (
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
        <p>Industrial panel simulator for Windows — start a project</p>
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
          Free · offline · no account. M0 slice of the replica build.
        </p>
      </div>
    </div>
  );
}
