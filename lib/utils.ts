import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as XOF / FCFA currency, e.g. 1 250 000 FCFA. */
export function formatFCFA(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

/** A bare number with thousands separators (unit shown elsewhere), e.g. 1 500 000. */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}

/** Compact FCFA for cards, e.g. 1,3 M FCFA (negative amounts keep their sign). */
export function formatFCFACompact(amount: number): string {
  const sign = amount < 0 ? "−" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} M FCFA`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)} K FCFA`;
  }
  return `${sign}${Math.round(abs)} FCFA`;
}

/** Build initials from a full name, e.g. "Mamadou Diallo" -> "MD". */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
