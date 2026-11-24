import { z } from "zod";
import { handle, readBody } from "@/lib/http";
import { discover } from "@/services/discovery";

const Body = z.object({ icpId: z.string().min(1) });
export const POST = (request: Request) => handle(async () => discover((await readBody(request, Body)).icpId));
