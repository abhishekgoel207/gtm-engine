import { handle } from "@/lib/http";
import { matchRipple } from "@/services/ripple";

export const POST = () => handle(matchRipple);
