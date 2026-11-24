import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { decide } from "@/services/agents/room";

const Body = z.object({ approve: z.boolean() }).strict();
export const POST = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => decide((await params).id, (await readBody(request, Body)).approve));
