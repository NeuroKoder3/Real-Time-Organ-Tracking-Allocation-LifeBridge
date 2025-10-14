// src/pages/Reports.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OrgansChart from "@/components/reports/OrgansChart";
import RecipientsChart from "@/components/reports/RecipientsChart";
import ExportCSVButton from "@/components/reports/ExportCSVButton";
import ExportPDFButton from "@/components/reports/ExportPDFButton";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <OrgansChart />
          <RecipientsChart />
          <div className="flex gap-4">
            <ExportCSVButton />
            <ExportPDFButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
