import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart,
  Clock,
  Plane,
  Users,
  AlertTriangle,
  CheckCircle,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import type { Organ, Recipient } from "@shared/schema";

const API_BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

interface Transport {
  id: string;
  organType: string;
  origin: string;
  destination: string;
  status: string;
  eta: string;
}

// ----------------------------
// Organ Viability Card
// ----------------------------
function OrganViabilityCard({ organ }: { organ: Organ }) {
  const totalHours = organ.viabilityHours;
  const elapsedHours = Math.floor(
    (Date.now() - new Date(organ.preservationStartTime).getTime()) / (1000 * 60 * 60)
  );
  const remainingHours = totalHours - elapsedHours;
  const progressPercentage = Math.max(0, Math.min(100, (remainingHours / totalHours) * 100));

  const urgencyColor: "default" | "secondary" | "destructive" =
    remainingHours < 2 ? "destructive" : remainingHours < 4 ? "secondary" : "default";

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{organ.organType}</CardTitle>
          </div>
          <Badge variant={urgencyColor}>{remainingHours}h remaining</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progressPercentage} className="h-2" />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Blood Type</p>
            <p className="font-medium">{organ.bloodType}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium">{organ.currentLocation ?? "Unknown"}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline" className="text-xs">
            {organ.status}
          </Badge>
          <Button size="sm" data-testid={`button-allocate-${organ.id}`}>
            Allocate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ----------------------------
// Transport Card
// ----------------------------
function TransportCard({ transport }: { transport: Transport }) {
  const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
    scheduled: "secondary",
    in_progress: "default",
    completed: "default",
    failed: "destructive",
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover-elevate">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Plane className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{transport.organType}</p>
          <p className="text-xs text-muted-foreground">
            {transport.origin} → {transport.destination}
          </p>
        </div>
      </div>
      <div className="text-right">
        <Badge variant={statusColors[transport.status] ?? "default"}>
          {transport.status}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">ETA: {transport.eta}</p>
      </div>
    </div>
  );
}

// ----------------------------
// Stats Card
// ----------------------------
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <span
              className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------
// Dashboard Page
// ----------------------------
export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth(); // ← using useAuth

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!user?.token) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-muted-foreground">You must log in to view this dashboard.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  const fetchWithAuth = async <T,>(url: string): Promise<T> => {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        localStorage.removeItem("lifebridge_user");
        navigate("/login");
      }
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }

    return res.json();
  };

  const { data: organs = [] } = useQuery<Organ[]>({
    queryKey: ["organs"],
    queryFn: () => fetchWithAuth("/api/organs"),
    refetchInterval: 30000,
    enabled: !!user.token,
  });

  const { data: transports = [] } = useQuery<Transport[]>({
    queryKey: ["transports"],
    queryFn: () => fetchWithAuth("/api/transports"),
    refetchInterval: 30000,
    enabled: !!user.token,
  });

  const { data: recipients = [] } = useQuery<Recipient[]>({
    queryKey: ["recipients"],
    queryFn: () => fetchWithAuth("/api/recipients"),
    enabled: !!user.token,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organ Tracking Dashboard</h1>
          <p className="text-muted-foreground">
            Real‑time monitoring of organ allocation and transportation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            data-testid="button-view-map"
            onClick={() => {
              navigate("/tracking");
            }}
          >
            <MapPin className="h-4 w-4 mr-2" />
            View Map
          </Button>
          <Button
            data-testid="button-new-organ"
            onClick={() => {
              navigate("/organs/new");
            }}
          >
            <Heart className="h-4 w-4 mr-2" />
            Register Organ
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Critical Alerts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {organs
              .filter((o) => {
                const elapsed =
                  (Date.now() - new Date(o.preservationStartTime).getTime()) / (1000 * 60 * 60);
                return o.viabilityHours - elapsed < 2;
              })
              .map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h‑4 w‑4 text‑destructive" />
                    <span className="text-sm">
                      {o.organType} at {o.currentLocation ?? "Unknown"} — Critical viability
                    </span>
                  </div>
                  <Button size="sm" variant="destructive">
                    Urgent Allocate
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Available Organs"
          value={organs.filter((o) => o.status === "available").length}
          description="Ready for allocation"
          icon={Heart}
          trend={{ value: 20, isPositive: true }}
        />
        <StatsCard
          title="Active Transports"
          value={transports.length}
          description="Currently in transit"
          icon={Plane}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Matched Recipients"
          value={recipients.filter((r) => r.status === "waiting").length}
          description="Awaiting transplant"
          icon={Users}
          trend={{ value: 10, isPositive: true }}
        />
        <StatsCard
          title="Success Rate"
          value="94%"
          description="Last 30 days"
          icon={CheckCircle}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Available Organs Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Organs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Organs ready for allocation with viability timers
              </p>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organs.map((organ) => (
              <OrganViabilityCard key={organ.id} organ={organ} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transports and Recipients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transports */}
        <Card>
          <CardHeader>
            <CardTitle>Active Transports</CardTitle>
            <p className="text-sm text-muted-foreground">Real‑time transport tracking</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {transports.map((t) => (
              <TransportCard key={t.id} transport={t} />
            ))}
          </CardContent>
        </Card>

        {/* Top Recipient Matches */}
        <Card>
          <CardHeader>
            <CardTitle>Top Recipient Matches</CardTitle>
            <p className="text-sm text-muted-foreground">Highest compatibility scores</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recipients.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex flex-col">
                    <p className="font-medium text-sm">
                      {r.firstName} {r.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{r.organNeeded ?? "Unknown Organ"}</span>
                      <span>•</span>
                      <span>{(r as any).hospital ?? "Unknown Hospital"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        r.urgencyStatus?.toLowerCase() === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {r.urgencyStatus ?? "Routine"}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-bold">{(r as any).matchScore ?? 0}%</p>
                      <p className="text-xs text-muted-foreground">match</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items‑center gap‑2">
            <Activity className="h‑4 w‑4" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items‑center gap‑3">
              <div className="w‑2 h‑2 bg‑green‑500 rounded‑full" />
              <span className="text‑muted‑foreground">2 min ago</span>
              <span>Heart successfully transplanted at Johns Hopkins</span>
            </div>
            <div className="flex items‑center gap‑3">
              <div className="w‑2 h‑2 bg‑blue‑500 rounded‑full" />
              <span className="text‑muted‑foreground">15 min ago</span>
              <span>New kidney registered from Mayo Clinic</span>
            </div>
            <div className="flex items‑center gap‑3">
              <div className="w‑2 h‑2 bg‑yellow‑500 rounded‑full" />
              <span className="text‑muted‑foreground">1 hour ago</span>
              <span>Transport initiated for liver to Cleveland Clinic</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
