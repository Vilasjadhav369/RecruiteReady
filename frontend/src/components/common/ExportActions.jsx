import { Button } from "../ui/Button.jsx";
import { exportCsv } from "../../lib/exportCsv.js";

/** Print + CSV (rows currently loaded on this page). Hidden when printing. */
export default function ExportActions({ filename, columns, rows, className = "" }) {
  const disabled = !rows || rows.length === 0;
  return (
    <div className={`rr-no-print flex items-center gap-2 ${className}`}>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => exportCsv(filename, columns, rows)} title="Export the rows shown on this page as CSV">
        Export CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => window.print()} title="Print or save as PDF">
        Print / PDF
      </Button>
    </div>
  );
}
