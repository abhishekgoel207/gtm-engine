"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StickyAction } from "@/components/StickyAction";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function BillingActions() {
  const router = useRouter();
  const run = async (path: string, done: string) => {
    try {
      await api(path, "POST");
      toast.success(done);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
  return (
    <>
      <Button variant="outline" className="mt-4 h-11 self-start" onClick={() => run("/api/billing/zero", "Balance is 0")}>Set balance to 0 (demo)</Button>
      <StickyAction><Button onClick={() => run("/api/billing/topup", "Added 500 credits")}>Top up 500 (demo)</Button></StickyAction>
    </>
  );
}
