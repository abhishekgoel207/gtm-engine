import { z } from "zod";
import { NEGATIVE_RULES, type NegativeRule } from "@/config/negativeRules";
import { handle, readBody } from "@/lib/http";
import { setRule } from "@/services/negativeSignals";

const Body = z.object({ rule: z.enum(Object.keys(NEGATIVE_RULES) as [NegativeRule, ...NegativeRule[]]), enabled: z.boolean() });
export const PATCH = (request: Request) =>
  handle(async () => {
    const { rule, enabled } = await readBody(request, Body);
    return { hidden: setRule(rule, enabled) };
  });
