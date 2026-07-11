"use client";
/**
 * LanguageSwitcher · compact EN/FR/DE segmented toggle.
 * Persists choice to localStorage via the I18nProvider.
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/aply/icon";
import { useI18n, type Locale } from "@/components/aply/i18n";
import { cn } from "@/lib/utils";

const LOCALES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "EN" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "de", label: "Deutsch", flag: "DE" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Language"
          className="flex h-9 items-center gap-1.5 rounded-md border border-[#CFC5BE] bg-[#FFE4B5] px-2.5 text-xs font-semibold text-[#4A2F1A] transition-colors hover:border-[#C65D00] hover:text-[#C65D00]"
        >
          <Icon name="globe" size={14} />
          {current.flag}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-lg border-[#CFC5BE] bg-[#FFF4DC]"
      >
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLocale(l.code)}
            className={cn(
              "cursor-pointer gap-2 text-sm",
              l.code === locale
                ? "bg-[#FFE4B5] font-medium text-[#C65D00]"
                : "text-[#4A2F1A]"
            )}
          >
            <span className="flex h-5 w-7 items-center justify-center rounded border border-[#CFC5BE] bg-[#FFE4B5] text-[10px] font-bold">
              {l.flag}
            </span>
            {l.label}
            {l.code === locale && (
              <Icon name="check" size={14} className="ml-auto text-[#C65D00]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
