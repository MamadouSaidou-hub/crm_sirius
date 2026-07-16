"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ProspectListItem } from "@/lib/data/prospects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/shared/stage-badge";
import { ProductBadges } from "@/components/shared/product-badges";
import { ProspectActions } from "@/components/prospects/prospect-actions";
import { formatFCFA } from "@/lib/utils";
import { relativeDate } from "@/lib/date";

const PAGE_SIZE = 25;

export function ProspectsTable({ data }: { data: ProspectListItem[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ProspectListItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nom",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },
      { accessorKey: "phone", header: "Téléphone", enableSorting: false },
      { accessorKey: "city", header: "Ville" },
      {
        id: "products",
        header: "Produit",
        enableSorting: false,
        cell: ({ row }) => <ProductBadges products={row.original.products} />,
      },
      {
        accessorKey: "estimatedPremium",
        header: "Prime estimée",
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatFCFA(row.original.estimatedPremium)}
          </span>
        ),
      },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => <StageBadge stage={row.original.stage} />,
      },
      {
        id: "assignedTo",
        header: "Assigné à",
        accessorFn: (p) => p.assigneeName,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "lastActivityAt",
        header: "Dernière activité",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {relativeDate(row.original.lastActivityAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => <ProspectActions prospect={row.original} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const { pageIndex } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const start = totalRows === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const end = Math.min((pageIndex + 1) * PAGE_SIZE, totalRows);

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="hover:bg-transparent">
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 transition-colors hover:text-foreground"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sorted === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                Aucun prospect ne correspond aux filtres.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => router.push(`/prospects/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    onClick={
                      cell.column.id === "actions"
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
        <p className="text-xs text-muted-foreground">
          {start}–{end} sur {totalRows} prospect{totalRows > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
