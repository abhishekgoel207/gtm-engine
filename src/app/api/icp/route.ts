import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { createIcp } from "@/services/icp";

const Body = z.object({ productId: z.string().min(1) });

export const POST = (request: Request) =>
  handle(async () => createIcp((await readBody(request, Body)).productId));
