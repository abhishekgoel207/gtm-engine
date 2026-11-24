import { handle } from "@/lib/http";
import { zeroBalance } from "@/services/billing";

export const POST = () => handle(zeroBalance);
