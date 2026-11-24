import { loadDemoIfEmpty } from "@/services/demo";

const STATUS = { loaded: 200, has_data: 409, invalid: 500 };

export async function POST() {
  const result = loadDemoIfEmpty();
  return Response.json({ result }, { status: STATUS[result] });
}
