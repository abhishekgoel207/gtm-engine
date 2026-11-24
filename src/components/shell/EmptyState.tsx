"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function EmptyState({ message }: { message: string }) {
  const router = useRouter();
  const [loading, startTransition] = useTransition();

  // Never replaces existing data.
  const loadExample = () =>
    startTransition(async () => {
      try {
        const response = await fetch("/api/demo/load", { method: "POST" });
        if (response.status === 409) {
          toast.info("You already have data, so nothing was changed.");
          return;
        }
        if (!response.ok) throw new Error();
        toast.success("Example loaded");
        router.refresh();
      } catch {
        toast.error("Couldn't load the example. Try again.");
      }
    });

  return (
    <div className="flex flex-1 flex-col md:flex-none md:gap-4">
      <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground md:min-h-48">
        {message}
      </p>
      <Button
        className="mt-4 h-12 w-full text-base md:mt-0 md:w-60 md:self-center"
        onClick={loadExample}
        disabled={loading}
      >
        {loading ? "Loading..." : "Load example"}
      </Button>
    </div>
  );
}
