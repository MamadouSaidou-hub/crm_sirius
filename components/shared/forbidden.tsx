import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForbiddenProps {
  title?: string;
  message?: string;
}

export function Forbidden({
  title = "Accès restreint",
  message = "Vous n'avez pas les permissions nécessaires pour consulter cette page.",
}: ForbiddenProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sirius-danger/10 text-sirius-danger">
          <ShieldX className="h-12 w-12" />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 font-heading text-5xl font-bold text-sirius-danger/20">
          403
        </span>
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
