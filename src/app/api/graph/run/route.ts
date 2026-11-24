import { handle } from "@/lib/http";
import { activeEvaluations, displacementTargets } from "@/services/graphReasoning";
import { rescore } from "@/services/rescore";

export const POST = () =>
  handle(async () => {
    const evaluations = await activeEvaluations();
    const displacement = await displacementTargets();
    return { evaluations, displacement, scoresChanged: rescore() };
  });
