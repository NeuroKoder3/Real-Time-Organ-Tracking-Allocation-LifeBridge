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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Recipient as DbRecipient } from "@shared/schema";

// ----------------------------
// Local types
// ----------------------------
type MedicalData = {
  conditions?: string[] | string;
  compatibilityScore?: number;
};

type UiRecipient = {
  id: string;
  name: string;
  medicalId?: string;
  bloodType: string;
  organNeeded: string;
  urgencyLevel: string;
  waitListDate?: string;
  hospital?: string;
  hlaMarkers?: string;
  medicalConditions?: string;
  compatibilityScore?: number;
  status: string;
};

// ----------------------------
// Map DB → UI recipient
// ----------------------------
function mapRecipient(r: DbRecipient): UiRecipient {
  const medicalData = (r.medicalData || {}) as MedicalData;

  let medicalConditions: string | undefined;
  if (Array.isArray(medicalData.conditions)) {
    medicalConditions = medicalData.conditions.join(", ");
  } else if (typeof medicalData.conditions === "string") {
    medicalConditions = medicalData.conditions;
  }

  return {
    id: r.id,
    name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Unnamed",
    medicalId: r.unosId ?? undefined,
    bloodType: r.bloodType,
    organNeeded: r.organNeeded,
    urgencyLevel: r.urgencyStatus,
    waitListDate: r.waitlistDate?.toString(),
    hospital: r.hospitalId ?? undefined,
    hlaMarkers: r.hlaType ? JSON.stringify(r.hlaType) : undefined,
    medicalConditions,
    compatibilityScore: medicalData.compatibilityScore,
    status: r.status,
  };
}

// ----------------------------
// Recipient Card Component
// ----------------------------
function RecipientCard({
  recipient,
  onEdit,
  onDelete,
}: {
  recipient: UiRecipient;
  onEdit: (recipient: UiRecipient) => void;
  onDelete: (id: string) => void;
}) {
  const urgencyColors: Record<string, "default" | "secondary" | "destructive"> = {
    critical: "destructive",
    urgent: "secondary",
    routine: "default",
  };

  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    inactive: "outline",
    matched: "secondary",
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{recipient.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={urgencyColors[recipient.urgencyLevel] ?? "default"}>
              {recipient.urgencyLevel}
            </Badge>
            <Badge variant={statusColors[recipient.status] ?? "outline"}>
              {recipient.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Medical ID</p>
            <p className="font-medium font-mono">{recipient.medicalId ?? "N/A"}</p>
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
            <p className="text-muted-foreground">Wait Time</p>
            <p className="font-medium">
              {recipient.waitListDate
                ? `${Math.floor(
                    (Date.now() - new Date(recipient.waitListDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )} days`
                : "N/A"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Compatibility Score</span>
            <span className="font-medium">{recipient.compatibilityScore ?? 0}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${recipient.compatibilityScore ?? 0}%` }}
            />
          </div>
        </div>

        {recipient.medicalConditions && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground flex items-start gap-1">
              <Activity className="h-3 w-3 mt-0.5" />
              <span>{recipient.medicalConditions}</span>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Listed:{" "}
            {recipient.waitListDate
              ? format(new Date(recipient.waitListDate), "MMM dd, yyyy")
              : "N/A"}
          </span>
          <span>{recipient.hospital ?? "Unknown"}</span>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(recipient)}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(recipient.id)}>
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
          <Button size="sm" className="ml-auto" disabled={recipient.status === "matched"}>
            Find Match
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["/api/recipients"],
    queryFn: async () => {
      const data = await api<DbRecipient[]>("/api/recipients");
      return data.map(mapRecipient);
    },
  });

  const handleEdit = (recipient: UiRecipient) => {
    setEditingRecipient(recipient);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this recipient from the waitlist?")) {
      toast({ title: "Recipient Removed", description: `Recipient ${id} removed.` });
    }
  };

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient.medicalId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient.hospital ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || recipient.status === filterStatus;
    const matchesUrgency = filterUrgency === "all" || recipient.urgencyLevel === filterUrgency;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recipient Waitlist</h1>
          <p className="text-muted-foreground">
            Manage organ recipients and their medical compatibility profiles
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
              <DialogTitle>
                {editingRecipient ? "Edit Recipient" : "Add New Recipient"}
              </DialogTitle>
              <DialogDescription>
                {editingRecipient
                  ? "Update recipient information"
                  : "Enter recipient details for the waitlist"}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
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
              placeholder="Search by name, medical ID, or hospital..."
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
                <SelectItem value="active">Active</SelectItem>
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
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Critical Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {recipients.filter((r) => r.urgencyLevel === "critical").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Active Waiting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {recipients.filter((r) => r.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {recipients.filter((r) => r.status === "matched").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipient Cards */}
      {filteredRecipients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">No recipients found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterStatus !== "all" || filterUrgency !== "all"
                ? "Try adjusting your filters"
                : "Add your first recipient to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipients.map((recipient) => (
            <RecipientCard
              key={recipient.id}
              recipient={recipient}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
