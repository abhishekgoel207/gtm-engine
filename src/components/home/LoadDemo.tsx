"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";

export function LoadDemo({ empty }: { empty: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const load = async () => {
    setBusy(true);
    setAsking(false);
    try {
      await api("/api/demo/reset", "POST");
      toast.success("Demo loaded");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Button variant="outline" className="h-11" disabled={busy} onClick={() => (empty ? load() : setAsking(true))}>{busy ? "Loading..." : "Load demo"}</Button>
      <Dialog open={asking} onOpenChange={setAsking}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Replace your data with the demo?</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="h-12" onClick={() => setAsking(false)}>Keep my data</Button>
            <Button className="h-12" onClick={load}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
