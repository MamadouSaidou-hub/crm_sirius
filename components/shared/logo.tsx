"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Hide the "Assurances" line (collapsed sidebar). */
  compact?: boolean;
}

/** Text wordmark used in the sidebar and drawers. */
export function Logo({ className, compact = false }: LogoProps) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-heading text-lg font-bold uppercase tracking-wide text-sirius-teal">
        Sirius
      </span>
      {!compact && (
        <span className="font-heading text-[10px] font-medium uppercase tracking-[0.22em] text-sirius-subtext">
          Assurances
        </span>
      )}
    </span>
  );
}

/**
 * Full logo for the login / error pages. The source is a JPEG on a black
 * background, so `mix-blend-screen` drops the black on the dark theme and only
 * the bright mark and wordmark show.
 */
export function LogoFull({ className }: { className?: string }) {
  return (
    <Image
      src="/Sirius.jpeg"
      alt="Sirius Assurances"
      width={280}
      height={280}
      priority
      className={cn(
        "mx-auto h-auto w-56 object-contain mix-blend-screen",
        className,
      )}
    />
  );
}
