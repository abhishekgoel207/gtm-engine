import { connection } from "next/server";
import { getProviderModes } from "@/providers/registry";

export async function GET() {
  // Without this the response is prerendered and frozen at build time.
  await connection();
  return Response.json(getProviderModes());
}
