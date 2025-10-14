// src/components/reports/ExportCSVButton.tsx
import Papa from "papaparse";
import { Button } from "@/components/ui/button";

const mockData = [
  { Date: "2025-10-01", Organs: 5, Recipients: 4 },
  { Date: "2025-10-02", Organs: 3, Recipients: 3 },
];

export default function ExportCSVButton() {
  const handleExport = () => {
    const csv = Papa.unparse(mockData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "lifebridge-report.csv";
    link.click();
  };

  return <Button onClick={handleExport}>📄 Export CSV</Button>;
}
