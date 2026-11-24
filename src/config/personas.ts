export const PERSONAS = {
  executive: { maxWords: 90, focus: "outcome and return on investment", cta: "Worth a 15-minute call?" },
  manager: { maxWords: 120, focus: "workflow pain", cta: "Want the 2-page overview?" },
  technical: { maxWords: 140, focus: "integration detail", cta: "Can I send the API docs?" },
} as const;
export type PersonaKind = keyof typeof PERSONAS;
export const LINKEDIN_NOTE_MAX = 300;

export function personaOf({ title, seniority }: { title: string; seniority: string }): PersonaKind {
  if (/engineer|architect|developer/i.test(title)) return "technical";
  return ["c_level", "vp"].includes(seniority) || /^(c[a-z]o|vp)\b/i.test(title) ? "executive" : "manager";
}
