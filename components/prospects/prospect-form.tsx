"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { ProductType, Prospect } from "@/lib/types";
import { SENEGAL_CITIES } from "@/lib/types";
import { PRODUCTS, PRODUCT_LABELS } from "@/lib/constants";
import { useMockUser } from "@/lib/mock-auth";
import { assignableCommercials } from "@/lib/access";
import { getUserById } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Le nom est requis (2 caractères min)."),
  phone: z
    .string()
    .regex(/^\+221\s?[0-9\s]{9,}$/, "Format attendu : +221 77 123 45 67")
    .or(z.literal("")),
  email: z.string().email("Email invalide").or(z.literal("")),
  cni: z.string().optional(),
  address: z.string().optional(),
  city: z.enum(SENEGAL_CITIES),
  products: z.array(z.enum(PRODUCTS)).min(1, "Sélectionnez au moins un produit."),
  estimatedPremium: z.coerce
    .number({ invalid_type_error: "Montant invalide" })
    .min(0, "Le montant doit être positif."),
  assignedTo: z.string().min(1, "Assignez un commercial."),
  notes: z.string().optional(),
});

type FormValues = z.input<typeof schema>;

interface ProspectFormProps {
  prospect?: Prospect;
}

export function ProspectForm({ prospect }: ProspectFormProps) {
  const router = useRouter();
  const { user } = useMockUser();
  const isEdit = Boolean(prospect);
  const commercials = assignableCommercials(user);
  const lockedAssignee = user.role === "commercial";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prospect?.name ?? "",
      phone: prospect?.phone ?? "+221 ",
      email: prospect?.email ?? "",
      cni: prospect?.cni ?? "",
      address: prospect?.address ?? "",
      city: prospect?.city ?? "Dakar",
      products: prospect?.products ?? [],
      estimatedPremium: prospect?.estimatedPremium ?? 0,
      assignedTo: prospect?.assignedTo ?? (lockedAssignee ? user.id : ""),
      notes: prospect?.notes ?? "",
    },
  });

  const products = watch("products");
  const city = watch("city");
  const assignedTo = watch("assignedTo");

  const toggleProduct = (product: ProductType) => {
    const next = products.includes(product)
      ? products.filter((p) => p !== product)
      : [...products, product];
    setValue("products", next, { shouldValidate: true });
  };

  const onSubmit = (values: FormValues) => {
    // Prototype: nothing is persisted; we simulate the save.
    toast.success(isEdit ? "Prospect mis à jour" : "Prospect créé", {
      description: `${values.name} a été enregistré (simulation).`,
    });
    router.push(prospect ? `/prospects/${prospect.id}` : "/prospects");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom complet" error={errors.name?.message} required>
            <Input {...register("name")} placeholder="Ex. Awa Diop" />
          </Field>
          <Field label="Téléphone" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="+221 77 123 45 67" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register("email")} placeholder="awa.diop@gmail.com" />
          </Field>
          <Field label="CNI">
            <Input {...register("cni")} placeholder="1 234 1990 56789" />
          </Field>
          <Field label="Adresse">
            <Input {...register("address")} placeholder="12 Rue Diop" />
          </Field>
          <Field label="Ville" required>
            <Select
              value={city}
              onValueChange={(v) =>
                setValue("city", v as (typeof SENEGAL_CITIES)[number])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENEGAL_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Besoin assurance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Produits intéressés" error={errors.products?.message} required>
            <div className="flex flex-wrap gap-2">
              {PRODUCTS.map((product) => {
                const active = products.includes(product);
                return (
                  <button
                    key={product}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      active
                        ? "border-sirius-gold bg-sirius-gold/15 text-sirius-gold"
                        : "border-border text-muted-foreground hover:border-sirius-gold/40"
                    )}
                  >
                    {PRODUCT_LABELS[product]}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field
            label="Prime estimée (FCFA)"
            error={errors.estimatedPremium?.message}
            className="sm:max-w-xs"
          >
            <Input
              type="number"
              step={1000}
              {...register("estimatedPremium")}
              placeholder="250000"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignation</CardTitle>
        </CardHeader>
        <CardContent>
          <Field
            label="Commercial assigné"
            error={errors.assignedTo?.message}
            className="sm:max-w-sm"
            required
          >
            {lockedAssignee ? (
              <Input
                readOnly
                value={getUserById(user.id)?.name ?? user.name}
                className="cursor-not-allowed opacity-80"
              />
            ) : (
              <Select
                value={assignedTo}
                onValueChange={(v) => setValue("assignedTo", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un commercial" />
                </SelectTrigger>
                <SelectContent>
                  {commercials.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register("notes")}
            placeholder="Contexte, préférences, historique…"
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit">
          {isEdit ? "Enregistrer les modifications" : "Créer le prospect"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-sirius-danger">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-sirius-danger">{error}</p>}
    </div>
  );
}
