"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { User, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/constants";
import { users } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["admin", "manager", "commercial"];

const schema = z
  .object({
    name: z.string().min(2, "Nom requis."),
    email: z.string().email("Email invalide."),
    role: z.enum(["admin", "manager", "commercial"]),
    managerId: z.string(),
    agency: z.string().min(2, "Agence requise."),
    phone: z
      .string()
      .regex(/^\+221\s?[0-9\s]{9,}$/, "Format attendu : +221 77 123 45 67"),
  })
  .superRefine((val, ctx) => {
    if (val.role === "commercial" && !val.managerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["managerId"],
        message: "Un commercial doit avoir un manager.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface UserFormDialogProps {
  mode: "invite" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const managers = users.filter((u) => u.role === "manager");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "commercial",
      managerId: "",
      agency: "Agence Dakar Plateau",
      phone: "+221 ",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        role: user?.role ?? "commercial",
        managerId: user?.managerId ?? "",
        agency: user?.agency ?? "Agence Dakar Plateau",
        phone: user?.phone ?? "+221 ",
      });
    }
  }, [open, user, reset]);

  const role = watch("role");
  const managerId = watch("managerId");

  const onSubmit = (values: FormValues) => {
    if (mode === "invite") {
      toast.success("Invitation envoyée (simulée)", {
        description: `${values.name} a été invité comme ${ROLE_LABELS[values.role].toLowerCase()}.`,
      });
    } else {
      toast.success("Membre mis à jour", {
        description: `${values.name} a été enregistré (simulation).`,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "invite" ? "Inviter un membre" : "Modifier le membre"}
          </DialogTitle>
          <DialogDescription>
            {mode === "invite"
              ? "Le membre recevra une invitation par email (simulée)."
              : "Mettez à jour les informations du membre."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom" error={errors.name?.message}>
              <Input {...register("name")} placeholder="Awa Diop" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <Input {...register("email")} placeholder="awa@sirius.com" />
            </Field>
            <Field label="Rôle" error={errors.role?.message}>
              <Select
                value={role}
                onValueChange={(v) => setValue("role", v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Manager"
              error={errors.managerId?.message}
            >
              <Select
                value={managerId || "none"}
                onValueChange={(v) =>
                  setValue("managerId", v === "none" ? "" : v, {
                    shouldValidate: true,
                  })
                }
                disabled={role !== "commercial"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Agence" error={errors.agency?.message}>
              <Input {...register("agency")} />
            </Field>
            <Field label="Téléphone" error={errors.phone?.message}>
              <Input {...register("phone")} placeholder="+221 77 123 45 67" />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {mode === "invite" ? "Envoyer l'invitation" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-sirius-danger">{error}</p>}
    </div>
  );
}
