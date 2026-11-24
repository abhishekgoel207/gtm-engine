import { handle, readBody } from "@/lib/http";
import { RippleInputSchema, RipplePasteSchema, shareContact, shareList } from "@/services/ripple";
import { z } from "zod";

export const POST = (request: Request) =>
  handle(async () => {
    const body = await request.json().catch(() => null);
    // A pasted list has rows; a single contact does not.
    const again = () => new Request(request.url, { method: "POST", body: JSON.stringify(body) });
    if (z.object({ rows: z.unknown() }).safeParse(body).success && body.rows !== undefined) return shareList(await readBody(again(), RipplePasteSchema));
    return shareContact(await readBody(again(), RippleInputSchema));
  });
