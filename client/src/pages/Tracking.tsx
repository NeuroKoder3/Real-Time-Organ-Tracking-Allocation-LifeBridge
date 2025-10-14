// src/pages/Tracking.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Plane } from "lucide-react";

type Transport = {
  id: string;
  organType: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
};

export default function Tracking() {
  const { data: transports = [] } = useQuery({
    queryKey: ["transports"],
    queryFn: async () => {
      const res = await fetch("/api/transports", { credentials: "include" });
      return res.json();
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organ Transport Tracking</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Active Transports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {transports.map((t: Transport) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plane className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t.organType}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.origin} → {t.destination}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm capitalize">{t.status}</span>
                <p className="text-xs text-muted-foreground mt-1">ETA: {t.eta}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
