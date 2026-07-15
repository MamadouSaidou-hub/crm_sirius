"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Task, TaskType } from "@/lib/types";
import { TASK_TYPE_LABELS } from "@/lib/constants";
import { useMockUser } from "@/lib/mock-auth";
import { assignableCommercials, scopeProspects } from "@/lib/access";
import { prospects as allProspects } from "@/lib/mock-data";
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

const TYPES: TaskType[] = ["call", "visit", "follow_up", "quote", "other"];

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface TaskDialogProps {
  onAdd: (task: Task) => void;
  /** Lock the linked prospect (used on the prospect detail page). */
  fixedProspectId?: string;
  trigger?: React.ReactNode;
}

export function TaskDialog({ onAdd, fixedProspectId, trigger }: TaskDialogProps) {
  const { user } = useMockUser();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("call");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [prospectId, setProspectId] = useState<string>(
    fixedProspectId ?? "none"
  );
  const [assignedTo, setAssignedTo] = useState<string>(user.id);
  const [error, setError] = useState(false);

  const prospects = scopeProspects(user, allProspects);
  const commercials = assignableCommercials(user);
  const canAssign = user.role !== "commercial";

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("call");
    setDueDate(defaultDueDate());
    setProspectId(fixedProspectId ?? "none");
    setAssignedTo(user.id);
    setError(false);
  };

  const handleSubmit = () => {
    if (title.trim().length < 3) {
      setError(true);
      return;
    }
    onAdd({
      id: `t-new-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      type,
      status: "pending",
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      prospectId: prospectId === "none" ? null : prospectId,
      assignedTo: canAssign ? assignedTo : user.id,
      createdAt: new Date().toISOString(),
    });
    toast.success("Tâche créée");
    reset();
    setOpen(false);
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
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Titre *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Ex. Rappeler pour le devis"
              autoFocus
            />
            {error && (
              <p className="text-xs text-sirius-danger">
                Un titre est requis (3 caractères minimum).
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TASK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Échéance</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {!fixedProspectId && (
            <div className="space-y-1.5">
              <Label>Prospect lié</Label>
              <Select value={prospectId} onValueChange={setProspectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {prospects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canAssign && (
            <div className="space-y-1.5">
              <Label>Assigné à</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user.id}>Moi ({user.name})</SelectItem>
                  {commercials
                    .filter((c) => c.id !== user.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>Créer la tâche</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
