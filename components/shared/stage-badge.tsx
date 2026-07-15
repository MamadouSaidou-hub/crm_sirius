import { Badge } from "@/components/ui/badge";
import { STAGE_BADGE_VARIANT, STAGE_LABELS } from "@/lib/constants";
import type { Stage } from "@/lib/types";

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge variant={STAGE_BADGE_VARIANT[stage]}>{STAGE_LABELS[stage]}</Badge>;
}
