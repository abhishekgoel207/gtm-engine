import type { MessagingProvider } from "./index";
import { buildSendGridMail } from "./sendgrid";

/** Builds the SendGrid request for emails, but sends nothing. */
export const mockMessaging: MessagingProvider = {
  async send(message, to) {
    if (message.channel === "email" && to.email) buildSendGridMail(message, to, "rep@pulsedesk.example");
    return { providerMessageId: `mock-${message.id}` };
  },
};
