"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createRemunerationPlan } from "@/lib/data/commissions";
import type { RemunerationPlan } from "@/lib/payroll/rates";
import { firstOfCurrentMonth } from "@/components/commissions/agreement-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const percent = z
  .number({ invalid_type_error: "Valeur invalide" })
  .min(0, "Un taux doit être entre 0 et 100 %")
  .max(100, "Un taux doit être entre 0 et 100 %");

const schema = z.object({
  baseFixe: z.number({ invalid_type_error: "Base fixe invalide" }).min(0, "Base fixe invalide"),
  performancePercent: percent,
  retrocessionPercent: percent,
  dureeMois: z
    .number({ invalid_type_error: "Durée invalide" })
    .int("Durée invalide")
    .min(1, "Durée invalide"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

interface PlanDialogProps {
  /** Plan currently in force, used to pre-fill the form. */
  current: RemunerationPlan | null;
  userId: string;
  onCreated: () => void;
}

export function PlanDialog({ current, userId, onCreated }: PlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [baseFixe, setBaseFixe] = useState(String(current?.baseFixe ?? ""));
  const [performance, setPerformance] = useState(
    current ? String(current.tauxPerformance * 100) : "",
  );
  const [retrocession, setRetrocession] = useState(
    current ? String(current.tauxRetrocession * 100) : "",
  );
  const [duree, setDuree] = useState(String(current?.dureeMois ?? ""));
  const [effectiveFrom, setEffectiveFrom] = useState(firstOfCurrentMonth());

  const handleSubmit = async () => {
    const parsed = schema.safeParse({
      baseFixe: baseFixe === "" ? Number.NaN : Number(baseFixe),
      performancePercent: performance === "" ? Number.NaN : Number(performance),
      retrocessionPercent: retrocession === "" ? Number.NaN : Number(retrocession),
      dureeMois: duree === "" ? Number.NaN : Number(duree),
      effectiveFrom,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Données invalides");
      return;
    }
    if (parsed.data.effectiveFrom < firstOfCurrentMonth()) {
      toast.error("La date d'effet ne peut pas être avant le mois en cours.");
      return;
    }
    setSaving(true);
    try {
      await createRemunerationPlan({
        baseFixe: parsed.data.baseFixe,
        tauxPerformance: parsed.data.performancePercent / 100,
        tauxRetrocession: parsed.data.retrocessionPercent / 100,
        dureeMois: parsed.data.dureeMois,
        effectiveFrom: parsed.data.effectiveFrom,
        createdBy: userId,
      });
      toast.success("Barème enregistré");
      setOpen(false);
      onCreated();
    } catch {
      toast.error(
        "Enregistrement impossible : un barème existe déjà à cette date, ou vous n'avez pas les droits.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4" />
          Nouveau barème
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau barème de rémunération</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pl-base">Base fixe (FCFA)</Label>
            <Input id="pl-base" type="number" min={0} value={baseFixe} onChange={(e) => setBaseFixe(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-duree">Durée (mois)</Label>
            <Input id="pl-duree" type="number" min={1} value={duree} onChange={(e) => setDuree(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-perf">Prime de performance (%)</Label>
            <Input id="pl-perf" type="number" min={0} max={100} step="0.01" value={performance} onChange={(e) => setPerformance(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-retro">Rétrocession (%)</Label>
            <Input id="pl-retro" type="number" min={0} max={100} step="0.01" value={retrocession} onChange={(e) => setRetrocession(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="pl-date">En vigueur dès</Label>
            <Input id="pl-date" type="date" min={firstOfCurrentMonth()} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          S&apos;applique à partir de cette date, sans recalculer les mois
          précédents.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
