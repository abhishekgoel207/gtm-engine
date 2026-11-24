import { handle } from "@/lib/http";
import { enrichLead } from "@/services/enrichment";

export const POST = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => enrichLead((await params).id));
