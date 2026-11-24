import type { MessagingProvider } from "./index";

export const sendgridMessaging: MessagingProvider = {
  async send() {
    throw new Error("not implemented");
  },
};
