import { list } from "@/lib/store";
import type { GraphStore } from "@/providers/graph";
import { createMemoryGraph } from "@/providers/graph/memory";
import { getCurrentProduct } from "./product";

/** Builds the graph from the stored records. */
export function buildGraph(): GraphStore {
  const graph = createMemoryGraph();
  const product = getCurrentProduct();
  if (product) graph.upsertNode({ id: product.id, label: "Product", props: { name: product.name } });
  const companyByName = new Map<string, string>();
  for (const c of list("companies")) {
    graph.upsertNode({ id: c.id, label: "Company", props: { name: c.name, industry: c.industry, sources: c.sources } });
    companyByName.set(c.name.toLowerCase(), c.id);
  }
  for (const p of list("people")) {
    graph.upsertNode({ id: p.id, label: "Person", props: { name: p.name, title: p.title, education: p.education, sources: p.sources } });
    if (p.companyId && graph.getNode(p.companyId)) graph.upsertEdge({ from: p.id, type: "works_at", to: p.companyId, props: {} });
    for (const employer of p.pastEmployers) {
      let id = companyByName.get(employer.toLowerCase());
      if (!id) {
        id = `stub_${employer.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
        companyByName.set(employer.toLowerCase(), id);
        graph.upsertNode({ id, label: "Company", props: { name: employer, stub: true } });
      }
      graph.upsertEdge({ from: p.id, type: "previously_employed_at", to: id, props: {} });
    }
  }
  for (const c of list("competitors")) {
    graph.upsertNode({ id: c.id, label: "Competitor", props: { name: c.name, sources: c.sources } });
    if (product) graph.upsertEdge({ from: c.id, type: "competes_with", to: product.id, props: {} });
  }
  for (const s of list("signals")) {
    graph.upsertNode({ id: s.id, label: "Signal", props: { type: s.type, summary: s.summary, date: s.date, competitorId: s.competitorId, source: s.source } });
    if (graph.getNode(s.companyId)) graph.upsertEdge({ from: s.id, type: "matched_to", to: s.companyId, props: {} });
  }
  const leads = list("leads");
  if (product) {
    for (const l of leads.filter((x) => !x.hidden)) graph.upsertEdge({ from: l.companyId, type: "matched_to", to: product.id, props: {} });
    const person = new Map(leads.map((l) => [l.id, l.personId]));
    for (const m of list("messages")) {
      const from = person.get(m.leadId);
      if (!from || !m.sentAt) continue;
      graph.upsertEdge({ from, type: "contacted_via", to: product.id, props: { channel: m.channel, messageId: m.id, ts: m.sentAt } });
      if (m.status === "replied") graph.upsertEdge({ from, type: "replied_to", to: product.id, props: { messageId: m.id } });
    }
  }
  return graph;
}
