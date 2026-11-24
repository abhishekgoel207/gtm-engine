import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { sendMessage } from "@/services/send";

const Body = z.object({ repSentIt: z.boolean().optional() }).strict();
export const POST = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => sendMessage((await params).id, await readBody(request, Body)));
