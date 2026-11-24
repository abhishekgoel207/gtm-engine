import {
  Activity,
  Bot,
  ChartColumn,
  CircleCheck,
  CreditCard,
  Kanban,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Radio,
  Rocket,
  Settings,
  Share2,
  Swords,
  Target,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "pending";
}

export interface NavSection {
  label: string;
  /** What this part of the app is for. */
  help: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** Main tabs in the order a rep works, each with its sub-tabs in order. */
export const SECTIONS: NavSection[] = [
  {
    label: "Dashboard", help: "See how it's going", icon: LayoutDashboard, items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/insights", label: "Insights", icon: ChartColumn },
      { href: "/activity", label: "Activity", icon: Activity },
    ],
  },
  {
    label: "Onboarding", help: "Set up once", icon: Rocket, items: [
      { href: "/start", label: "Your product", icon: Package },
      { href: "/icp", label: "Ideal customer", icon: Target },
      { href: "/competitors", label: "Competitors", icon: Swords },
    ],
  },
  {
    label: "Prospects", help: "Find people", icon: Users, items: [
      { href: "/buyers", label: "Buyers", icon: Users },
      { href: "/ripple", label: "Ripple", icon: Radio },
      { href: "/graph", label: "Connections", icon: Share2 },
    ],
  },
  {
    label: "Actions", help: "Reach out", icon: Zap, items: [
      { href: "/approve", label: "Approve", icon: CircleCheck, badge: "pending" },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/agents", label: "Agents", icon: Bot },
    ],
  },
  {
    label: "Account", help: "Credits and settings", icon: UserRound, items: [
      { href: "/billing", label: "Billing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = SECTIONS.flatMap((s) => s.items);

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const sectionOf = (pathname: string): NavSection | undefined =>
  SECTIONS.find((s) => s.items.some((item) => isActive(item.href, pathname)));
