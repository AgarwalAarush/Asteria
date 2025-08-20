// layout.ts — simple, stable, incremental DAG layout for React Flow
export type RFNode = { id: string; width?: number; height?: number; position: { x: number; y: number }; data?: any };
export type RFEdge = { id: string; source: string; target: string; data?: any };

type Graph = { nodes: Map<string, RFNode>; edges: RFEdge[] };

const COL_GAP = 160;              // horizontal gap between columns
const ROW_GAP = 40;               // vertical gap between nodes
const DEFAULT_W = 320;            // fallback width if node size unknown
const DEFAULT_H = 120;            // fallback height

export function layoutDAGAll(nodesIn: RFNode[], edges: RFEdge[]) {
  const g: Graph = { nodes: new Map(nodesIn.map(n => [n.id, { ...n }])), edges };
  const parents = indexParents(edges);
  const children = indexChildren(edges);

  // 1) Topo order + ranks (longest-path layering)
  const order = topoOrder([...g.nodes.keys()], parents);
  const rank = new Map<string, number>();
  for (const v of order) {
    const ps = parents.get(v) ?? [];
    rank.set(v, ps.length ? Math.max(...ps.map(p => (rank.get(p) ?? 0) + 1)) : 0);
  }

  // 2) Columns by rank
  const columns = new Map<number, string[]>();
  for (const [id, r] of rank) {
    if (!columns.has(r)) columns.set(r, []);
    columns.get(r)!.push(id);
  }

  // 3) Order within columns (barycenter from previous column)
  const colIndices = new Map<string, number>();
  const sortedCols = [...columns.keys()].sort((a, b) => a - b);
  for (const c of sortedCols) {
    const prev = columns.get(c - 1) ?? [];
    const prevIndex = new Map(prev.map((id, i) => [id, i]));
    const nodes = columns.get(c)!;

    const scored = nodes.map(id => {
      const ps = parents.get(id) ?? [];
      const scores = ps.map(p => prevIndex.get(p)).filter((x) => x !== undefined) as number[];
      const bc = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : Number.POSITIVE_INFINITY;
      // tie-breaker by previous y to reduce jitter
      const prevY = g.nodes.get(id)?.position.y ?? 0;
      return { id, bc, prevY };
    });

    scored.sort((a, b) => (a.bc - b.bc) || (a.prevY - b.prevY));
    scored.forEach((s, i) => colIndices.set(s.id, i));
    columns.set(c, scored.map(s => s.id));
  }

  // 4) Assign coordinates
  const colX = new Map<number, number>();
  sortedCols.forEach(c => {
    const maxW = Math.max(...(columns.get(c) ?? []).map(id => g.nodes.get(id)?.width ?? DEFAULT_W), DEFAULT_W);
    const left = (c === 0) ? 0 : (colX.get(c - 1)! + (Math.max(...(columns.get(c - 1) ?? []).map(id => g.nodes.get(id)?.width ?? DEFAULT_W), DEFAULT_W)) + COL_GAP);
    colX.set(c, left);
  });

  for (const c of sortedCols) {
    const ids = columns.get(c)!;
    let y = 0;
    ids.forEach((id, i) => {
      const node = g.nodes.get(id)!;
      const h = node.height ?? DEFAULT_H;
      node.position = { x: colX.get(c)!, y };
      y += h + ROW_GAP;
    });
  }

  return [...g.nodes.values()];
}

// Incremental: recompute only columns touched by the changed node (its rank and to the right)
export function layoutDAGIncremental(nodes: RFNode[], edges: RFEdge[], changedId: string) {
  // For simplicity, call full layout if graph is small; else limit to affected ranks.
  if (nodes.length <= 300) return layoutDAGAll(nodes, edges);

  // Collect affected: ranks(changed and descendants)
  const parents = indexParents(edges);
  const children = indexChildren(edges);
  const order = topoOrder(nodes.map(n => n.id), parents);
  const rank = new Map<string, number>();
  for (const v of order) {
    const ps = parents.get(v) ?? [];
    rank.set(v, ps.length ? Math.max(...ps.map(p => (rank.get(p) ?? 0) + 1)) : 0);
  }
  const start = rank.get(changedId) ?? 0;
  const affected = new Set<string>();
  const q = [changedId];
  while (q.length) { const v = q.shift()!; if (affected.has(v)) continue; affected.add(v); (children.get(v) ?? []).forEach(n => q.push(n)); }

  // Freeze non-affected; run layout on affected + all nodes in columns ≥ start (keeps global spacing consistent)
  const minColumn = start;
  const movable = nodes.filter(n => (rank.get(n.id) ?? 0) >= minColumn);
  const fixed = nodes.filter(n => (rank.get(n.id) ?? 0) < minColumn);

  const laid = layoutDAGAll(movable, edges.filter(e => rank.get(e.source)! >= minColumn && rank.get(e.target)! >= minColumn));
  const laidMap = new Map(laid.map(n => [n.id, n]));

  return nodes.map(n => laidMap.get(n.id) ?? n); // merge back
}

// helpers
function indexParents(edges: RFEdge[]) {
  const m = new Map<string, string[]>();
  for (const e of edges) { if (!m.has(e.target)) m.set(e.target, []); m.get(e.target)!.push(e.source); }
  return m;
}
function indexChildren(edges: RFEdge[]) {
  const m = new Map<string, string[]>();
  for (const e of edges) { if (!m.has(e.source)) m.set(e.source, []); m.get(e.source)!.push(e.target); }
  return m;
}
function topoOrder(ids: string[], parents: Map<string, string[]>) {
  const indeg = new Map<string, number>(ids.map(id => [id, 0]));
  parents.forEach((ps, v) => indeg.set(v, (indeg.get(v) ?? 0) + ps.length));
  const q = ids.filter(id => (indeg.get(id) ?? 0) === 0);
  const out: string[] = [];
  while (q.length) {
    const u = q.shift()!;
    out.push(u);
    // simulate edges u->v by scanning parents map
    parents.forEach((ps, v) => {
      if (ps.includes(u)) {
        indeg.set(v, (indeg.get(v) ?? 0) - 1);
        if (indeg.get(v) === 0) q.push(v);
      }
    });
  }
  return out.length ? out : ids; // if cycles, fallback to input order
}