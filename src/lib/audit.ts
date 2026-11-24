import { nanoid } from "nanoid";
import { upsert } from "./store";
import { type AuditEvent, AuditEventSchema } from "./types";

export function logAudit(input: Omit<AuditEvent, "id" | "ts">): AuditEvent {
  return upsert(
    "audit",
    AuditEventSchema.parse({
      ...input,
      id: nanoid(),
      ts: new Date().toISOString(),
    }),
  );
}
