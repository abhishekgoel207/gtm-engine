import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { showAnyway } from "@/services/negativeSignals";

const Body = z.object({ action: z.literal("show") }).strict();
export const PATCH = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => {
    await readBody(request, Body);
    return showAnyway((await params).id);
  });
