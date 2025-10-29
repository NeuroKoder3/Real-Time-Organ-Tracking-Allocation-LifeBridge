import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  User,
  Plus,
  Search,
  Calendar,
  Heart,
  Edit,
  Trash2,
  Activity,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import api from "@/lib/api";
import type { Recipient } from "@shared/schema";


type UiRecipient = {
  id: string;
  unosId?: string;
  firstName?: string;
  lastName?: string;
  bloodType: string;
  organNeeded: string;
  urgencyStatus: string;
  waitlistDate?: string;
  location?: string;
  hospital?: string;
  hospitalId?: string;
  status: string;
  medicalConditions?: string;
  compatibilityScore?: number;
};

function mapRecipient(r: Recipient): UiRecipient {
  const medicalData = (r.medicalData || {}) as any;

  return {
    id: r.id,
    unosId: r.unosId ?? undefined,
    firstName: r.firstName ?? "",
    lastName: r.lastName ?? "",
    bloodType: r.bloodType,
    organNeeded: r.organNeeded,
    urgencyStatus: r.urgencyStatus,
    waitlistDate: r.waitlistDate?.toString(),
    location: r.location ?? "",
    hospital: r.hospital ?? "",
    hospitalId: r.hospitalId ?? "",
    status: r.status,
    medicalConditions: Array.isArray(medicalData?.conditions)
      ? medicalData.conditions.join(", ")
      : typeof medicalData?.conditions === "string"
      ? medicalData.conditions
      : undefined,
    compatibilityScore: medicalData?.compatibilityScore,
  };
}

// ----------------------------
// Main Page Component
// ----------------------------
export default function Recipients() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<UiRecipient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");

  const [formData, setFormData] = useState({
    unosId: "",
    firstName: "",
    lastName: "",
    bloodType: "",
    organNeeded: "",
    urgencyStatus: "routine",
    waitlistDate: new Date().toISOString().slice(0, 16),
    location: "",
    hospital: "",
    hospitalId: "",
    status: "waiting",
  });

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["recipients"],
    queryFn: async () => {
      const data = await api<Recipient[]>("/recipients");
      return Array.isArray(data) ? data.map(mapRecipient) : [];
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        waitlistDate: new Date(data.waitlistDate!).toISOString(),
      };
      return await api("/recipients", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      toast({ title: "Recipient Added", description: "New recipient added successfully." });
      setIsAddDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        waitlistDate: new Date(data.waitlistDate!).toISOString(),
      };
      return await api(`/recipients/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      toast({ title: "Recipient Updated", description: "Recipient info updated." });
      setIsAddDialogOpen(false);
      setEditingRecipient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api(`/recipients/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
      toast({ title: "Recipient Removed", description: "Recipient removed from waitlist." });
    },
  });

  const handleEdit = (recipient: UiRecipient) => {
    setEditingRecipient(recipient);
    setFormData({
      unosId: recipient.unosId || "",
      firstName: recipient.firstName || "",
      lastName: recipient.lastName || "",
      bloodType: recipient.bloodType,
      organNeeded: recipient.organNeeded,
      urgencyStatus: recipient.urgencyStatus,
      waitlistDate: recipient.waitlistDate
        ? new Date(recipient.waitlistDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      location: recipient.location || "",
      hospital: recipient.hospital || "",
      hospitalId: recipient.hospitalId || "",
      status: recipient.status,
    });
    setIsAddDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this recipient from the waitlist?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (editingRecipient) {
      updateMutation.mutate({ id: editingRecipient.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredRecipients = recipients.filter((r: UiRecipient) => {
    const matchesSearch =
      `${r.firstName ?? ""} ${r.lastName ?? ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unosId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.hospital ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    const matchesUrgency = filterUrgency === "all" || r.urgencyStatus === filterUrgency;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipient Waitlist</h1>
          <p className="text-muted-foreground">
            Manage organ recipients and compatibility profiles
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRecipient(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recipient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRecipient ? "Edit Recipient" : "Add New Recipient"}</DialogTitle>
              <DialogDescription>
                {editingRecipient
                  ? "Update recipient information"
                  : "Enter recipient details for the waitlist"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Input
                placeholder="UNOS ID"
                value={formData.unosId}
                onChange={(e) => setFormData({ ...formData, unosId: e.target.value })}
              />
              <Input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <Input
                placeholder="Blood Type"
                value={formData.bloodType}
                onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              />
              <Input
                placeholder="Organ Needed"
                value={formData.organNeeded}
                onChange={(e) => setFormData({ ...formData, organNeeded: e.target.value })}
              />
              <Select
                value={formData.urgencyStatus}
                onValueChange={(v) => setFormData({ ...formData, urgencyStatus: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Urgency Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="datetime-local"
                value={formData.waitlistDate}
                onChange={(e) => setFormData({ ...formData, waitlistDate: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Input
                placeholder="Hospital"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              />
              <Input
                placeholder="Hospital ID"
                value={formData.hospitalId}
                onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
              />
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                </SelectContent>
              </Select>

              <Button className="w-full mt-2" onClick={handleSubmit}>
                {editingRecipient ? "Update Recipient" : "Add Recipient"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search and Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, UNOS ID, or hospital..."
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUrgency} onValueChange={setFilterUrgency}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipients.map((recipient) => (
          <Card key={recipient.id} className="hover-elevate">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">
                    {recipient.firstName} {recipient.lastName}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    recipient.urgencyStatus === "critical"
                      ? "destructive"
                      : recipient.urgencyStatus === "urgent"
                      ? "secondary"
                      : "default"
                  }>
                    {recipient.urgencyStatus}
                  </Badge>
                  <Badge variant={
                    recipient.status === "matched"
                      ? "secondary"
                      : recipient.status === "inactive"
                      ? "outline"
                      : "default"
                  }>
                    {recipient.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">UNOS ID</p>
                  <p className="font-medium font-mono">{recipient.unosId ?? "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Blood Type</p>
                  <Badge variant="outline">{recipient.bloodType}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Organ Needed</p>
                  <p className="font-medium flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {recipient.organNeeded}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wait List Date</p>
                  <p className="font-medium">
                    {recipient.waitlistDate
                      ? format(new Date(recipient.waitlistDate), "MMM dd, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Location: {recipient.location ?? "Unknown"}
                </span>
                <span>Hospital: {recipient.hospital ?? "Unknown"}</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(recipient)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(recipient.id)}>
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
