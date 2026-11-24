import { handle, readBody } from "@/lib/http";
import { actOnMessage, MessageActionSchema } from "@/services/outreach";

export const PATCH = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => actOnMessage((await params).id, await readBody(request, MessageActionSchema)));
