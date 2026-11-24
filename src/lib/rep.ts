/** The signed-in rep. One demo rep until there are accounts. */
export const REP = { actor: "rep" as const, actorName: "Alex Rep" };
export const REP_ID = "p_rep";
export const ai = (actorName: string) => ({ actor: "ai" as const, actorName });
