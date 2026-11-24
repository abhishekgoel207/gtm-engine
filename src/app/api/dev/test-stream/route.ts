import { runTestStream } from "@/services/testStream";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  await runTestStream();
  return Response.json({ ok: true });
}
