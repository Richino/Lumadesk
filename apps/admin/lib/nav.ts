import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Star,
  Ticket,
  BarChart3,
  Image as ImageIcon,
  Bell,
  Settings,
  ShieldCheck,
  ScrollText,
  UserCog,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Modules not yet built in this phase render but link to a placeholder. */
  soon?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      { title: "Orders", href: "/orders", icon: ShoppingCart },
      { title: "Products", href: "/products", icon: Package },
      { title: "Inventory", href: "/inventory", icon: Boxes },
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Reviews", href: "/reviews", icon: Star, soon: true },
      { title: "Coupons", href: "/coupons", icon: Ticket, soon: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3, soon: true },
      { title: "Media", href: "/media", icon: ImageIcon, soon: true },
      { title: "Notifications", href: "/notifications", icon: Bell, soon: true },
      { title: "Activity Log", href: "/activity", icon: ScrollText, soon: true },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Store Settings", href: "/settings", icon: Settings, soon: true },
      { title: "Users & Roles", href: "/users", icon: UserCog, soon: true },
      { title: "Security", href: "/security", icon: ShieldCheck, soon: true },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
