"use client";

import type { SimProduct } from "@/lib/types";
import { SIM_PRODUCTS, SIM_PRODUCT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductTabsProps {
  value: SimProduct;
  onChange: (product: SimProduct) => void;
}

/** Segmented selector for the simulation product. */
export function ProductTabs({ value, onChange }: ProductTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SIM_PRODUCTS.map((product) => {
        const active = product === value;
        return (
          <button
            key={product}
            type="button"
            onClick={() => onChange(product)}
            aria-pressed={active}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-sirius-gold bg-sirius-gold/10 text-sirius-gold"
                : "border-border text-muted-foreground hover:border-sirius-gold/40 hover:text-foreground",
            )}
          >
            {SIM_PRODUCT_LABELS[product]}
          </button>
        );
      })}
    </div>
  );
}
