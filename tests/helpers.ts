export const post = (body: unknown, method = "POST", headers?: HeadersInit) =>
  new Request("http://localhost/api", { method, headers, body: JSON.stringify(body) });
export const params = (id: string) => ({ params: Promise.resolve({ id }) });
