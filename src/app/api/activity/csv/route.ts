import { connection } from "next/server";
import { getActivity, toCsv } from "@/services/activity";

export async function GET(request: Request) {
  await connection();
  const query = new URL(request.url).searchParams;
  const pick = (key: string) => query.get(key) || undefined;
  const rows = getActivity({ actor: pick("actor"), channel: pick("channel"), lead: pick("lead") });
  return new Response(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="activity.csv"' },
  });
}
