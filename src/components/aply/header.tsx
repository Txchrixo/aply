"use client";
/**
 * AplyHeader - sticky top bar.
 * Clean design: no bordered logo card, compact nav, adaptive controls.
 */
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { LanguageSwitcher } from "@/components/aply/language-switcher";
import { ActivityPopover } from "@/components/aply/activity-popover";
import { ThemeToggle } from "@/components/aply/theme-toggle";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  labelKey: string;
}

const NAV: NavLink[] = [
  { href: "#monitoring", labelKey: "nav.monitoring" },
  { href: "#approvals", labelKey: "nav.approvals" },
  { href: "#platforms", labelKey: "nav.platforms" },
  { href: "#history", labelKey: "nav.history" },
  { href: "#analytics", labelKey: "nav.analytics" },
  { href: "#settings", labelKey: "nav.settings" },
];

interface AplyHeaderProps {
  monitoringEnabled: boolean;
  children?: React.ReactNode;
}

export function AplyHeader({ monitoringEnabled, children }: AplyHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md safe-top">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Brand - no card, just icon + text */}
        <a href="#top" className="flex items-center gap-2" aria-label="Aply home">
          <Icon name="rocket" size={22} className="text-primary" />
          <span className="font-heading text-lg font-semibold text-foreground">
            Aply
          </span>
        </a>

        {/* Desktop nav - compact, centered */}
        <nav
          aria-label="Sections"
          className="mx-auto hidden items-center gap-0.5 lg:flex"
        >
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {t(l.labelKey)}
            </a>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0">
          {/* Monitoring pill - hidden on mobile */}
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium md:inline-flex",
              monitoringEnabled
                ? "bg-[#2ea043]/10 text-[#2ea043]"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span className="relative flex h-2 w-2">
              {monitoringEnabled && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  monitoringEnabled ? "bg-[#2ea043]" : "bg-muted-foreground"
                )}
              />
            </span>
            {monitoringEnabled ? "Live" : "Paused"}
          </span>

          <div className="hidden items-center gap-1.5 sm:flex">
            <LanguageSwitcher />
            {children}
            <ActivityPopover />
            <ThemeToggle />
          </div>

          <a
            href="#extension"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all hover:bg-accent"
          >
            <Icon name="rocket" size={13} />
            <span className="hidden sm:inline">Get extension</span>
          </a>
        </div>
      </div>
    </header>
  );
}
