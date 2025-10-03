import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Heart,
  Plus,
  Search,
  Link2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient"; // ✅ FIXED: default import
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Allocation, Organ, Recipient } from "@shared/schema";
import { api } from "@/lib/api";

interface AllocationWithDetails extends Allocation {
  organ?: Organ;
  recipient?: Recipient;
}

function AllocationCard({
  allocation,
  onAccept,
  onDecline,
}: {
  allocation: AllocationWithDetails;
  onAccept: (id: string) => void;
  onDecline: (id: string, reason: string) => void;
}) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const statusColors = {
    proposed: "secondary",
    accepted: "default",
    declined: "destructive",
    completed: "default",
  };

  const statusIcons = {
    proposed: <Clock className="h-3 w-3" />,
    accepted: <CheckCircle className="h-3 w-3" />,
    declined: <XCircle className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
  };

  const handleDeclineSubmit = () => {
    onDecline(allocation.id, declineReason);
    setShowDeclineDialog(false);
    setDeclineReason("");
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Allocation #{allocation.id.slice(-6)}
          </CardTitle>
          <Badge
            variant={
              statusColors[
                allocation.status as keyof typeof statusColors
              ] as "default" | "secondary" | "destructive"
            }
          >
            {statusIcons[allocation.status as keyof typeof statusIcons]}
            {allocation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Organ + Recipient cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Organ Details
            </p>
            {allocation.organ ? (
              <>
                <p className="text-sm">{allocation.organ.organType}</p>
                <p className="text-xs text-muted-foreground">
                  Blood Type: {allocation.organ.bloodType}
                </p>
                <p className="text-xs text-muted-foreground">
                  Location: {allocation.organ.currentLocation}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Loading organ details...
              </p>
            )}
          </div>

          <div className="space-y-2 p-3 bg-muted/50 rounded-md">
            <p className="text-sm font-medium flex items-center gap-1">
              <User className="h-3 w-3" />
              Recipient Details
            </p>
            {allocation.recipient ? (
              <>
                <p className="text-sm">
                  {allocation.recipient.firstName} {allocation.recipient.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Blood Type: {allocation.recipient.bloodType}
                </p>
                <p className="text-xs text-muted-foreground">
                  Urgency: {allocation.recipient.urgencyStatus}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Loading recipient details...
              </p>
            )}
          </div>
        </div>

        {/* Match Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match Score</span>
            <span className="font-medium">{allocation.matchScore}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${allocation.matchScore}%` }}
            />
          </div>
        </div>

        {/* Proposed + priority */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>Priority: {allocation.priority}</span>
          <span>
            Proposed:{" "}
            {format(
              new Date(allocation.proposedAt || Date.now()),
              "MMM dd, HH:mm"
            )}
          </span>
        </div>

        {/* Decline reason */}
        {allocation.declineReason && (
          <div className="p-2 bg-destructive/10 rounded-md">
            <p className="text-xs text-destructive flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5" />
              <span>{allocation.declineReason}</span>
            </p>
          </div>
        )}

        {/* Accept / Decline actions */}
        {allocation.status === "proposed" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onAccept(allocation.id)}
              data-testid={`button-accept-allocation-${allocation.id}`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Accept Match
            </Button>
            <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`button-decline-allocation-${allocation.id}`}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Decline Allocation</DialogTitle>
                  <DialogDescription>
                    Please provide a reason for declining this organ-recipient
                    match.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Decline</Label>
                    <Textarea
                      id="reason"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Enter reason..."
                      rows={3}
                      data-testid="input-decline-reason"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleDeclineSubmit}
                    disabled={!declineReason}
                    data-testid="button-submit-decline"
                  >
                    Submit Decline Reason
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Allocations() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    organId: "",
    recipientId: "",
    matchScore: 0,
    priority: 1,
  });

  const { data: allocations = [], isLoading } = useQuery({
    queryKey: ["/api/allocations"],
    queryFn: () => api<Allocation[]>("/api/allocations"),
  });

  const { data: organs = [] } = useQuery({
    queryKey: ["/api/organs"],
    queryFn: () => api<Organ[]>("/api/organs"),
  });

  const { data: recipients = [] } = useQuery({
    queryKey: ["/api/recipients"],
    queryFn: () => api<Recipient[]>("/api/recipients"),
  });

  const enhancedAllocations = allocations.map((allocation: Allocation) => ({
    ...allocation,
    organ: organs.find((o: Organ) => o.id === allocation.organId),
    recipient: recipients.find((r: Recipient) => r.id === allocation.recipientId),
  }));

  const createAllocationMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api("/api/allocations", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          compatibilityData: {},
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organs"] });
      toast({
        title: "Allocation Created",
        description: "The organ-recipient match has been proposed.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create allocation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const acceptAllocationMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/allocations/${id}/accept`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "Allocation Accepted",
        description: "The organ-recipient match has been accepted.",
      });
    },
  });

  const declineAllocationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api(`/api/allocations/${id}/decline`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allocations"] });
      toast({
        title: "Allocation Declined",
        description: "The organ-recipient match has been declined.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      organId: "",
      recipientId: "",
      matchScore: 0,
      priority: 1,
    });
  };

  const handleSubmit = () => {
    createAllocationMutation.mutate(formData);
  };

  const handleAccept = (id: string) => {
    acceptAllocationMutation.mutate(id);
  };

  const handleDecline = (id: string, reason: string) => {
    declineAllocationMutation.mutate({ id, reason });
  };

  const filteredAllocations = enhancedAllocations.filter(
    (allocation: AllocationWithDetails) => {
      const matchesSearch =
        allocation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allocation.organ?.organType
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        allocation.recipient?.firstName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        allocation.recipient?.lastName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || allocation.status === filterStatus;
      return matchesSearch && matchesStatus;
    }
  );

  const availableOrgans = organs.filter((o: Organ) => o.status === "available");
  const waitingRecipients = recipients.filter((r: Recipient) => r.status === "waiting");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Allocations</h1>
          <p className="text-muted-foreground">
            Manage and review proposed organ-recipient matches
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Allocation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Allocation</DialogTitle>
              <DialogDescription>
                Propose a new organ-recipient match
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Organ</Label>
                <Select
                  value={formData.organId}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, organId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organ" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgans.map((o: Organ) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.organType} (Blood {o.bloodType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipient</Label>
                <Select
                  value={formData.recipientId}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, recipientId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {waitingRecipients.map((r: Recipient) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.firstName} {r.lastName} (Blood {r.bloodType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Match Score (%)</Label>
                <Input
                  type="number"
                  value={formData.matchScore}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      matchScore: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      priority: parseInt(e.target.value, 10),
                    }))
                  }
                />
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Create Allocation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search allocations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Allocations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAllocations.map((allocation: AllocationWithDetails) => (
          <AllocationCard
            key={allocation.id}
            allocation={allocation}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </div>
    </div>
  );
}
