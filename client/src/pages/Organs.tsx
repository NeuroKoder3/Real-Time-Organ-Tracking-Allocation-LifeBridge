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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Clock, MapPin, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { Organ } from "@shared/schema";

const API_BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

// ---------- helpers ----------
async function getCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/api/csrf-token`, { credentials: "include" });
    const data = await res.json();
    return data?.csrfToken;
  } catch {
    return undefined;
  }
}

function getAuthToken() {
  return localStorage.getItem("token");
}

// ---------- Card ----------
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
  const [urgency, setUrgency] = useState<"normal" | "warning" | "critical">("normal");

  useEffect(() => {
    const tick = () => {
      if (!organ.preservationStartTime) return;
      const start = new Date(organ.preservationStartTime).getTime();
      const elapsed = (Date.now() - start) / 36e5;
      const remaining = organ.viabilityHours - elapsed;
      if (remaining <= 0) {
        setUrgency("critical");
        setTimeRemaining("EXPIRED");
      } else if (remaining < 2) {
        setUrgency("critical");
        setTimeRemaining(`${Math.floor(remaining)}h ${Math.floor((remaining % 1) * 60)}m`);
      } else if (remaining < 4) {
        setUrgency("warning");
        setTimeRemaining(`${Math.floor(remaining)}h ${Math.floor((remaining % 1) * 60)}m`);
      } else {
        setUrgency("normal");
        setTimeRemaining(`${Math.floor(remaining)}h`);
      }
    };
    tick();
    const i = setInterval(tick, 60000);
    return () => clearInterval(i);
  }, [organ]);

  const progress =
    organ.preservationStartTime
      ? Math.max(
          0,
          Math.min(
            100,
            ((organ.viabilityHours -
              (Date.now() - new Date(organ.preservationStartTime).getTime()) / 36e5) /
              organ.viabilityHours) *
              100
          )
        )
      : 100;

  const badgeColor =
    urgency === "critical" ? "destructive" : urgency === "warning" ? "secondary" : "default";

  return (
    <Card>
      <CardHeader className="pb-3 flex justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{organ.organType}</CardTitle>
        </div>
        <Badge variant={badgeColor}>
          <Clock className="h-3 w-3 mr-1" />
          {timeRemaining}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Progress value={progress} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-muted-foreground">Donor</p>
            <p className="font-mono">{organ.donorId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant="outline">{organ.status}</Badge>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{organ.currentLocation ?? "Unknown"}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline" onClick={() => onEdit(organ)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(organ.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- main ----------
export default function Organs() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Organ | null>(null);
  const [form, setForm] = useState({
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
    queryKey: ["organs"],
    queryFn: async () => {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/organs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load organs");
      return res.json();
    },
  });

  const createMutation = useMutation<
    any, // you can replace `any` with a more specific type if you have one
    Error,
    typeof form
  >({
    mutationFn: async (data) => {
      const token = getAuthToken();
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE}/api/organs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          preservationStartTime: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organs"] });
      toast({ title: "Organ Added", description: "Organ successfully added." });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation<
    any, // again, replace with correct return type if known
    Error,
    { id: string } & Partial<typeof form>
  >({
    mutationFn: async ({ id, ...data }) => {
      const token = getAuthToken();
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE}/api/organs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organs"] });
      toast({ title: "Updated", description: "Organ updated successfully." });
      setEditing(null);
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation<any, Error, string>({
    mutationFn: async (id) => {
      const token = getAuthToken();
      const csrf = await getCsrfToken();
      const res = await fetch(`${API_BASE}/api/organs/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organs"] });
      toast({ title: "Removed", description: "Organ removed from inventory." });
    },
  });

  function resetForm() {
    setForm({
      organType: "",
      bloodType: "",
      donorId: "",
      currentLocation: "",
      viabilityHours: 24,
      hlaMarkers: "",
      specialRequirements: "",
      status: "available",
    });
  }

  function handleSubmit() {
    if (editing) {
      updateMutation.mutate({ id: editing.id, ...(form as any) });
    } else {
      createMutation.mutate(form);
    }
  }

  function handleEdit(organ: Organ) {
    setForm({
      organType: organ.organType,
      bloodType: organ.bloodType,
      donorId: organ.donorId,
      currentLocation: organ.currentLocation ?? "",
      viabilityHours: organ.viabilityHours,
      hlaMarkers: (organ as any).hlaMarkers ?? "",
      specialRequirements: (organ as any).specialRequirements ?? "",
      status: organ.status,
    });
    setEditing(organ);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("Delete this organ?")) deleteMutation.mutate(id);
  }

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Organ Inventory</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/organs/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Register Organ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {organs.map((organ) => (
          <OrganCard key={organ.id} organ={organ} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Organ" : "Add Organ"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update organ details" : "Enter details to add a new organ."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {[
              ["Organ Type", "organType"],
              ["Blood Type", "bloodType"],
              ["Donor ID", "donorId"],
              ["Current Location", "currentLocation"],
              ["Viability Hours", "viabilityHours"],
              ["HLA Markers", "hlaMarkers"],
              ["Special Requirements", "specialRequirements"],
            ].map(([label, key]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type={key === "viabilityHours" ? "number" : "text"}
                  value={(form as any)[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [key]:
                        key === "viabilityHours"
                          ? parseInt(e.target.value, 10) || 0
                          : e.target.value,
                    })
                  }
                />
              </div>
            ))}
            <Button className="w-full mt-4" onClick={handleSubmit}>
              {editing ? "Update Organ" : "Add Organ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
