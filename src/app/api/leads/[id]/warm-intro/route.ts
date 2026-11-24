import { AppError, handle } from "@/lib/http";
import { REP_ID } from "@/lib/rep";
import { get } from "@/lib/store";
import { warmIntros } from "@/services/graphReasoning";

export const POST = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    const lead = get("leads", (await params).id);
    if (!lead) throw new AppError(404, "That lead no longer exists.");
    return warmIntros(REP_ID, lead.personId, lead.id);
  });
