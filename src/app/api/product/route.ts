import { handle } from "@/lib/http";
import { saveProduct } from "@/services/product";

export const POST = (request: Request) =>
  handle(async () => saveProduct(await request.json().catch(() => null)));
