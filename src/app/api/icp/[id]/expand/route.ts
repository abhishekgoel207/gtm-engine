import { handle } from "@/lib/http";
import { suggestExpansions } from "@/services/expansion";

export const POST = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => suggestExpansions((await params).id));
