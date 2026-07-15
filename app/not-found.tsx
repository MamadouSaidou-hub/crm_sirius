import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-sirius-navy p-4 text-center">
      <Logo className="text-2xl" />
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sirius-teal/10 text-sirius-teal">
          <Compass className="h-12 w-12" />
        </div>
        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 font-heading text-5xl font-bold text-sirius-teal/20">
          404
        </span>
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Page introuvable
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}
