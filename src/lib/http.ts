import { z } from "zod";

/** An error whose message is safe and plain enough to show the rep. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

/** Runs a route and turns errors into JSON with a plain message. */
export async function handle(run: () => unknown): Promise<Response> {
  try {
    return Response.json(await run());
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json({ error: error.message, ...error.data }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}

/** Reads and validates a JSON body, or throws a 400. */
export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const body = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  throw new AppError(400, `Check ${issue.path.join(" ") || "the request"}: ${issue.message}`);
}
