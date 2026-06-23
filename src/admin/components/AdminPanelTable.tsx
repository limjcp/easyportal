import type { ReactNode } from "react";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { cn } from "../../utils/cn";

type AdminTabsProps = {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
};

export function AdminTabs({ tabs, activeTab, onChange }: AdminTabsProps) {
  return (
    <div className="mb-4 flex min-w-0 flex-wrap gap-1 border-b border-slate-300">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium transition sm:px-4",
            activeTab === tab.id
              ? "border-b-2 border-[#3476ef] text-[#3476ef]"
              : "text-slate-600 hover:text-slate-800"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AdminPanelHeader({
  title,
  color = "purple",
}: {
  title: string;
  color?: "purple" | "green" | "orange" | "red" | "brand";
}) {
  const colors = {
    purple: "bg-[#3476ef]",
    green: "bg-[#89c64c]",
    orange: "bg-[#e8913a]",
    red: "bg-red-600",
    brand: "bg-[#7D5DA7]",
  };
  return (
    <div className={cn("px-4 py-2 text-sm font-semibold text-white", colors[color])}>
      {title}
    </div>
  );
}

type FilterConfig = {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

export type SortDirection = "asc" | "desc";

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Hide column below this breakpoint (table still scrolls on smaller screens). */
  hideBelow?: "md" | "lg" | "xl";
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

const hideBelowClass: Record<NonNullable<AdminTableColumn<unknown>["hideBelow"]>, string> = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

type AdminPanelTableProps<T> = {
  title: string;
  showHeader?: boolean;
  headerColor?: "purple" | "green" | "orange" | "red" | "brand";
  data: T[];
  columns: AdminTableColumn<T>[];
  search: string;
  onSearchChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  page: number;
  onPageChange: (page: number) => void;
  filters?: FilterConfig[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  toolbarExtra?: ReactNode;
  sortKey?: string;
  sortDir?: SortDirection;
  onSortChange?: (key: string) => void;
  getRowKey?: (row: T, index: number) => string;
  /** Defaults to [5, 10, 25, 50]. Use -1 for “All”. */
  pageSizeChoices?: number[];
};

export function AdminPanelTable<T>({
  title,
  showHeader = true,
  headerColor = "purple",
  data,
  columns,
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  page,
  onPageChange,
  filters = [],
  emptyMessage = "No data available in table.",
  searchPlaceholder = "Search",
  toolbarExtra,
  sortKey,
  sortDir = "asc",
  onSortChange,
  getRowKey,
  pageSizeChoices = [5, 10, 25, 50],
}: AdminPanelTableProps<T>) {
  const filtered = data.filter((row) => {
    if (!search) return true;
    return JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
  });

  const sorted = (() => {
    if (!sortKey || !onSortChange) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  })();

  const total = sorted.length;
  const effectivePageSize = pageSize < 0 ? total || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * effectivePageSize;
  const pageData = sorted.slice(start, start + effectivePageSize);

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(key);
  };

  return (
    <div className="min-w-0 max-w-full rounded-sm border border-slate-300 bg-white shadow-sm">
      {showHeader && title ? <AdminPanelHeader title={title} color={headerColor} /> : null}
      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <label className="flex min-w-0 items-center gap-2 text-slate-600">
          Show
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="max-w-full rounded border border-slate-300 bg-white px-2 py-1"
          >
            {pageSizeChoices.map((n) => (
              <option key={n} value={n}>
                {n < 0 ? "All" : n}
              </option>
            ))}
          </select>
          entries
        </label>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onPageChange(1);
          }}
          placeholder={searchPlaceholder}
          className="min-w-0 w-full rounded border border-slate-300 px-3 py-1 sm:max-w-xs lg:flex-1"
        />
        {filters.map((f) => (
          <label
            key={f.id}
            className="flex min-w-0 flex-col gap-1 text-slate-600 sm:flex-row sm:items-center sm:gap-2"
          >
            <span className="shrink-0">{f.label}</span>
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="min-w-0 w-full rounded border border-slate-300 bg-white px-2 py-1 sm:w-auto"
            >
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {toolbarExtra}
      </div>
      <div className="overflow-x-auto overscroll-x-contain lg:overflow-x-visible">
        {pageData.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
        ) : (
          <table className="w-full min-w-0 text-left text-sm lg:min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-white text-slate-600">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 font-medium sm:px-4",
                      col.hideBelow && hideBelowClass[col.hideBelow],
                      col.className
                    )}
                  >
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.header}
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <FaSortUp className="text-[10px]" />
                          ) : (
                            <FaSortDown className="text-[10px]" />
                          )
                        ) : (
                          <FaSort className="text-[10px] text-slate-300" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, i) => (
                <tr
                  key={getRowKey ? getRowKey(row, i) : i}
                  className="group border-b border-slate-100 hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "max-w-[14rem] px-3 py-2.5 align-top text-slate-700 sm:px-4 xl:max-w-none",
                        col.hideBelow && hideBelowClass[col.hideBelow],
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 border-t border-slate-200 px-3 py-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                "rounded border px-3 py-1",
                p === safePage
                  ? "border-[#3476ef] bg-[#3476ef] text-white"
                  : "border-slate-300"
              )}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
        <span className="shrink-0 text-xs sm:text-sm">
          Showing {total === 0 ? 0 : start + 1} to {Math.min(start + effectivePageSize, total)} of{" "}
          {total}{" "}
          entries
        </span>
      </div>
    </div>
  );
}
