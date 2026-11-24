import { z } from "zod";
import { AppError, handle, readBody } from "@/lib/http";
import { AGENTS, mentionsIn } from "@/services/agents/names";
import { say } from "@/services/agents/room";

const Body = z.object({ agent: z.string(), from: z.string(), text: z.string().min(1).max(2_000) });

/** Messages from the Band room. Needs the shared token; approvals can't be given here. */
export const POST = (request: Request) =>
  handle(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) throw new AppError(401, "Not allowed.");
    const { agent, text } = await readBody(request, Body);
    const known = AGENTS.find((a) => a === agent);
    if (!known) throw new AppError(400, "Unknown agent.");
    await say("rep", mentionsIn(text).includes(known) ? text : `@${known} ${text}`);
    return { ok: true };
  });
