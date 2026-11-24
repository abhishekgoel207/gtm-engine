import { handle } from "@/lib/http";
import { runPlan } from "@/services/agents/room";

export const POST = () => handle(async () => { await runPlan(); return { ok: true }; });
