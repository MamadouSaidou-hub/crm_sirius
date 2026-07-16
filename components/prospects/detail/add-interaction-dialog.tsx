"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { InteractionType } from "@/lib/types";
import { INTERACTION_LABELS } from "@/lib/constants";
import { useMockUser } from "@/lib/mock-auth";
import {
  createInteraction,
  type InteractionItem,
} from "@/lib/data/interactions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES: InteractionType[] = ["call", "visit", "note", "whatsapp", "sms"];

interface AddInteractionDialogProps {
  prospectId: string;
  onAdd: (interaction: InteractionItem) => void;
}

export function AddInteractionDialog({
  prospectId,
  onAdd,
}: AddInteractionDialogProps) {
  const { user } = useMockUser();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InteractionType>("call");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(false);

  const reset = () => {
    setType("call");
    setSummary("");
    setDuration("");
    setError(false);
  };

  const handleSubmit = async () => {
    if (summary.trim().length < 3) {
      setError(true);
      return;
    }
    try {
      const created = await createInteraction({
        prospectId,
        type,
        summary: summary.trim(),
        durationMin: duration ? Number(duration) : undefined,
        createdBy: user.id,
      });
      onAdd(created);
      toast.success("Interaction ajoutée");
      reset();
      setOpen(false);
    } catch {
      toast.error("Ajout impossible. Réessayez.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle interaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {INTERACTION_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="summary">Résumé *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Décrivez l'échange…"
              rows={3}
              autoFocus
            />
            {error && (
              <p className="text-xs text-sirius-danger">
                Un résumé est requis (3 caractères minimum).
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duration">Durée (minutes, optionnel)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="15"
              className="max-w-[140px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
