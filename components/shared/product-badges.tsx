import { Badge } from "@/components/ui/badge";
import { PRODUCT_LABELS } from "@/lib/constants";
import type { ProductType } from "@/lib/types";

export function ProductBadges({ products }: { products: ProductType[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {products.map((product) => (
        <Badge key={product} variant="outline">
          {PRODUCT_LABELS[product]}
        </Badge>
      ))}
    </div>
  );
}
