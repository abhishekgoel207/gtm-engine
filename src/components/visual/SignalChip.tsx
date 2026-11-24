import { Banknote, CalendarClock, Megaphone, Newspaper, Snowflake, UserPlus, Wrench, type LucideIcon } from "lucide-react";
import type { Signal } from "@/lib/types";

const CHIPS: Record<Signal["type"], [LucideIcon, string]> = {
  funding: [Banknote, "Funding"], exec_hire: [UserPlus, "New leader"], job_posting: [Megaphone, "Hiring"], tech_change: [Wrench, "New technology"],
  renewal_window: [CalendarClock, "Renewal coming"], churn_risk: [CalendarClock, "May switch"], press: [Newspaper, "In the news"], hiring_freeze: [Snowflake, "Hiring freeze"], layoff: [Snowflake, "Layoffs"],
};
export function SignalChip({ type }: { type: Signal["type"] }) {
  const [Icon, label] = CHIPS[type];
  return <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs"><Icon className="size-3.5 text-warn" aria-hidden />{label}</span>;
}
