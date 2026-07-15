import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Hide the "CRM" suffix (e.g. collapsed sidebar). */
  compact?: boolean;
}

/** Text-only Sirius CRM wordmark. */
export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span
      className={cn(
        "font-heading text-xl font-bold uppercase tracking-wide",
        className
      )}
    >
      <span className="text-sirius-gold">SIRIUS</span>
      {!compact && <span className="ml-1 text-sirius-teal">CRM</span>}
    </span>
  );
}
