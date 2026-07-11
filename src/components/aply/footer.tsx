"use client";
/**
 * AplyFooter · dark cocoa footer with brand, links, and tech notes.
 * Uses i18n for all visible strings.
 */
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";

const FOOTER_LINK_KEYS: Array<{ href: string; key: string }> = [
  { href: "#monitoring", key: "nav.monitoring" },
  { href: "#approvals", key: "nav.approvals" },
  { href: "#platforms", key: "nav.platforms" },
  { href: "#history", key: "nav.history" },
  { href: "#analytics", key: "nav.analytics" },
  { href: "#settings", key: "nav.settings" },
  { href: "#extension", key: "nav.extension" },
];

export function AplyFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto bg-[#4A2F1A] px-4 py-10 text-[#FFE4B5] md:px-6 md:py-12">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-3">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FFE4B5]/20 bg-[#FFE4B5]/5">
              <Icon name="rocket" size={18} className="text-[#FF9F1C]" />
            </span>
            <span className="font-heading text-xl font-semibold">Aply</span>
          </div>
          <p className="text-sm text-[#FFE4B5]/70">
            {t("footer.tagline")} {t("footer.localOnly")}.
          </p>
          <p className="text-xs text-[#FFE4B5]/50">{t("footer.rights")}</p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#FF9F1C]">
            {t("footer.sections")}
          </h3>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-2">
            {FOOTER_LINK_KEYS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-[#FFE4B5]/80 transition-colors hover:text-[#FF9F1C]"
              >
                {t(l.key)}
              </a>
            ))}
          </nav>
        </div>

        {/* Tech */}
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-[#FF9F1C]">
            {t("footer.tech")}
          </h3>
          <p className="text-sm text-[#FFE4B5]/80">
            {t("footer.poweredBy")}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-[#FFE4B5]/60">
            <Icon name="shield-lock" size={12} className="text-[#FF9F1C]" />
            {t("footer.localOnly")}
          </p>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-7xl border-t border-[#FFE4B5]/10 pt-6">
        <p className="text-xs text-[#FFE4B5]/50">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  );
}
