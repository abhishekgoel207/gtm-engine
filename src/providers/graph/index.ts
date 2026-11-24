export type NodeLabel = "Company" | "Person" | "Product" | "Competitor" | "Signal";
export type EdgeType = "works_at" | "previously_employed_at" | "competes_with" | "matched_to" | "contacted_via" | "replied_to";

export interface GraphNode { id: string; label: NodeLabel; props: Record<string, unknown> }
export interface GraphEdge { from: string; type: EdgeType; to: string; props: Record<string, unknown> }

export interface GraphStore {
  upsertNode(node: GraphNode): void;
  upsertEdge(edge: GraphEdge): void;
  getNode(id: string): GraphNode | undefined;
  neighbors(id: string, type?: EdgeType, dir?: "in" | "out"): { edge: GraphEdge; node: GraphNode }[];
  /** Simple paths, up to maxHops edges, ignoring direction. */
  paths(fromId: string, toId: string, maxHops: number): GraphNode[][];
  edges(): GraphEdge[];
  stats(): { nodes: number; edges: number };
}

export const EDGE_RULES: Record<EdgeType, [NodeLabel, NodeLabel][]> = {
  works_at: [["Person", "Company"]],
  previously_employed_at: [["Person", "Company"]],
  competes_with: [["Competitor", "Product"]],
  matched_to: [["Company", "Product"], ["Signal", "Company"]],
  contacted_via: [["Person", "Product"]],
  replied_to: [["Person", "Product"]],
};
export const NODE_LABELS: NodeLabel[] = ["Company", "Person", "Product", "Competitor", "Signal"];
