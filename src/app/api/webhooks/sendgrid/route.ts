import { AppError, handle, readBody } from "@/lib/http";
import { handleSendGridEvents, SendGridEventsSchema } from "@/services/send";

// TODO(verify): SendGrid's signed-webhook check. Until then a shared token in the URL is required.
export const POST = (request: Request) =>
  handle(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || new URL(request.url).searchParams.get("token") !== secret) throw new AppError(401, "Not allowed.");
    return handleSendGridEvents(await readBody(request, SendGridEventsSchema));
  });
