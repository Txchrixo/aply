"use client";
/**
 * KeyboardShortcutsHelp · press "?" to show all keyboard shortcuts.
 * A modal dialog listing every shortcut available in Aply.
 */
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Icon } from "@/components/aply/icon";
import { useI18n } from "@/components/aply/i18n";
import { useDashNav, type DashView } from "@/components/aply/dashboard-nav";

interface Shortcut {
  keys: string[];
  labelKey: string;
  group: "global" | "navigation";
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["⌘", "K"], labelKey: "shortcuts.openPalette", group: "global" },
  { keys: ["?"], labelKey: "shortcuts.showHelp", group: "global" },
  { keys: ["G", "M"], labelKey: "shortcuts.goMonitoring", group: "navigation" },
  { keys: ["G", "A"], labelKey: "shortcuts.goApprovals", group: "navigation" },
  { keys: ["G", "P"], labelKey: "shortcuts.goPlatforms", group: "navigation" },
  { keys: ["G", "H"], labelKey: "shortcuts.goHistory", group: "navigation" },
  { keys: ["G", "S"], labelKey: "shortcuts.goSettings", group: "navigation" },
  { keys: ["G", "E"], labelKey: "shortcuts.goExtension", group: "navigation" },
  { keys: ["S"], labelKey: "shortcuts.scanNow", group: "global" },
  { keys: ["Esc"], labelKey: "shortcuts.close", group: "global" },
];

interface KeyboardShortcutsHelpProps {
  onScan: () => void;
}

export function KeyboardShortcutsHelp({ onScan }: KeyboardShortcutsHelpProps) {
  const { t } = useI18n();
  const { setView } = useDashNav();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("role") === "combobox"
      ) {
        return;
      }

      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }

      if (e.key.toLowerCase() === "s" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (lastKey === "g" && Date.now() - lastKeyTime < 800) {
          e.preventDefault();
          setView("settings");
          lastKey = "";
          return;
        }
        e.preventDefault();
        onScan();
        return;
      }

      if (e.key.toLowerCase() === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        lastKey = "g";
        lastKeyTime = Date.now();
        return;
      }

      if (lastKey === "g" && Date.now() - lastKeyTime < 800) {
        const map: Record<string, DashView> = {
          m: "overview",
          a: "approvals",
          p: "platforms",
          h: "history",
          e: "extension",
          r: "resume",
          t: "training",
          n: "analytics",
        };
        const view = map[e.key.toLowerCase()];
        if (view) {
          e.preventDefault();
          setView(view);
        }
        lastKey = "";
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onScan, setView]);

  const globalShortcuts = SHORTCUTS.filter((s) => s.group === "global");
  const navShortcuts = SHORTCUTS.filter((s) => s.group === "navigation");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[#FFF4DC] sm:max-w-md dark:bg-[#3A2417]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl text-[#4A2F1A] dark:text-[#FFE4B5]">
            <Icon name="zap" size={18} className="text-[#C65D00]" />
            {t("shortcuts.title")}
          </DialogTitle>
          <DialogDescription className="text-[#79695E] dark:text-[#C9B89F]">
            {t("shortcuts.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#C65D00]">
              {t("shortcuts.global")}
            </h3>
            <ul className="grid gap-2">
              {globalShortcuts.map((s) => (
                <li
                  key={s.labelKey}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#4A2F1A] dark:text-[#FFE4B5]">
                    {t(s.labelKey)}
                  </span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="rounded border border-[#CFC5BE] bg-[#FFE4B5] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#4A2F1A] dark:border-[#5A3D26] dark:bg-[#4A2F1A] dark:text-[#FFE4B5]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[#C65D00]">
              {t("shortcuts.navigation")}
            </h3>
            <ul className="grid gap-2">
              {navShortcuts.map((s) => (
                <li
                  key={s.labelKey}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#4A2F1A] dark:text-[#FFE4B5]">
                    {t(s.labelKey)}
                  </span>
                  <span className="flex items-center gap-1">
                    {s.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="rounded border border-[#CFC5BE] bg-[#FFE4B5] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#4A2F1A] dark:border-[#5A3D26] dark:bg-[#4A2F1A] dark:text-[#FFE4B5]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="border-t border-[#CFC5BE] pt-3 text-xs text-[#79695E] dark:border-[#5A3D26] dark:text-[#C9B89F]">
          {t("shortcuts.hint")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
