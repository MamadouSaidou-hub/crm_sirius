"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProspectById } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  prospects: "Prospects",
  kanban: "Pipeline",
  tasks: "Tâches",
  users: "Équipe",
  settings: "Paramètres",
  new: "Nouveau",
  edit: "Modifier",
};

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    let label = SEGMENT_LABELS[segment];
    if (!label) {
      const prospect = getProspectById(segment);
      label = prospect ? prospect.name : segment;
    }
    crumbs.push({ label, href });
  }
  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-1 text-sm text-muted-foreground"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={crumb.href}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            {isLast ? (
              <span className="truncate font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn("truncate transition-colors hover:text-foreground")}
              >
                {crumb.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
