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
      { title: "Reviews", href: "/reviews", icon: Star },
      { title: "Coupons", href: "/coupons", icon: Ticket },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
      { title: "Media", href: "/media", icon: ImageIcon },
      { title: "Notifications", href: "/notifications", icon: Bell },
      { title: "Activity Log", href: "/activity", icon: ScrollText },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Store Settings", href: "/settings", icon: Settings },
      { title: "Users & Roles", href: "/users", icon: UserCog },
      { title: "Security", href: "/security", icon: ShieldCheck },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
