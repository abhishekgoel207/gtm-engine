/** Calls an API route from the browser. Throws with a plain message. */
export async function api<T = unknown>(path: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Object.assign(new Error(data.error ?? "Something went wrong. Try again."), { status: response.status, data });
  }
  return data as T;
}
