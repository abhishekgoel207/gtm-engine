import { connection } from "next/server";
import { countPendingMessages } from "@/services/pending";

/** Number of messages waiting for the rep. Render inside Suspense. */
export async function PendingBadge() {
  await connection();
  const count = countPendingMessages();
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-red-600 px-1.5 text-xs leading-5 font-medium text-white">
      {count}
      <span className="sr-only"> waiting for approval</span>
    </span>
  );
}
