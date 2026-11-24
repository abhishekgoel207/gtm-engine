import type { Lead, Message } from "./types";

export const STAGE_LABELS: Record<Lead["stage"], string> = {
  matched: "Matched", contacted: "Contacted", replied: "Replied", meeting: "Meeting booked", won: "Won", lost: "Lost",
};
export const CHANNEL_LABELS: Record<Message["channel"], string> = { email: "Email", linkedin: "LinkedIn" };
