import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { say } from "@/services/agents/room";

const Body = z.object({ text: z.string().trim().min(1).max(2_000) }).strict();
export const POST = (request: Request) => handle(async () => { await say("rep", (await readBody(request, Body)).text); return { ok: true }; });
