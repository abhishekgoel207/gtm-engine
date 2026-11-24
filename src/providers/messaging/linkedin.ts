import type { MessagingProvider } from "./index";

export const linkedinMessaging: MessagingProvider = {
  async send() {
    throw new Error("not implemented");
  },
};
