import { ExternalLink } from "lucide-react";
import { sourceHref } from "@/lib/sourceHref";
import type { Source } from "@/lib/types";

export function SourceLink({ source, label }: { source: Source; label?: string }) {
  return (
    <a href={sourceHref(source.url)} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-sm text-blue-700 underline underline-offset-2">
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      {label ?? source.title.replace(/^demo: /, "")}
      <span className="sr-only"> (source, opens in a new tab)</span>
    </a>
  );
}

export function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <ul>
      {sources.map((s) => (
        <li key={s.url}><SourceLink source={s} /></li>
      ))}
    </ul>
  );
}
