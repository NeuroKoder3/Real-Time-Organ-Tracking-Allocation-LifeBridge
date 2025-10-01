import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Heart, Plus, Clock, MapPin, Edit, Trash2, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Organ } from "@shared/schema";
import { api } from "@/lib/api";

type UrgencyLevel = "critical" | "warning" | "normal";
type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

function OrganCard({
  organ,
  onEdit,
  onDelete,
}: {
  organ: Organ;
  onEdit: (organ: Organ) => void;
  onDelete: (id: string) => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel>("normal");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!organ.preservationStartTime) return;

      const start = new Date(organ.preservationStartTime).getTime();
      const now = Date.now();
      const elapsed = (now - start) / (1000 * 60 * 60);
      const remaining = organ.viabilityHours - elapsed;

      if (remaining <= 0) {
        setTimeRemaining("EXPIRED");
        setUrgencyLevel("critical");
      } else if (remaining < 2) {
        setTimeRemaining(`${Math.floor(remaining)}h ${Math.floor((remaining % 1) * 60)}m`);
        setUrgencyLevel("critical");
      } else if (remaining < 4) {
        setTimeRemaining(`${Math.floor(remaining)}h ${Math.floor((remaining % 1) * 60)}m`);
        setUrgencyLevel("warning");
      } else {
        setTimeRemaining(`${Math.floor(remaining)}h`);
        setUrgencyLevel("normal");
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);
    return () => clearInterval(interval);
  }, [organ.preservationStartTime, organ.viabilityHours]);

  const progressPercentage = organ.preservationStartTime
    ? Math.max(
        0,
        Math.min(
          100,
          ((organ.viabilityHours -
            (Date.now() - new Date(organ.preservationStartTime).getTime()) / (1000 * 60 * 60)) /
            organ.viabilityHours) *
            100
        )
      )
    : 100;

  // ✅ Strictly type urgency colors
  const urgencyColors: Record<UrgencyLevel, BadgeVariant> = {
    critical: "destructive",
    warning: "secondary",
    normal: "default",
  };

  // ✅ Status → Badge variant
  const statusColors: Record<string, BadgeVariant> = {
    available: "default",
    allocated: "secondary",
    discarded: "outline",
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{organ.organType}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={urgencyColors[urgencyLevel]}>
              <Clock className="h-3 w-3 mr-1" />
              {timeRemaining}
            </Badge>
            <Badge variant="outline">{organ.bloodType}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="h-2" />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Donor ID</p>
            <p className="font-medium font-mono">{organ.donorId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant={statusColors[organ.status] ?? "outline"}>{organ.status}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">{organ.currentLocation || "Unknown"}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">HLA Markers</p>
            <p className="font-medium">
              {"hlaMarkers" in organ && (organ as any).hlaMarkers
                ? (organ as any).hlaMarkers
                : "Pending"}
            </p>
          </div>
        </div>

        {"specialRequirements" in organ && (organ as any).specialRequirements && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {(organ as any).specialRequirements}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onEdit(organ)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(organ.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
          <Button size="sm" className="ml-auto" disabled={organ.status !== "available"}>
            Allocate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Organs() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingOrgan, setEditingOrgan] = useState<Organ | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBloodType, setFilterBloodType] = useState<string>("all");

  const [formData, setFormData] = useState({
    organType: "",
    bloodType: "",
    donorId: "",
    currentLocation: "",
    viabilityHours: 24,
    hlaMarkers: "",
    specialRequirements: "",
    status: "available",
  });

  const { data: organs = [], isLoading } = useQuery<Organ[]>({
    queryKey: ["/api/organs"],
    queryFn: () => api<Organ[]>("/api/organs"),
  });

  const createOrganMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api("/api/organs", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          preservationStartTime: new Date().toISOString(),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organs"] });
      toast({
        title: "Organ Added",
        description: "The organ has been successfully added to inventory.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const updateOrganMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Organ> & { id: string }) =>
      api(`/api/organs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organs"] });
      toast({ title: "Organ Updated", description: "The organ information has been updated." });
      setEditingOrgan(null);
      resetForm();
    },
  });

  const deleteOrganMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/organs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organs"] });
      toast({ title: "Organ Removed", description: "The organ has been removed from inventory." });
    },
  });

  const resetForm = () => {
    setFormData({
      organType: "",
      bloodType: "",
      donorId: "",
      currentLocation: "",
      viabilityHours: 24,
      hlaMarkers: "",
      specialRequirements: "",
      status: "available",
    });
  };

  const handleSubmit = () => {
    if (editingOrgan) {
      updateOrganMutation.mutate({
        id: editingOrgan.id,
        ...formData,
      });
    } else {
      createOrganMutation.mutate(formData);
    }
  };

  const handleEdit = (organ: Organ) => {
    setFormData({
      organType: organ.organType,
      bloodType: organ.bloodType,
      donorId: organ.donorId,
      currentLocation: organ.currentLocation || "",
      viabilityHours: organ.viabilityHours,
      hlaMarkers: "hlaMarkers" in organ ? (organ as any).hlaMarkers || "" : "",
      specialRequirements:
        "specialRequirements" in organ ? (organ as any).specialRequirements || "" : "",
      status: organ.status,
    });
    setEditingOrgan(organ);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this organ from inventory?")) {
      deleteOrganMutation.mutate(id);
    }
  };

  const filteredOrgans = organs.filter((organ) => {
    const matchesSearch =
      organ.organType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organ.donorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (organ.currentLocation?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || organ.status === filterStatus;
    const matchesBloodType = filterBloodType === "all" || organ.bloodType === filterBloodType;

    return matchesSearch && matchesStatus && matchesBloodType;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add/Edit Organ dialog */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organ Inventory</h1>
          <p className="text-muted-foreground">
            Manage organ inventory with real-time viability tracking
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="button-add-organ"
              onClick={() => {
                resetForm();
                setEditingOrgan(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Organ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOrgan ? "Edit Organ" : "Add New Organ"}</DialogTitle>
              <DialogDescription>
                {editingOrgan
                  ? "Update organ information"
                  : "Enter organ details for inventory tracking"}
              </DialogDescription>
            </DialogHeader>
            {/* Form fields go here */}
            <Button onClick={handleSubmit} className="w-full mt-4">
              {editingOrgan ? "Update Organ" : "Add Organ"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Organs list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrgans.map((organ) => (
          <OrganCard key={organ.id} organ={organ} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
