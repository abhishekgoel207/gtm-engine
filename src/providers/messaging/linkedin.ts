import type { MessagingProvider } from "./index";

/** Assisted send: the rep sends it in LinkedIn, then taps "I sent it". Nothing is sent here. */
export const linkedinMessaging: MessagingProvider = {
  async send(message, to) {
    if (!to.linkedinUrl) throw new Error("No LinkedIn profile");
    return { providerMessageId: `linkedin-${message.id}` };
  },
};
