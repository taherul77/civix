"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<Row> {
  /** Stable column id; also used as React key + sort identifier. */
  key: string;
  /** Header cell content. */
  header: ReactNode;
  /** Cell renderer for each row. */
  cell: (row: Row, index: number) => ReactNode;
  /**
   * Sort comparator. When provided, the column header becomes clickable
   * and toggles asc → desc → none on click.
   */
  sort?: (a: Row, b: Row) => number;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<Row> {
  rows: Row[];
  columns: ColumnDef<Row>[];
  /** Stable id used for selection, React keys, and dedupe. */
  getRowId: (row: Row) => string;

  // States
  loading?: boolean;
  error?: string | null;
  /** Rendered when there are no rows and the table is not loading/erroring. */
  empty?: ReactNode;

  // Search
  searchable?: boolean;
  searchPlaceholder?: string;
  /** When provided, controls how a row matches the search query. */
  searchFilter?: (row: Row, query: string) => boolean;
  /**
   * Optional toolbar slot rendered next to the search input — for "Refresh"
   * / "New X" / filter pill buttons.
   */
  toolbar?: ReactNode;

  // Selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Bulk-action toolbar rendered above the table when ≥1 row is selected. */
  bulkActions?: (selectedIds: Set<string>, selectedRows: Row[]) => ReactNode;

  // Pagination
  /** Default 20. Pass 0 to disable pagination entirely. */
  pageSize?: number;
  pageSizeOptions?: number[];

  // Row behaviour
  onRowClick?: (row: Row) => void;
  rowClassName?: (row: Row) => string | undefined;

  /** Wrapper className applied to the outer card-like container. */
  className?: string;
}

interface SortState {
  key: string;
  direction: Exclude<SortDirection, null>;
}

/**
 * Generic data table used by every list page in the app. Features:
 *   - column-level sort comparators
 *   - row selection with optional bulk-action bar
 *   - client-side search via either a default substring match across all
 *     cell renderings or a caller-provided `searchFilter`
 *   - client-side pagination with page-size selector
 *   - loading / empty / error states baked in
 */
export function DataTable<Row>({
  rows,
  columns,
  getRowId,
  loading,
  error,
  empty,
  searchable,
  searchPlaceholder,
  searchFilter,
  toolbar,
  selectable,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  bulkActions,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onRowClick,
  rowClassName,
  className,
}: DataTableProps<Row>) {
  const tt = useT();

  // Sort
  const [sort, setSort] = useState<SortState | null>(null);

  // Search
  const [query, setQuery] = useState("");

  // Selection (controlled or uncontrolled)
  const [internalSelected, setInternalSelected] = useState<Set<string>>(() => new Set());
  const selectedIds = controlledSelectedIds ?? internalSelected;
  const setSelected = (next: Set<string>) => {
    if (onSelectionChange) onSelectionChange(next);
    else setInternalSelected(next);
  };

  // Pagination
  const paginated = pageSize > 0;
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(pageSize);

  // ---------- derived ----------

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    if (searchFilter) return rows.filter((r) => searchFilter(r, q));
    // Default: stringify each cell's primitive content and substring-match.
    return rows.filter((row, i) =>
      columns.some((c) => {
        const v = c.cell(row, i);
        return typeof v === "string" || typeof v === "number"
          ? String(v).toLowerCase().includes(q)
          : false;
      })
    );
  }, [rows, query, searchable, searchFilter, columns]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return filtered;
    const out = [...filtered].sort(col.sort);
    return sort.direction === "desc" ? out.reverse() : out;
  }, [filtered, sort, columns]);

  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / perPage)) : 1;
  // Snap the current page into range if the row set shrinks.
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const visible = paginated
    ? sorted.slice(page * perPage, page * perPage + perPage)
    : sorted;

  const visibleIds = useMemo(() => visible.map(getRowId), [visible, getRowId]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selectedIds.has(id));

  const toggleAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      for (const id of visibleIds) next.delete(id);
    } else {
      for (const id of visibleIds) next.add(id);
    }
    setSelected(next);
  };
  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // ---------- handlers ----------

  const onHeaderClick = (col: ColumnDef<Row>) => {
    if (!col.sort) return;
    setSort((cur) => {
      if (!cur || cur.key !== col.key) return { key: col.key, direction: "asc" };
      if (cur.direction === "asc") return { key: col.key, direction: "desc" };
      return null; // third click clears sort
    });
  };

  // ---------- render ----------

  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("card overflow-hidden", className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3 border-b border-[rgb(var(--border))]">
          {searchable ? (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted))]" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder ?? tt("Search…")}
                className="input pl-9 h-9"
              />
            </div>
          ) : <div />}
          {toolbar && <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>}
        </div>
      )}

      {bulkActions && selectedIds.size > 0 && (
        <div className="px-3 py-2 border-b border-[rgb(var(--border))] bg-brand-500/5 flex items-center gap-3">
          <span className="text-sm font-medium">
            {tt(`${selectedIds.size} selected`)}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {bulkActions(
              selectedIds,
              rows.filter((r) => selectedIds.has(getRowId(r))),
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="civix">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10 px-3">
                  <input
                    type="checkbox"
                    aria-label={tt("Select all rows on this page")}
                    checked={allVisibleSelected}
                    ref={(el) => { if (el) el.indeterminate = someVisibleSelected; }}
                    onChange={toggleAllVisible}
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sort?.key === col.key;
                const sortable = !!col.sort;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      col.headerClassName,
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      sortable && "cursor-pointer select-none hover:text-[rgb(var(--fg))]",
                    )}
                    onClick={sortable ? () => onHeaderClick(col) : undefined}
                    aria-sort={
                      isSorted
                        ? sort!.direction === "asc" ? "ascending" : "descending"
                        : sortable ? "none" : undefined
                    }
                  >
                    <span className={cn(
                      "inline-flex items-center gap-1",
                      col.align === "right" && "flex-row-reverse"
                    )}>
                      {col.header}
                      {sortable && (
                        isSorted
                          ? sort!.direction === "asc"
                            ? <ChevronUp className="w-3 h-3" />
                            : <ChevronDown className="w-3 h-3" />
                          : <ChevronsUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="!py-10 text-center text-[rgb(var(--muted))]">
                  <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                  {tt("Loading…")}
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={colCount} className="!py-8 text-center text-rose-600 text-sm">
                  {error}
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="!py-10 text-center text-[rgb(var(--muted))] text-sm">
                  {empty ?? tt("No data")}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => {
                const id = getRowId(row);
                const isSelected = selectedIds.has(id);
                const extraCls = rowClassName?.(row);
                return (
                  <tr
                    key={id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-brand-500/5",
                      extraCls,
                    )}
                  >
                    {selectable && (
                      <td className="w-10 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={tt("Select row")}
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          col.className,
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                        )}
                      >
                        {col.cell(row, i)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {paginated && sorted.length > 0 && !loading && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3 border-t border-[rgb(var(--border))] text-xs text-[rgb(var(--muted))]">
          <div className="flex items-center gap-2">
            <span>{tt("Rows per page")}</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }}
              className="input h-7 py-0 px-2 text-xs w-auto"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>
              {sorted.length === 0
                ? tt("0 of 0")
                : `${page * perPage + 1}–${Math.min(sorted.length, (page + 1) * perPage)} ${tt("of")} ${sorted.length}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-ghost h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label={tt("Previous page")}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">{page + 1} / {totalPages}</span>
            <button
              type="button"
              className="btn btn-ghost h-7 w-7 p-0"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label={tt("Next page")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
