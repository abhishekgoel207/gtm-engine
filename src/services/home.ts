import { list } from "@/lib/store";
import { getBuyerRows } from "./buyers";
import { getIcpForProduct } from "./icp";
import { getCurrentProduct } from "./product";
import { countPendingMessages } from "./pending";

export function getHome() {
  const product = getCurrentProduct();
  const icp = product && getIcpForProduct(product.id);
  const rows = getBuyerRows().filter((r) => !r.lead.hidden);
  const pending = countPendingMessages();
  const steps = [
    { label: "Describe product", href: "/start", done: Boolean(product && icp) },
    { label: "Approve ideal customer", href: icp ? "/icp" : "/start", done: icp?.status === "approved" },
    { label: "Find buyers", href: "/buyers", done: rows.length > 0 },
    { label: "Approve messages", href: "/approve", done: pending === 0 && list("messages").length > 0 },
    { label: "Track pipeline", href: "/pipeline", done: false },
  ];
  const top = [...new Map(rows.filter((r) => r.lead.score.tier === "A" && r.lead.stage !== "lost" && r.lead.stage !== "won").map((r) => [r.person.id, r])).values()]
    .sort((a, b) => b.lead.score.total - a.lead.score.total).slice(0, 3);
  return { steps, next: steps.find((s) => !s.done) ?? steps[4], pending, top, empty: !product && rows.length === 0 };
}
