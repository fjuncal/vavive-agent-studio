import type { ReactNode } from "react";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({ columns, rows, emptyMessage }: { columns: Column<T>[]; rows: T[]; emptyMessage?: string }) {
  if (!rows.length) {
    return (
      <div className="card text-center py-10">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{emptyMessage || "Nenhum registro encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-primary">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b bg-bg-secondary/70" style={{ borderColor: "var(--color-border)" }}>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={`border-b px-4 py-2.5 text-xs font-semibold ${column.className || ""}`}
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="group transition-colors duration-150 hover:bg-bg-secondary"
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={`px-4 py-3.5 align-middle text-sm ${column.className || ""}`}
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
