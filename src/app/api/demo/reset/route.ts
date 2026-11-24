import { loadDemo } from "@/services/demo";

export async function POST() {
  const result = loadDemo();
  if (!result.ok) {
    console.error(["Seed refused:", ...result.errors].join("\n- "));
    return Response.json(result, { status: 500 });
  }
  console.table(result.summary);
  return Response.json(result);
}
