import { handle, readBody } from "@/lib/http";
import { MoveSchema, moveLead } from "@/services/pipeline";

export const POST = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => moveLead((await params).id, (await readBody(request, MoveSchema)).stage));
