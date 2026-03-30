"use client";

import { useDeferredValue, useMemo, useState, type ReactNode } from "react";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  getSearchText,
  emptyState,
  initialPageSize = 8,
  toolbarSlot,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  getSearchText?: (row: TData) => string;
  emptyState?: ReactNode;
  initialPageSize?: number;
  toolbarSlot?: ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const filteredData = useMemo(() => {
    const query = normalizeSearch(deferredSearch);
    if (!query || !getSearchText) {
      return data;
    }

    return data.filter((row) => normalizeSearch(getSearchText(row)).includes(query));
  }, [data, deferredSearch, getSearchText]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="block w-full max-w-md">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Busqueda rapida
          </span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white"
          />
        </label>
        {toolbarSlot ? <div className="shrink-0">{toolbarSlot}</div> : null}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50/90">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-200">
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();

                    return (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                            className={[
                              "flex items-center gap-2 text-left",
                              canSort ? "cursor-pointer text-slate-600 hover:text-slate-900" : "",
                            ].join(" ")}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {canSort ? (
                              <span className="text-slate-400">
                                {header.column.getIsSorted() === "asc"
                                  ? "↑"
                                  : header.column.getIsSorted() === "desc"
                                    ? "↓"
                                    : "↕"}
                              </span>
                            ) : null}
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12">
                    {emptyState ?? (
                      <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        No hay registros para los filtros actuales.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-top text-sm text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
          <p>
            Mostrando <span className="font-semibold text-slate-900">{table.getRowModel().rows.length}</span> de{" "}
            <span className="font-semibold text-slate-900">{filteredData.length}</span> registros
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(event) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                })
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
            >
              {[6, 8, 10, 20].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} por pagina
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              className={paginationButtonClassName}
            >
              «
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={paginationButtonClassName}
            >
              ‹
            </button>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Pagina {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={paginationButtonClassName}
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              className={paginationButtonClassName}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const paginationButtonClassName =
  "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
