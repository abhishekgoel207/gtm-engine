import { connection } from "next/server";
import { getHome } from "@/services/home";
import { NextStep } from "./NextStep";

/** Render inside Suspense. */
export async function NextStepLoader() {
  await connection();
  const { steps, next } = getHome();
  const index = steps.indexOf(next);
  // The last step never ends, so it isn't a reminder.
  if (index < 0 || index === steps.length - 1) return null;
  return <NextStep label={next.label} href={next.href} step={index + 1} total={steps.length} />;
}
