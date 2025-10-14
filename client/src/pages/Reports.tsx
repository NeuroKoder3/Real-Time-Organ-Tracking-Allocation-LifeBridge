// src/pages/Reports.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Charts and data exports coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
