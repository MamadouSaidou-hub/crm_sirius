"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Stage } from "@/lib/types";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LostReasonDialog } from "@/components/prospects/lost-reason-dialog";

interface StageControlProps {
  stage: Stage;
  prospectName: string;
  onStageChange: (stage: Stage, reason?: string) => void;
}

export function StageControl({
  stage,
  prospectName,
  onStageChange,
}: StageControlProps) {
  const [lostOpen, setLostOpen] = useState(false);

  const handleChange = (next: Stage) => {
    if (next === stage) return;
    if (next === "lost") {
      setLostOpen(true);
      return;
    }
    onStageChange(next);
    if (next === "won") {
      toast.success("🎉 Prospect gagné !", {
        description: `Félicitations, ${prospectName} a signé.`,
      });
    } else {
      toast.success("Stage mis à jour", {
        description: `${prospectName} est maintenant « ${STAGE_LABELS[next]} ».`,
      });
    }
  };

  return (
    <>
      <Select value={stage} onValueChange={(v) => handleChange(v as Stage)}>
        <SelectTrigger className="h-8 w-[150px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s}>
              {STAGE_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <LostReasonDialog
        open={lostOpen}
        onOpenChange={setLostOpen}
        prospectName={prospectName}
        onConfirm={(reason) => {
          onStageChange("lost", reason);
          toast.info("Prospect marqué comme perdu", { description: reason });
        }}
      />
    </>
  );
}
