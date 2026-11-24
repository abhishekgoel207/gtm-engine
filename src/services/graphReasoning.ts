import { emit } from "@/lib/agentLog";
import { daysSince } from "@/lib/dates";
import { REP_ID } from "@/lib/rep";
import type { GraphNode, GraphStore } from "@/providers/graph";
import { getBilling } from "@/providers/registry";
import { buildGraph } from "./graphSync";
import { getCurrentProduct } from "./product";

const name = (n?: GraphNode) => String(n?.props.name ?? "");
const EVALUATION_DAYS = 60;
const MAX_HOPS = 3;

/** Employment edges only: shared customers or products are not an introduction. */
function employmentPaths(graph: GraphStore, from: string, to: string, maxHops: number): string[][] {
  const found: string[][] = [];
  const walk = (path: string[]) => {
    const last = path[path.length - 1];
    if (last === to && path.length > 1) return void found.push(path);
    if (path.length > maxHops) return;
    for (const { edge, node } of graph.neighbors(last)) {
      if ((edge.type === "works_at" || edge.type === "previously_employed_at") && !path.includes(node.id)) walk([...path, node.id]);
    }
  };
  walk([from]);
  return found;
}

export interface WarmIntro { personId: string; nodes: string[]; sentence: string }

export function findWarmIntros(graph: GraphStore, repId: string, targetId: string): WarmIntro[] {
  const rep = graph.getNode(repId);
  const target = graph.getNode(targetId);
  if (!rep || !target) return [];
  const company = graph.neighbors(targetId, "works_at", "out")[0]?.node;
  const at = company ? ` at ${name(company)}` : "";
  const intros = employmentPaths(graph, repId, targetId, MAX_HOPS).map((nodes) => ({
    personId: targetId, nodes,
    sentence: `You and ${name(target)} both worked at ${name(graph.getNode(nodes[1]))}. ${name(target)} is now ${target.props.title}${at}.`,
  }));
  const schools = (rep.props.education as string[]).filter((s) => (target.props.education as string[]).includes(s));
  return [...intros, ...schools.map((school) => ({
    personId: targetId, nodes: [repId, targetId],
    sentence: `You and ${name(target)} both went to ${school}. ${name(target)} is now ${target.props.title}${at}.`,
  }))];
}

export function findActiveEvaluations(graph: GraphStore, productId: string) {
  return graph.neighbors(productId, "matched_to", "in").flatMap(({ node: company }) =>
    graph.neighbors(company.id, "matched_to", "in").flatMap(({ node: signal }) =>
      signal.props.type === "job_posting" && daysSince(String(signal.props.date)) <= EVALUATION_DAYS
        ? [{ companyId: company.id, signalId: signal.id, sentence: `Likely evaluating now: ${signal.props.summary}.` }]
        : [],
    ),
  );
}

export function findDisplacementTargets(graph: GraphStore, productId: string) {
  const rivals = new Map(graph.neighbors(productId, "competes_with", "in").map(({ node }) => [node.id, node]));
  return graph.neighbors(productId, "matched_to", "in").flatMap(({ node: company }) =>
    graph.neighbors(company.id, "matched_to", "in").flatMap(({ node: signal }) => {
      const rival = rivals.get(String(signal.props.competitorId));
      return rival && ["renewal_window", "churn_risk"].includes(String(signal.props.type))
        ? [{ companyId: company.id, signalId: signal.id, sentence: `${name(company)} could leave ${name(rival)}: ${signal.props.summary}.` }]
        : [];
    }),
  );
}

export function getGraphFindings() {
  const graph = buildGraph();
  const product = getCurrentProduct();
  const targets = product
    ? new Set(graph.neighbors(product.id, "matched_to", "in").flatMap(({ node }) => graph.neighbors(node.id, "works_at", "in").map((n) => n.node.id)))
    : new Set<string>();
  return {
    graph,
    warmIntros: [...targets].flatMap((id) => findWarmIntros(graph, REP_ID, id)),
    evaluations: product ? findActiveEvaluations(graph, product.id) : [],
    displacement: product ? findDisplacementTargets(graph, product.id) : [],
  };
}

async function metered<T>(queryName: string, text: string, run: () => T, leadId?: string): Promise<T> {
  emit({ agent: "Builder", kind: "graph", text });
  const result = run();
  await getBilling().meter("graph_queries_evaluated", 1, { queryName, leadId });
  return result;
}

// The three named queries. Each call logs its traversal and meters once.
export const warmIntros = (repId: string, targetId: string, leadId?: string) =>
  metered("warmIntros", `Looking for people or schools you share with ${targetId}, up to ${MAX_HOPS} hops`, () => findWarmIntros(buildGraph(), repId, targetId), leadId);
export const activeEvaluations = () =>
  metered("activeEvaluations", "Following job posts from the last 60 days to matched companies", () => getGraphFindings().evaluations);
export const displacementTargets = () =>
  metered("displacementTargets", "Following renewals that name a competitor", () => getGraphFindings().displacement);
