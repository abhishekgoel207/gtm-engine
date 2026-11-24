import type { ReactNode } from "react";

/** Keeps the screen's one main button above the bottom tabs. */
export function StickyAction({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 mt-6 md:bottom-4 [&>button]:h-12 [&>button]:w-full [&>button]:text-base [&>button]:shadow-lg md:[&>button]:w-72">
      {children}
    </div>
  );
}
