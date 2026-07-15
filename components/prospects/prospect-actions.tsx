"use client";

import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Prospect } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ProspectActions({ prospect }: { prospect: Prospect }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/prospects/${prospect.id}`)}>
          <Eye className="h-4 w-4" />
          Voir la fiche
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/prospects/${prospect.id}/edit`)}
        >
          <Pencil className="h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => toast.success(`Appel simulé vers ${prospect.phone}`)}
        >
          <Phone className="h-4 w-4" />
          Appeler
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-sirius-danger focus:text-sirius-danger"
          onClick={() =>
            toast.success("Suppression simulée", {
              description: `${prospect.name} aurait été supprimé.`,
            })
          }
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
