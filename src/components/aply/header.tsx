"use client";
/**
 * AplyHeader · sticky top bar with logo, anchor nav, monitoring pill,
 * language switcher, activity bell, and CTA.
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
    <header className="sticky top-0 z-40 border-b border-[#CFC5BE] bg-[#FFF4DC]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FFF4DC]/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 md:px-6">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5" aria-label="Aply home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#CFC5BE] bg-[#FFE4B5] shadow-sm">
            <Icon name="rocket" size={20} className="text-[#C65D00]" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-xl font-semibold text-[#4A2F1A]">
              Aply
            </span>
            <span className="text-[11px] text-[#79695E]">
              {t("header.tagline")}
            </span>
          </span>
        </a>

        {/* Center nav (desktop) */}
        <nav
          aria-label="Sections"
          className="mx-auto hidden items-center gap-1 lg:flex"
        >
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-sm text-[#79695E] transition-colors hover:bg-[#FFE4B5] hover:text-[#C65D00]"
            >
              {t(l.labelKey)}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Monitoring pill */}
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
              monitoringEnabled
                ? "border-[#2ea043]/30 bg-[#2ea043]/10 text-[#2ea043]"
                : "border-[#CFC5BE] bg-[#FFE4B5] text-[#79695E]"
            )}
            title={
              monitoringEnabled
                ? "Aply is scanning job boards"
                : "Monitoring is paused"
            }
          >
            <span className="relative flex h-2 w-2">
              {monitoringEnabled && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ea043] opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  monitoringEnabled ? "bg-[#2ea043]" : "bg-[#79695E]"
                )}
              />
            </span>
            {monitoringEnabled ? "Active" : "Paused"}
          </span>

          <LanguageSwitcher />
          {children}
          <ActivityPopover />
          <ThemeToggle />

          <a
            href="#extension"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#C65D00] px-3 text-sm font-medium text-[#FFE4B5] shadow-sm transition-all hover:bg-[#FF9F1C] hover:text-[#4A2F1A] hover:shadow-md"
          >
            <Icon name="rocket" size={14} />
            <span className="hidden sm:inline">{t("header.openInChrome")}</span>
            <span className="sm:hidden">Chrome</span>
          </a>
        </div>
      </div>
    </header>
  );
}
