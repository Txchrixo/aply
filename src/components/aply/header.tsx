"use client";
/**
 * AplyHeader - sticky top bar.
 * Desktop: logo + nav links + controls (language, search, activity, theme, CTA)
 * Mobile: logo + compact controls (CTA only, nav is in MobileNav bottom bar)
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
  { href: "#extension", labelKey: "nav.extension" },
];

interface AplyHeaderProps {
  monitoringEnabled: boolean;
  children?: React.ReactNode;
}

export function AplyHeader({ monitoringEnabled, children }: AplyHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-top">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 sm:h-16 sm:px-4 md:gap-4 md:px-6">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2 sm:gap-2.5" aria-label="Aply home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm sm:h-10 sm:w-10">
            <Icon name="rocket" size={18} className="text-primary sm:size-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-lg font-semibold text-foreground sm:text-xl">
              Aply
            </span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {t("header.tagline")}
            </span>
          </span>
        </a>

        {/* Center nav (desktop only, lg+) */}
        <nav
          aria-label="Sections"
          className="mx-auto hidden items-center gap-0.5 lg:flex"
        >
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
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
              "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
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
            {monitoringEnabled ? "Active" : "Paused"}
          </span>

          {/* Controls - hidden on mobile (available via settings on mobile) */}
          <div className="hidden sm:flex sm:items-center sm:gap-1.5">
            <LanguageSwitcher />
            {children}
            <ActivityPopover />
            <ThemeToggle />
          </div>

          <a
            href="#extension"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-accent hover:shadow-md"
          >
            <Icon name="rocket" size={14} />
            <span className="hidden sm:inline">{t("header.openInChrome")}</span>
            <span className="sm:hidden">Get</span>
          </a>
        </div>
      </div>
    </header>
  );
}
