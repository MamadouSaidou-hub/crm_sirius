"use client";

import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useMockUser } from "@/lib/mock-auth";
import { ROLE_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AppearanceCard } from "@/components/settings/appearance-card";

export default function SettingsPage() {
  const { user } = useMockUser();
  const canEdit = user.role === "admin";

  const [notif, setNotif] = useState({
    email: true,
    push: false,
    taskReminders: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil et vos préférences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mon profil</CardTitle>
            <CardDescription>
              {ROLE_LABELS[user.role]} · {user.agency}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom complet</Label>
              <Input defaultValue={user.name} readOnly={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue={user.email} readOnly={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input defaultValue={user.phone} readOnly={!canEdit} />
            </div>
            {canEdit ? (
              <Button onClick={() => toast.success("Profil enregistré")}>
                Enregistrer
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Seul un administrateur peut modifier ces informations.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Synchronisation</CardTitle>
            <CardDescription>État de la synchronisation des données</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Dernière synchronisation
                </p>
                <p className="text-xs text-muted-foreground">Il y a 3 min</p>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-sirius-success" />
            </div>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Synchronisation lancée", {
                  description: "Les données sont à jour (simulation).",
                })
              }
            >
              <RefreshCw className="h-4 w-4" />
              Forcer la synchronisation
            </Button>
          </CardContent>
        </Card>

        <AppearanceCard />

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choisissez comment être alerté</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleRow
              label="Notifications email"
              description="Résumés et alertes par email"
              checked={notif.email}
              onChange={(v) => setNotif((p) => ({ ...p, email: v }))}
            />
            <Separator />
            <ToggleRow
              label="Notifications push"
              description="Alertes en temps réel sur l'appareil"
              checked={notif.push}
              onChange={(v) => setNotif((p) => ({ ...p, push: v }))}
            />
            <Separator />
            <ToggleRow
              label="Rappels de tâches"
              description="Rappel avant l'échéance des tâches"
              checked={notif.taskReminders}
              onChange={(v) => setNotif((p) => ({ ...p, taskReminders: v }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>À propos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium text-foreground">0.1.0</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Éditeur</span>
              <span className="text-foreground">Sirius Assurances © 2026</span>
            </div>
            <Separator />
            <a
              href="https://siriusassurances.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-sirius-teal hover:underline"
            >
              <span>siriusassurances.com</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
