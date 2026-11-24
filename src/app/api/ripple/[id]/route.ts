import { handle, readBody } from "@/lib/http";
import { removeContact, RipplePatchSchema, setOkToContact } from "@/services/ripple";

type Params = { params: Promise<{ id: string }> };
export const PATCH = (request: Request, { params }: Params) =>
  handle(async () => setOkToContact((await params).id, (await readBody(request, RipplePatchSchema)).okToContact));
export const DELETE = (_request: Request, { params }: Params) => handle(async () => removeContact((await params).id));
