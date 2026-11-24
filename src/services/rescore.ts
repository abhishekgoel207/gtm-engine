import { getGraphFindings } from "./graphReasoning";
import { rescoreAll } from "./scoring";

/** Rescores every lead, with bonuses for warm introductions and winnable competitors. */
export function rescore(): number {
  const { warmIntros, displacement } = getGraphFindings();
  return rescoreAll((lead) => ({
    warmIntro: warmIntros.find((w) => w.personId === lead.personId)?.sentence,
    displacement: displacement.find((d) => d.companyId === lead.companyId)?.sentence,
  }));
}
