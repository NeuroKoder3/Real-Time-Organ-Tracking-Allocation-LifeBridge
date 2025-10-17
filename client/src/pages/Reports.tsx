// src/pages/Reports.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import OrgansChart from "@/components/reports/OrgansChart";
import RecipientsChart from "@/components/reports/RecipientsChart";
import TransportsChart from "@/components/reports/TransportsChart";
import AllocationSuccessRate from "@/components/reports/AllocationSuccessRate";
import AuditLogsTable from "@/components/reports/AuditLogsTable";
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
          <TransportsChart />
          <AllocationSuccessRate />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogsTable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <ExportCSVButton />
          <ExportPDFButton />
        </CardContent>
      </Card>
    </div>
  );
}
