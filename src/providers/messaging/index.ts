import type { Message, Person } from "@/lib/types";

/** Delivery only. The human-approval check lives in src/services/send.ts. */
export interface MessagingProvider {
  send(message: Message, to: Person): Promise<{ providerMessageId: string }>;
}
