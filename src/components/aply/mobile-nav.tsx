"use client";
/**
 * MobileNav - bottom navigation bar for mobile/tablet.
 * Shows on screens < lg. Replaces the header nav links.
 * Fixed to bottom with safe-area support.
 */
import { Icon } from "@/components/aply/icon";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { href: "#monitoring", icon: "pulse", label: "Live" },
  { href: "#approvals", icon: "inbox", label: "Approvals" },
  { href: "#platforms", icon: "globe", label: "Platforms" },
  { href: "#analytics", icon: "graph", label: "Stats" },
  { href: "#settings", icon: "gear", label: "Settings" },
];

export function MobileNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden safe-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary active:bg-muted"
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
