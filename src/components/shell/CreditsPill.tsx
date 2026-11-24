import { Coins } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { creditsColor } from "@/config/billing";
import { cn } from "@/lib/utils";
import { getBilling } from "@/providers/registry";

/** Render inside Suspense. */
export async function CreditsPill() {
  await connection();
  const balance = await getBilling().balance();
  return (
    <Link href="/billing" className="inline-flex min-h-11 items-center" aria-label={`${balance} credits`}>
      <span className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm whitespace-nowrap", creditsColor(balance))}>
        <Coins className="size-4" aria-hidden />
        {balance}
      </span>
    </Link>
  );
}
