import {
  Activity,
  Bot,
  ChartColumn,
  CircleCheck,
  CreditCard,
  House,
  Kanban,
  type LucideIcon,
  Settings,
  Share2,
  Swords,
  Target,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "pending";
}

/** Bottom tabs on mobile. "More" opens a sheet with MORE_ITEMS. */
export const TABS: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/buyers", label: "Buyers", icon: Users },
  { href: "/approve", label: "Approve", icon: CircleCheck, badge: "pending" },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
];

export const MORE_ITEMS: NavItem[] = [
  { href: "/icp", label: "Ideal customer", icon: Target },
  { href: "/competitors", label: "Competitors", icon: Swords },
  { href: "/graph", label: "Graph", icon: Share2 },
  { href: "/insights", label: "Insights", icon: ChartColumn },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
