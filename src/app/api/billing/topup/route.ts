import { handle } from "@/lib/http";
import { topUp } from "@/services/billing";

export const POST = () => handle(topUp);
