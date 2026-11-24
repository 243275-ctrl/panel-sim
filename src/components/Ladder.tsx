// Ladder (IL-less) program editor — rungs of OR-branches + series tail + coil.
// Tags come from the PLC image; live highlights follow the current scan.
import { useDispatchApp, useApp } from "../state/store";
import {
  INPUTS,
  MEM,
  OUTPUTS,
  tagState,
  type LContact,
} from "../solver/ladder";

function TagSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (tag: string) => void;
}) {
  const opt = (list: string[]) =>
    list.map((t) => (
      <option key={t} value={t}>
        {t}
      </option>
    ));
  return (
    <select className="tag-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <optgroup label="Inputs">
        {opt(INPUTS)}
      </optgroup>
      <optgroup label="Outputs">
        {opt(OUTPUTS)}
      </optgroup>
      <optgroup label="Markers">
        {opt(MEM)}
      </optgroup>
    </select>
  );
}

function ContactChip({
  c,
  live,
  onTag,
  onNc,
  onDelete,
}: {
  c: LContact;
  live: boolean;
  onTag: (tag: string) => void;
  onNc: () => void;
  onDelete: () => void;
}) {
  return (
    <span className={`contact ${live ? "on" : ""}`}>
      <button className={`c-kind ${c.nc ? "nc" : ""}`} onClick={onNc} title="Toggle NO / NC">
        {c.nc ? "//" : "--"}
      </button>
      <TagSelect value={c.tag} onChange={onTag} />
      <button className="c-x" onClick={onDelete} title="Delete contact">
        ×
      </button>
    </span>
  );
}

export function LadderEditor() {
  const s = useApp();
  const dispatch = useDispatchApp();

  const state = (c: LContact) => {
    const raw = tagState(c.tag, s.plc);
    return c.nc ? !raw : raw;
  };
  const rungOn = (r: { branches: { contacts: LContact[] }[]; tail?: LContact[] }) =>
    r.branches.some((b) => b.contacts.every(state)) &&
    (r.tail ?? []).every(state);

  return (
    <div className="ladder-overlay" role="dialog" aria-label="Ladder program">
      <div className="ladder-card">
        <header className="ladder-head">
          <strong>▤ Ladder program</strong>
          <span className="ladder-sub">
            {s.projectName} · scan {s.plc.scan} ·{" "}
            {s.running ? "RUN" : "STOP"}
          </span>
          <span className="spacer" />
          <button
            className={`tbtn ${s.running ? "" : "on"}`}
            onClick={() => dispatch({ t: "ladder" })}
            title="Close editor"
          >
            × Close
          </button>
        </header>

        <div className="ladder-scroll">
          {!s.program.length && (
            <p className="hint-text">
              No rungs yet. The PLC reads I0.0–I0.3 from its input terminals,
              evaluates every rung top-to-bottom, then drives Q0.0–Q0.3.
              Add your first rung below.
            </p>
          )}
          {s.program.map((r, ri) => {
            const on = rungOn(r);
            return (
              <div className={`rung ${on && s.running ? "live" : ""}`} key={r.id}>
                <div className="rung-head">
                  <span className="rung-no">R{ri + 1}</span>
                  <input
                    className="rung-comment"
                    placeholder="comment…"
                    value={r.comment}
                    onChange={(e) =>
                      dispatch({ t: "pgSetComment", id: r.id, text: e.target.value })
                    }
                  />
                  <button
                    className="c-x"
                    title="Delete rung"
                    onClick={() => dispatch({ t: "pgDelRung", id: r.id })}
                  >
                    ×
                  </button>
                </div>

                <div className="rung-grid">
                  <div className="rail">
                    {r.branches.map((br, bi) => (
                      <div className={`branch ${br.contacts.every(state) && br.contacts.length ? "on" : ""}`} key={bi}>
                        {br.contacts.length === 0 && <span className="wire-line" />}
                        {br.contacts.map((c, ci) => (
                          <span className="cell" key={ci}>
                            {ci > 0 && <span className="wire-line" />}
                            <ContactChip
                              c={c}
                              live={state(c)}
                              onTag={(tag) =>
                                dispatch({ t: "pgSetContact", id: r.id, branch: bi, idx: ci, tag })
                              }
                              onNc={() =>
                                dispatch({
                                  t: "pgSetContact",
                                  id: r.id,
                                  branch: bi,
                                  idx: ci,
                                  nc: !c.nc,
                                })
                              }
                              onDelete={() =>
                                dispatch({ t: "pgDelContact", id: r.id, branch: bi, idx: ci })
                              }
                            />
                          </span>
                        ))}
                        <span className="wire-line short" />
                        <button
                          className="mini"
                          title="Add contact in this branch"
                          onClick={() => dispatch({ t: "pgAddContact", id: r.id, branch: bi })}
                        >
                          +C
                        </button>
                        {r.branches.length > 1 && (
                          <button
                            className="mini"
                            title="Remove branch"
                            onClick={() => dispatch({ t: "pgDelBranch", id: r.id, idx: bi })}
                          >
                            −B
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="mini add-branch"
                      onClick={() => dispatch({ t: "pgAddBranch", id: r.id })}
                    >
                      + parallel branch
                    </button>
                  </div>

                  <div className="tail-row">
                    <span className="wire-line short" />
                    <span className="tail-label">series:</span>
                    {(r.tail ?? []).map((c, ci) => (
                      <ContactChip
                        key={ci}
                        c={c}
                        live={state(c)}
                        onTag={(tag) =>
                          dispatch({ t: "pgSetContact", id: r.id, branch: -1, idx: ci, tag })
                        }
                        onNc={() =>
                          dispatch({
                            t: "pgSetContact",
                            id: r.id,
                            branch: -1,
                            idx: ci,
                            nc: !c.nc,
                          })
                        }
                        onDelete={() =>
                          dispatch({ t: "pgDelContact", id: r.id, branch: -1, idx: ci })
                        }
                      />
                    ))}
                    <button
                      className="mini"
                      title="Add series contact (stop conditions) after the parallel group"
                      onClick={() => dispatch({ t: "pgAddContact", id: r.id, branch: -1 })}
                    >
                      +C
                    </button>
                    <span className="wire-line" />
                    <span className={`coil ${on && s.running ? "on" : ""}`}>
                      (
                      <TagSelect
                        value={r.coil}
                        onChange={(tag) => dispatch({ t: "pgSetCoil", id: r.id, tag })}
                      />
                      )
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="btn secondary add-rung" onClick={() => dispatch({ t: "pgAddRung" })}>
            + Add rung
          </button>

          <p className="hint-text">
            Tips: inputs follow the wired field circuit (I0.x LED on the PLC);
            Q0.x sources 24 V to whatever you wire to it (coils of KM1…).
            Outputs drop when the simulation stops.
          </p>
        </div>
      </div>
    </div>
  );
}
