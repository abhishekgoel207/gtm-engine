import type { Message, Person } from "@/lib/types";
import type { MessagingProvider } from "./index";

// https://www.twilio.com/docs/sendgrid/api-reference/mail-send/mail-send
export function buildSendGridMail(message: Message, to: Person, from: string) {
  if (!to.email) throw new Error("No email address");
  return {
    personalizations: [{ to: [{ email: to.email, name: to.name }], custom_args: { message_id: message.id } }],
    from: { email: from },
    subject: message.subject ?? "Hello",
    content: [{ type: "text/plain", value: message.body }],
  };
}

export const sendgridMessaging: MessagingProvider = {
  async send(message, to) {
    if (!process.env.SENDGRID_FROM) throw new Error("SENDGRID_FROM is not set");
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` },
      body: JSON.stringify(buildSendGridMail(message, to, process.env.SENDGRID_FROM)),
      signal: AbortSignal.timeout(15_000),
    });
    if (response.status !== 202) throw new Error(`SendGrid returned ${response.status}`);
    // TODO(verify): the docs page read does not describe this header.
    return { providerMessageId: response.headers.get("x-message-id") ?? `sendgrid-${message.id}` };
  },
};
