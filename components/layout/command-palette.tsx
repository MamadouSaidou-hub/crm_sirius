"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Calculator,
  CheckSquare,
  KanbanSquare,
  LayoutDashboard,
  Phone,
  Settings,
  Target,
  User as UserIcon,
  Users,
  UsersRound,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMockUser } from "@/lib/mock-auth";
import { scopeProspects } from "@/lib/access";
import { prospects as allProspects } from "@/lib/mock-data";
import { canManageTeam } from "@/lib/access";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAGES = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Prospects", href: "/prospects", icon: Users },
  { label: "Pipeline", href: "/prospects/kanban", icon: KanbanSquare },
  { label: "Nouvelle simulation", href: "/simulation", icon: Calculator },
  { label: "Tâches", href: "/tasks", icon: CheckSquare },
  { label: "Objectifs", href: "/performance", icon: Target },
  { label: "Équipe", href: "/users", icon: UsersRound, managerOnly: true },
  {
    label: "Compagnies",
    href: "/partners",
    icon: Building2,
    managerOnly: true,
  },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useMockUser();

  const prospects = scopeProspects(user, allProspects).slice(0, 50);
  const pages = PAGES.filter((p) => !p.managerOnly || canManageTeam(user));

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un prospect ou une page…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Prospects">
          {prospects.map((p) => (
            <CommandItem
              key={p.id}
              value={`${p.name} ${p.phone}`}
              onSelect={() => go(`/prospects/${p.id}`)}
            >
              <UserIcon className="text-muted-foreground" />
              <span className="flex-1">{p.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {p.phone}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Pages">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem
                key={page.href}
                value={page.label}
                onSelect={() => go(page.href)}
              >
                <Icon className="text-muted-foreground" />
                {page.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
