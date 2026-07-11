/**
 * Aply Icon · wraps @primer/octicons-react (the design.md mandates Octicons).
 * Usage: <Icon name="rocket" /> or <Icon name="rocket" size={20} />
 *
 * Accepts both kebab-case (e.g. "arrow-left") and the raw PascalCase export
 * name (e.g. "ArrowLeftIcon"). Internally maps "arrow-left" → "ArrowLeftIcon".
 */
import * as octicons from "@primer/octicons-react";
import { cn } from "@/lib/utils";

type IconName = keyof typeof octicons;

const ICON_MAP = octicons as Record<string, React.ComponentType<{
  size?: number | string;
  "aria-label"?: string;
}>>;

function resolveComponent(name: string) {
  // Direct lookup (PascalCase export name)
  if (ICON_MAP[name]) return ICON_MAP[name];
  // kebab-case → PascalCase + "Icon" suffix, e.g. "arrow-left" → "ArrowLeftIcon"
  const pascal = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const withIcon = `${pascal}Icon`;
  if (ICON_MAP[withIcon]) return ICON_MAP[withIcon];
  if (ICON_MAP[pascal]) return ICON_MAP[pascal];
  return undefined;
}

interface IconProps {
  name: IconName | string;
  size?: number;
  className?: string;
  "aria-label"?: string;
}

export function Icon({ name, size = 16, className, ...rest }: IconProps) {
  const Cmp = resolveComponent(name as string);
  if (!Cmp) {
    // graceful fallback so a bad name never crashes the page
    return (
      <span
        className={cn("inline-block", className)}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }
  return <Cmp size={size} className={className} {...rest} />;
}

export type { IconName };
