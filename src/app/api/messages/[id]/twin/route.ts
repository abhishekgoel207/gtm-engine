import { handle } from "@/lib/http";
import { askTwin } from "@/services/twin";

export const POST = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => askTwin((await params).id));
