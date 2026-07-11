"use client";
/**
 * ExtensionSection · Chrome extension install + browser mockup.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/components/aply/icon";
import { SectionHeading } from "@/components/aply/section-heading";
import type { ExtensionInfo } from "@/components/aply/types";
import { apiFetch } from "@/components/aply/utils";
import { useI18n } from "@/components/aply/i18n";

export function ExtensionSection() {
  const { t } = useI18n();
  const [info, setInfo] = useState<ExtensionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiFetch<ExtensionInfo>("/api/extension")
      .then((d) => {
        if (alive) setInfo(d);
      })
      .catch(() => toast.error(t("extension.toast.loadFailed")))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section
      id="extension"
      aria-labelledby="extension-heading"
      className="bg-[#FFF4DC]/60 px-4 py-16 md:px-6 md:py-20"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
        {/* Left: copy + install steps */}
        <div className="flex flex-col gap-5">
          <SectionHeading
            id="extension-heading"
            eyebrow={t("extension.eyebrow")}
            title={t("extension.title")}
            subtitle={t("extension.subtitle")}
          />

          <div className="rounded-xl border border-[#CFC5BE] bg-[#FFF4DC] p-5">
            <h3 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-[#4A2F1A]">
              <Icon name="download" size={14} className="text-[#C65D00]" />
              {t("extension.install")}
            </h3>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <ol className="space-y-2.5">
                {info?.installSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C65D00] text-xs font-semibold text-[#FFE4B5]">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[#4A2F1A]">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              className="bg-[#C65D00] text-[#FFE4B5] hover:bg-[#FF9F1C] hover:text-[#4A2F1A]"
            >
              <a href="/aply-extension/manifest.json" download>
                <Icon name="download" size={14} />
                {t("extension.download")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[#C65D00] text-[#C65D00] hover:bg-[#FFE4B5]"
            >
              <a href="/aply-extension/README.md" target="_blank" rel="noopener noreferrer">
                <Icon name="book" size={14} />
                {t("extension.guide")}
              </a>
            </Button>
          </div>
        </div>

        {/* Right: browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden rounded-xl border-[#CFC5BE] bg-[#FFF4DC] p-0 shadow-sm">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-[#CFC5BE] bg-[#FFE4B5] px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#B23A1E]/40" />
                <span className="h-3 w-3 rounded-full bg-[#FF9F1C]/60" />
                <span className="h-3 w-3 rounded-full bg-[#2ea043]/50" />
              </div>
              <div className="ml-2 flex flex-1 items-center gap-2 rounded-md border border-[#CFC5BE] bg-[#FFF4DC] px-3 py-1 text-xs text-[#79695E]">
                <Icon name="lock" size={10} className="text-[#2ea043]" />
                {t("extension.mockup.url")}
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#C65D00] bg-[#C65D00] text-[#FFE4B5]">
                <Icon name="rocket" size={12} />
              </span>
            </div>

            {/* Page body */}
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C65D00]">
                    {t("extension.mockup.brand")}
                  </p>
                  <h4 className="mt-1 font-heading text-xl font-semibold leading-tight text-[#4A2F1A]">
                    {t("extension.mockup.title")}
                  </h4>
                  <p className="mt-1 text-xs text-[#79695E]">
                    {t("extension.mockup.meta")}
                  </p>
                </div>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold text-[#FFE4B5]"
                  style={{ backgroundColor: "#C65D00" }}
                  aria-hidden
                >
                  DC
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#4A2F1A]">
                {t("extension.mockup.body")}
              </p>

              {/* Right-click menu mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="absolute right-4 top-24 w-64 rounded-lg border border-[#CFC5BE] bg-[#FFF4DC] py-1 shadow-lg"
              >
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#79695E]">
                  <Icon name="browser" size={12} />
                  {t("extension.mockup.back")}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#79695E]">
                  <Icon name="copy" size={12} />
                  {t("extension.mockup.copyLink")}
                </div>
                <div className="my-1 h-px bg-[#CFC5BE]" />
                <div className="flex items-center gap-2 bg-[#C65D00]/10 px-3 py-2 text-xs font-medium text-[#C65D00]">
                  <Icon name="rocket" size={12} />
                  {t("extension.mockup.capture")}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#79695E]">
                  <Icon name="pencil" size={12} />
                  {t("extension.mockup.draft")}
                </div>
              </motion.div>

              {/* Annotation arrow */}
              <div className="mt-10 flex items-center gap-2 text-xs text-[#C65D00]">
                <Icon name="arrow-down-right" size={14} />
                <span className="font-medium">
                  {t("extension.mockup.annotation")}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Permissions row */}
      {info && info.permissions.length > 0 && (
        <div className="mx-auto mt-10 w-full max-w-7xl">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#79695E]">
            {t("extension.permissionsLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {info.permissions.map((p, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-[#CFC5BE] bg-[#FFF4DC] px-2.5 py-1 text-xs text-[#79695E]"
              >
                <Icon name="shield-lock" size={10} className="text-[#C65D00]" />
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
