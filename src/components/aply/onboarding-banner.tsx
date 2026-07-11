"use client";
/**
 * OnboardingBanner · dismissible welcome banner shown to first-time users.
 * Persists dismissal in localStorage. Highlights the 3 key actions.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";

const STORAGE_KEY = "aply-onboarding-dismissed";

export function OnboardingBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
  };

  const steps = [
    {
      icon: "gear",
      title: t("onboarding.step1.title"),
      desc: t("onboarding.step1.desc"),
      href: "#settings",
    },
    {
      icon: "rocket",
      title: t("onboarding.step2.title"),
      desc: t("onboarding.step2.desc"),
      href: "#extension",
    },
    {
      icon: "sync",
      title: t("onboarding.step3.title"),
      desc: t("onboarding.step3.desc"),
      href: "#monitoring",
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-b border-border bg-gradient-to-r from-[#FF9F1C]/15 via-[#FFF4DC] to-[#C65D00]/10 dark:border-[#5A3D26] dark:from-[#FF9F1C]/10 dark:via-[#3A2417] dark:to-[#C65D00]/15"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                  <Icon name="rocket" size={18} />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold text-foreground dark:text-primary-foreground">
                    {t("onboarding.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground dark:text-[#C9B89F]">
                    {t("onboarding.desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {steps.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs transition-all hover:border-[#C65D00] hover:shadow-sm dark:border-[#5A3D26] dark:bg-[#4A2F1A]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-primary dark:bg-[#3A2417]">
                      <Icon name={s.icon} size={12} />
                    </span>
                    <span className="hidden text-foreground dark:text-primary-foreground sm:inline">
                      {s.title}
                    </span>
                    <span className="text-muted-foreground dark:text-[#C9B89F]">
                      {s.desc}
                    </span>
                  </a>
                ))}
                <button
                  onClick={dismiss}
                  aria-label={t("onboarding.dismiss")}
                  className="ml-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-primary dark:hover:bg-[#4A2F1A]"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
