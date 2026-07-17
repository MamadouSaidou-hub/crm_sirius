"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car } from "lucide-react";
import type {
  AutoFormula,
  AutoFuel,
  AutoRiskData,
  AutoUsage,
} from "@/lib/types";
import {
  AUTO_FORMULAS,
  AUTO_FORMULA_DESCRIPTIONS,
  AUTO_FORMULA_LABELS,
  AUTO_FUEL_LABELS,
  AUTO_USAGE_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const CURRENT_YEAR = new Date().getFullYear();
const FUELS = Object.keys(AUTO_FUEL_LABELS) as AutoFuel[];
const USAGES = Object.keys(AUTO_USAGE_LABELS) as AutoUsage[];

const schema = z.object({
  fiscalPower: z.coerce
    .number({ invalid_type_error: "Valeur invalide" })
    .int()
    .min(1, "Requis")
    .max(60),
  seats: z.coerce.number({ invalid_type_error: "Valeur invalide" }).int().min(1).max(60),
  firstRegistrationYear: z.coerce
    .number({ invalid_type_error: "Année invalide" })
    .int()
    .min(1980, "Année trop ancienne")
    .max(CURRENT_YEAR, "Année future"),
  fuel: z.enum(["essence", "diesel", "hybride", "electrique"]),
  marketValue: z.coerce
    .number({ invalid_type_error: "Montant invalide" })
    .min(0, "Doit être positif"),
  usage: z.enum(["personal", "business", "transport", "goods"]),
  licenseYears: z.coerce
    .number({ invalid_type_error: "Valeur invalide" })
    .int()
    .min(0)
    .max(70),
  formula: z.enum(["rc", "tiers_plus", "tous_risques"]),
});

type FormValues = z.input<typeof schema>;

interface AutoSimulationFormProps {
  defaultValue?: AutoRiskData;
  onSimulate: (risk: AutoRiskData) => void;
  /** Hide the generic formula card (e.g. Askia uses its own guarantees). */
  showFormula?: boolean;
}

export function AutoSimulationForm({
  defaultValue,
  onSimulate,
  showFormula = true,
}: AutoSimulationFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fiscalPower: defaultValue?.fiscalPower ?? 7,
      seats: defaultValue?.seats ?? 5,
      firstRegistrationYear: defaultValue?.firstRegistrationYear ?? 2018,
      fuel: defaultValue?.fuel ?? "essence",
      marketValue: defaultValue?.marketValue ?? 8_000_000,
      usage: defaultValue?.usage ?? "personal",
      licenseYears: defaultValue?.licenseYears ?? 5,
      formula: defaultValue?.formula ?? "tiers_plus",
    },
  });

  const fuel = watch("fuel");
  const usage = watch("usage");
  const formula = watch("formula");

  const onSubmit = (values: FormValues) => {
    onSimulate({
      fiscalPower: Number(values.fiscalPower),
      seats: Number(values.seats),
      firstRegistrationYear: Number(values.firstRegistrationYear),
      fuel: values.fuel,
      marketValue: Number(values.marketValue),
      usage: values.usage,
      licenseYears: Number(values.licenseYears),
      formula: values.formula,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-sirius-teal" />
            Véhicule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Puissance fiscale (CV)" error={errors.fiscalPower?.message} required>
            <Input type="number" {...register("fiscalPower")} placeholder="7" />
          </Field>
          <Field label="Nombre de places" error={errors.seats?.message} required>
            <Input type="number" {...register("seats")} placeholder="5" />
          </Field>
          <Field
            label="Année de 1re mise en circulation"
            error={errors.firstRegistrationYear?.message}
            required
          >
            <Input
              type="number"
              {...register("firstRegistrationYear")}
              placeholder="2018"
            />
          </Field>
          <Field label="Énergie" required>
            <Select value={fuel} onValueChange={(v) => setValue("fuel", v as AutoFuel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FUELS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {AUTO_FUEL_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Valeur vénale (FCFA)"
            error={errors.marketValue?.message}
            required
          >
            <Input
              type="number"
              step={100_000}
              {...register("marketValue")}
              placeholder="8000000"
            />
          </Field>
          <Field label="Usage" required>
            <Select
              value={usage}
              onValueChange={(v) => setValue("usage", v as AutoUsage)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USAGES.map((u) => (
                  <SelectItem key={u} value={u}>
                    {AUTO_USAGE_LABELS[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Ancienneté du permis (années)"
            error={errors.licenseYears?.message}
            required
          >
            <Input type="number" {...register("licenseYears")} placeholder="5" />
          </Field>
        </CardContent>
      </Card>

      {showFormula && (
      <Card>
        <CardHeader>
          <CardTitle>Formule souhaitée</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {AUTO_FORMULAS.map((f) => {
              const active = formula === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setValue("formula", f as AutoFormula)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border p-3 text-left transition-colors",
                    active
                      ? "border-sirius-gold bg-sirius-gold/10"
                      : "border-border hover:border-sirius-gold/40",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-sirius-gold" : "text-foreground",
                    )}
                  >
                    {AUTO_FORMULA_LABELS[f]}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {AUTO_FORMULA_DESCRIPTIONS[f]}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Comparer les offres
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-sirius-danger">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-sirius-danger">{error}</p>}
    </div>
  );
}
