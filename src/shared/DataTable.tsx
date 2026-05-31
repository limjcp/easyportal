import type { ReactNode } from "react";
import { FaSort } from "react-icons/fa";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-2 font-medium">
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  <FaSort className="text-[10px] text-slate-300" />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-slate-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
