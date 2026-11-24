import { handle } from "@/lib/http";
import { simulateReply } from "@/services/send";

export const POST = (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  handle(async () => simulateReply((await params).id));
