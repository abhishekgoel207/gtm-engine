import { handle, readBody } from "@/lib/http";
import { IcpPatchSchema, updateIcp } from "@/services/icp";

export const PATCH = (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => updateIcp((await params).id, await readBody(request, IcpPatchSchema)));
