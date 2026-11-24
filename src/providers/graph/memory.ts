import { EDGE_RULES, type GraphEdge, type GraphNode, type GraphStore, NODE_LABELS } from "./index";

export function createMemoryGraph(): GraphStore {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const need = (id: string) => {
    const node = nodes.get(id);
    if (!node) throw new Error(`Graph: node ${id} does not exist`);
    return node;
  };
  const store: GraphStore = {
    upsertNode(node) {
      if (!NODE_LABELS.includes(node.label)) throw new Error(`Graph: unknown label ${node.label}`);
      nodes.set(node.id, node);
    },
    upsertEdge(edge) {
      const rule = EDGE_RULES[edge.type];
      if (!rule) throw new Error(`Graph: unknown edge ${edge.type}`);
      const [from, to] = [need(edge.from).label, need(edge.to).label];
      if (!rule.some(([f, t]) => f === from && t === to)) throw new Error(`Graph: ${from} ${edge.type} ${to} is not allowed`);
      edges.set(`${edge.from}|${edge.type}|${edge.to}|${edge.props.messageId ?? ""}`, edge);
    },
    getNode: (id) => nodes.get(id),
    neighbors(id, type, dir) {
      return [...edges.values()].flatMap((edge) => {
        if (type && edge.type !== type) return [];
        if (edge.from === id && dir !== "in") return [{ edge, node: need(edge.to) }];
        if (edge.to === id && dir !== "out") return [{ edge, node: need(edge.from) }];
        return [];
      });
    },
    paths(fromId, toId, maxHops) {
      const found: GraphNode[][] = [];
      const walk = (path: string[]) => {
        const last = path[path.length - 1];
        if (last === toId && path.length > 1) return void found.push(path.map(need));
        if (path.length > maxHops) return;
        const next = new Set(store.neighbors(last).map((n) => n.node.id));
        for (const id of next) if (!path.includes(id)) walk([...path, id]);
      };
      if (nodes.has(fromId)) walk([fromId]);
      return found;
    },
    edges: () => [...edges.values()],
    stats: () => ({ nodes: nodes.size, edges: edges.size }),
  };
  return store;
}
