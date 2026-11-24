import type { MessagingProvider } from "./index";

export const gmailMessaging: MessagingProvider = {
  async send() {
    throw new Error("not implemented");
  },
};
