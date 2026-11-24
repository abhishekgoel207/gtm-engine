import type { MessagingProvider } from "./index";

export const mockMessaging: MessagingProvider = {
  async send(message) {
    return { providerMessageId: `mock-${message.id}` };
  },
};
