import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { createSequence } from "@/services/outreach";

const Body = z.object({ leadId: z.string().min(1) });
export const POST = (request: Request) => handle(async () => createSequence((await readBody(request, Body)).leadId));
