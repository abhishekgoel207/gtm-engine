import { Radio } from "lucide-react";

export function RippleBadge({ owner }: { owner: string }) {
  return (
    <span data-ripple className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-link/15 px-2.5 py-1 text-xs text-link">
      <Radio className="size-3.5" aria-hidden />Ripple: {owner}
    </span>
  );
}
