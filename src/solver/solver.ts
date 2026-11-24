// panel-sim circuit solver — M0: single-loop DC through passable edges.
// Pure module, no DOM, deterministic. Full nodal analysis arrives in M2.

export interface SolDevice {
  id: string;
  type: "source" | "button" | "lamp";
  name: string;
  params: Record<string, number>;
}

export interface SolWire {
  id: string;
  a: { dev: string; term: 0 | 1 };
  b: { dev: string; term: 0 | 1 };
}

export interface SimResult {
  /** lamp ids that are lit */
  lit: Set<string>;
  /** wire ids carrying current (closed loop) */
  live: Set<string>;
  /** loop current in amps (0 when open) */
  current: number;
  /** human-readable problems; empty = healthy */
  faults: string[];
  /** true when source's two terminals are joined through closed devices */
  closed: boolean;
}

const termKey = (dev: string, term: 0 | 1) => `${dev}:${term}`;

class Union {
  p = new Map<string, string>();
  find(x: string): string {
    let r = x;
    while (this.p.get(r) !== undefined && this.p.get(r) !== r)
      r = this.p.get(r)!;
    if (!this.p.has(x)) this.p.set(x, r === undefined ? x : r);
    if (this.p.get(x) !== x) this.p.set(x, this.find(r));
    return this.p.get(x) ?? x;
  }
  union(a: string, b: string) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
  same(a: string, b: string) {
    return this.find(a) === this.find(b);
  }
}

export function simulate(
  devices: SolDevice[],
  wires: SolWire[],
  pressed: string[],
  running: boolean,
): SimResult {
  const faults: string[] = [];
  const lit = new Set<string>();
  const live = new Set<string>();

  // dangling terminals
  const touched = new Set<string>();
  for (const w of wires) {
    touched.add(termKey(w.a.dev, w.a.term));
    touched.add(termKey(w.b.dev, w.b.term));
  }
  for (const d of devices)
    for (const t of [0, 1] as const)
      if (!touched.has(termKey(d.id, t)))
        faults.push(`${d.name}: terminal ${t === 0 ? "1" : "2"} not connected`);

  const sources = devices.filter((d) => d.type === "source");
  if (devices.length > 0 && sources.length === 0)
    faults.push("No power source in the circuit");
  if (sources.length > 1)
    faults.push("Multiple sources are not supported yet (M2)");

  const uf = new Union();
  for (const d of devices) {
    uf.find(termKey(d.id, 0));
    uf.find(termKey(d.id, 1));
  }
  for (const w of wires) uf.union(termKey(w.a.dev, w.a.term), termKey(w.b.dev, w.b.term));

  // A source does NOT bridge its own terminals: the loop must return
  // through the rest of the circuit, otherwise every source reads "closed".
  const passable = (d: SolDevice) =>
    d.type === "lamp" ||
    (d.type === "button" && running && pressed.includes(d.id));
  for (const d of devices)
    if (passable(d)) uf.union(termKey(d.id, 0), termKey(d.id, 1));

  let closed = false;
  let current = 0;
  const source = sources[0];
  if (source && running) {
    closed = uf.same(termKey(source.id, 0), termKey(source.id, 1));
    if (closed) {
      const lamps = devices.filter(
        (d) => d.type === "lamp" && uf.same(termKey(d.id, 0), termKey(source.id, 0)),
      );
      const totalR = lamps.reduce((sum, l) => sum + (l.params.r || 100), 0);
      if (lamps.length === 0 || totalR <= 0) {
        faults.push("Short circuit — no load in the loop");
        closed = false;
      } else {
        current = (source.params.v || 24) / totalR;
        for (const l of lamps) lit.add(l.id);
        const loopRoot = uf.find(termKey(source.id, 0));
        for (const w of wires)
          if (
            uf.find(termKey(w.a.dev, w.a.term)) === loopRoot &&
            uf.find(termKey(w.b.dev, w.b.term)) === loopRoot
          )
            live.add(w.id);
      }
    }
  }
  return { lit, live, current, faults, closed };
}
