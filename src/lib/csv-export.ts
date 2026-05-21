/**
 * Utilitário para exportação de dados em CSV.
 * Gera e faz download automático de um arquivo .csv no navegador.
 */

interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filename: string
) {
  if (data.length === 0) {
    alert("Nenhum dado para exportar.");
    return;
  }

  // Header
  const headerLine = columns.map((c) => `"${c.header}"`).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.accessor(row);
        if (val === null || val === undefined) return '""';
        if (typeof val === "number") return val.toString();
        // Escape double quotes
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = "\uFEFF" + [headerLine, ...rows].join("\n"); // BOM for Excel UTF-8
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
