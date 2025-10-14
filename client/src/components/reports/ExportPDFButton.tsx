// src/components/reports/ExportPDFButton.tsx
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";

export default function ExportPDFButton() {
  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("LifeBridge Analytics Report", 20, 20);
    doc.setFontSize(12);
    doc.text("This is a mock report with demo data.", 20, 30);
    doc.save("lifebridge-report.pdf");
  };

  return <Button onClick={handleExport}>🧾 Export PDF</Button>;
}
