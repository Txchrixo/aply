"use client";
/**
 * OnboardingBanner - dismissible welcome banner.
 * Clean design: gradient background, no card, inline steps.
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
    { icon: "gear", title: t("onboarding.step1.title"), desc: t("onboarding.step1.desc"), href: "#settings" },
    { icon: "rocket", title: t("onboarding.step2.title"), desc: t("onboarding.step2.desc"), href: "#extension" },
    { icon: "sync", title: t("onboarding.step3.title"), desc: t("onboarding.step3.desc"), href: "#monitoring" },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-b border-border bg-gradient-to-r from-primary/8 via-card to-accent/8"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👋</span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("onboarding.title")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.desc")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {steps.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    className="group flex items-center gap-2 rounded-lg bg-background/60 px-3 py-1.5 text-xs transition-all hover:bg-background"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon name={s.icon} size={12} />
                    </span>
                    <span className="text-foreground">{s.title}</span>
                    <span className="hidden text-muted-foreground sm:inline">
                      {s.desc}
                    </span>
                  </a>
                ))}
                <button
                  onClick={dismiss}
                  aria-label={t("onboarding.dismiss")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
