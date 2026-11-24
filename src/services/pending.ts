import { list } from "@/lib/store";

/** Messages still waiting for a rep to approve or reject them. */
export function countPendingMessages(): number {
  return list("messages").filter((m) => m.status === "draft").length;
}
