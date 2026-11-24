import { handle, readBody } from "@/lib/http";
import { DecisionSchema, decideExpansion } from "@/services/expansion";

export const PATCH = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => decideExpansion((await params).id, await readBody(request, DecisionSchema)));
