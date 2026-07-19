"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Hide the wordmark, keeping only the star mark (collapsed sidebar). */
  compact?: boolean;
}

/**
 * Sirius mark + wordmark, used in the sidebar and drawers. Falls back to a
 * text wordmark if the image asset is missing, so the UI is never broken.
 */
export function Logo({ className, compact = false }: LogoProps) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span
        className={cn(
          "font-heading text-xl font-bold uppercase tracking-wide",
          className,
        )}
      >
        <span className="text-sirius-teal">Sirius</span>
        {!compact && (
          <span className="ml-1 text-sirius-subtext">Assurances</span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Image
        src="/sirius-mark.png"
        alt="Sirius Assurances"
        width={36}
        height={36}
        priority
        className="h-9 w-9 object-contain"
        onError={() => setBroken(true)}
      />
      {!compact && (
        <span className="font-heading font-bold uppercase leading-none">
          <span className="block text-lg tracking-wide text-sirius-teal">
            Sirius
          </span>
          <span className="block text-[10px] font-medium tracking-[0.22em] text-sirius-subtext">
            Assurances
          </span>
        </span>
      )}
    </span>
  );
}

/** Full stacked logo (star + wordmark) for the login and error pages. */
export function LogoFull({ className }: { className?: string }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="font-heading text-2xl font-bold uppercase tracking-wide">
        <span className="text-sirius-teal">Sirius</span>
        <span className="ml-1 text-sirius-subtext">Assurances</span>
      </span>
    );
  }

  return (
    <Image
      src="/sirius-logo.png"
      alt="Sirius Assurances"
      width={200}
      height={200}
      priority
      className={cn("h-auto w-40 object-contain", className)}
      onError={() => setBroken(true)}
    />
  );
}
