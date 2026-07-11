"use client";
/**
 * ThemeToggle · sun/moon icon button that switches light ↔ dark.
 * Uses next-themes useTheme() + Octicons sun/moon icons.
 */
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@/components/aply/icon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch · next-themes reads localStorage on client
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-[#CFC5BE] bg-[#FFE4B5]"
      >
        <Icon name="sun" size={15} />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#CFC5BE] bg-[#FFE4B5] text-[#4A2F1A] transition-colors hover:border-[#C65D00] hover:text-[#C65D00] dark:border-[#5A3D26] dark:bg-[#3A2417] dark:text-[#FFE4B5] dark:hover:border-[#FF9F1C] dark:hover:text-[#FF9F1C]"
    >
      <Icon name={isDark ? "sun" : "moon"} size={15} />
    </button>
  );
}
