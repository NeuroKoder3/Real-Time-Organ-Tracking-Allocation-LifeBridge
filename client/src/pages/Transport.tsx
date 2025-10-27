import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plane,
  Plus,
  Search,
  MapPin,
  Clock,
  Package,
  Navigation,
  Truck,
  Activity,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Transport, Organ, Allocation } from "@shared/schema";
import { api } from "@/lib/api";

interface TransportWithDetails extends Transport {
  organ?: Organ;
  allocation?: Allocation;
}

function TransportCard({
  transport,
  onUpdateStatus,
}: {
  transport: TransportWithDetails;
  onUpdateStatus: (id: string, status: string) => void;
}) {
  const statusColors = {
    scheduled: "secondary",
    in_progress: "default",
    completed: "default",
    failed: "destructive",
  };

  const modeIcons = {
    ground: <Truck className="h-3 w-3" />,
    charter_flight: <Plane className="h-3 w-3" />,
    commercial_flight: <Plane className="h-3 w-3" />,
    drone: <Navigation className="h-3 w-3" />,
    helicopter: <Activity className="h-3 w-3" />,
  };

  const calculateETA = () => {
    if (transport.actualDelivery) return "Delivered";
    if (transport.scheduledDelivery) {
      const eta = new Date(transport.scheduledDelivery);
      const now = new Date();
      if (eta < now) return "Delayed";
      const hours = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60 * 60));
      const minutes = Math.floor(((eta.getTime() - now.getTime()) % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return "Pending";
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {modeIcons[transport.transportMode as keyof typeof modeIcons] || (
              <Package className="h-3 w-3" />
            )}
            Transport #{transport.id.slice(-6)}
          </CardTitle>
          <Badge
            variant={
              statusColors[
                transport.status as keyof typeof statusColors
              ] as "default" | "secondary" | "destructive"
            }
          >
            {transport.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transport.organ && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-sm font-medium">{transport.organ.organType}</p>
            <p className="text-xs text-muted-foreground">
              Blood Type: {transport.organ.bloodType}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">From:</span> {transport.originLocation}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">To:</span> {transport.destinationLocation}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Mode</p>
            <p className="font-medium capitalize">{transport.transportMode.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ETA</p>
            <p className="font-medium">{calculateETA()}</p>
          </div>
          {transport.trackingNumber && (
            <div>
              <p className="text-muted-foreground">Tracking</p>
              <p className="font-medium font-mono text-xs">{transport.trackingNumber}</p>
            </div>
          )}
          {transport.costEstimate && (
            <div>
              <p className="text-muted-foreground">Cost</p>
              <p className="font-medium">${transport.costEstimate}</p>
            </div>
          )}
        </div>

        {transport.weatherImpact && (
          <div className="p-2 bg-yellow-500/10 rounded-md">
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              Weather: {transport.weatherImpact}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pickup: {format(new Date(transport.scheduledPickup ?? ""), "MMM dd, HH:mm")}

          </span>
          {transport.actualPickup && (
            <span>Actual: {format(new Date(transport.actualPickup), "HH:mm")}</span>
          )}
        </div>

        {transport.status !== "completed" && transport.status !== "failed" && (
          <div className="flex gap-2">
            {transport.status === "scheduled" && (
              <Button
                size="sm"
                onClick={() => onUpdateStatus(transport.id, "in_progress")}
                data-testid={`button-start-transport-${transport.id}`}
              >
                Start Transport
              </Button>
            )}
            {transport.status === "in_progress" && (
              <>
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(transport.id, "completed")}
                  data-testid={`button-complete-transport-${transport.id}`}
                >
                  Mark Delivered
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onUpdateStatus(transport.id, "failed")}
                  data-testid={`button-fail-transport-${transport.id}`}
                >
                  Report Issue
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TransportPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");

  const [formData, setFormData] = useState({
    organId: "",
    allocationId: "",
    transportMode: "ground",
    originLocation: "",
    destinationLocation: "",
    scheduledPickup: "",
    scheduledDelivery: "",
    trackingNumber: "",
    costEstimate: 0,
  });

  const { data: transports = [], isLoading } = useQuery({
    queryKey: ["/api/transports"],
    queryFn: () => api<Transport[]>("/api/transports"),
  });

  const { data: organs = [] } = useQuery({
    queryKey: ["/api/organs"],
    queryFn: () => api<Organ[]>("/api/organs"),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ["/api/allocations"],
    queryFn: () => api<Allocation[]>("/api/allocations"),
  });

  const enhancedTransports = transports.map((t) => ({
    ...t,
    organ: organs.find((o) => o.id === t.organId),
    allocation: allocations.find((a) => a.id === t.allocationId),
  }));

  const createTransportMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api("/api/transports", {
        method: "POST",
        body: JSON.stringify({ ...data, status: "scheduled" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transports"] });
      toast({
        title: "Transport Scheduled",
        description: "The organ transport has been successfully scheduled.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule transport. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTransportStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/api/transports/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transports"] });
      toast({
        title: "Status Updated",
        description: "Transport status updated successfully.",
      });
    },
  });

  const resetForm = () =>
    setFormData({
      organId: "",
      allocationId: "",
      transportMode: "ground",
      originLocation: "",
      destinationLocation: "",
      scheduledPickup: "",
      scheduledDelivery: "",
      trackingNumber: "",
      costEstimate: 0,
    });

  const handleSubmit = () => createTransportMutation.mutate(formData);
  const handleUpdateStatus = (id: string, status: string) =>
    updateTransportStatusMutation.mutate({ id, status });

  const filteredTransports = enhancedTransports.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.originLocation ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.destinationLocation ?? "").toLowerCase().includes(searchTerm.toLowerCase())

      t.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesMode = filterMode === "all" || t.transportMode === filterMode;
    return matchesSearch && matchesStatus && matchesMode;
  });

  if (isLoading)
    return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* ✅ Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transport Management</h1>
          <p className="text-muted-foreground">
            Manage, track, and update organ transportation logistics
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" /> Schedule Transport
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Transport</DialogTitle>
              <DialogDescription>
                Assign an organ to a transport route and define logistics.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Organ</Label>
                <Select
                  value={formData.organId}
                  onValueChange={(v) => setFormData((f) => ({ ...f, organId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Organ" />
                  </SelectTrigger>
                  <SelectContent>
                    {organs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.organType} (Blood {o.bloodType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Origin Location</Label>
                <Input
                  value={formData.originLocation}
                  onChange={(e) => setFormData({ ...formData, originLocation: e.target.value })}
                  placeholder="Enter origin hospital"
                />
              </div>
              <div>
                <Label>Destination Location</Label>
                <Input
                  value={formData.destinationLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, destinationLocation: e.target.value })
                  }
                  placeholder="Enter destination hospital"
                />
              </div>
              <Button className="w-full mt-2" onClick={handleSubmit}>
                Confirm Transport
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ Transport Cards */}
      {filteredTransports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plane className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No transports found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterStatus !== "all" || filterMode !== "all"
                ? "Try adjusting your filters."
                : "Schedule your first organ transport."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTransports.map((t) => (
            <TransportCard key={t.id} transport={t} onUpdateStatus={handleUpdateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}
