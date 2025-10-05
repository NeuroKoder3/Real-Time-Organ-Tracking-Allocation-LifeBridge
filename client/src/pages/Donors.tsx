import { useState } from "react";
import { DonorCard } from "@/components/DonorCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Donor as APIDonor } from "@shared/schema";
import type { DonorCardProps } from "@/components/DonorCard";

// ---------------------------------------------------
// 🌐 API Helpers
// ---------------------------------------------------
const API_BASE = import.meta.env.VITE_API_URL ?? window.location.origin;

function getAuthToken() {
  return localStorage.getItem("token");
}

// Secure fetch wrapper with error handling and credentials
async function fetchWithAuth<T>(url: string): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

// ----------------------------
// UI Donor type (adapter layer)
// ----------------------------
type UiDonor = DonorCardProps["donor"];

// Map DB donor → UI donor (with safe fallbacks)
function mapDonor(donor: APIDonor): UiDonor {
  return {
    id: donor.id,
    uii: (donor as any).uii ?? donor.unosId ?? "",
    firstName: (donor as any).firstName ?? null,
    lastName: (donor as any).lastName ?? null,
    dateOfBirth: (donor as any).dateOfBirth ?? null,
    eligibilityStatus: (donor as any).eligibilityStatus ?? donor.status ?? "unknown",
    consentStatus: donor.consentStatus ?? "pending",
    consentDocumentUrl: (donor as any).consentDocumentUrl ?? undefined,
    createdAt: donor.createdAt ?? null,
  };
}

// ----------------------------
// Main Donors Page Component
// ----------------------------
export default function Donors() {
  const { toast } = useToast();

  // Query donors securely
  const {
    data: donors = [],
    isLoading,
    isError,
    error,
  } = useQuery<APIDonor[]>({
    queryKey: ["/api/donors"],
    queryFn: () => fetchWithAuth<APIDonor[]>("/api/donors"),
    refetchInterval: 60000, // refresh every 1 min
    onError: (err: any) => {
      toast({
        title: "Error Loading Donors",
        description: err?.message ?? "Unable to load donors from the server.",
        variant: "destructive",
      });
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading donors...
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-red-500">
        <p className="font-medium">Failed to load donor data.</p>
        <p className="text-sm text-muted-foreground mt-2">
          {(error as any)?.message || "Please refresh or try again later."}
        </p>
      </div>
    );
  }

  // Adapt API donors → UI donors
  const normalizedDonors: UiDonor[] = donors.map(mapDonor);

  // Apply search and filter
  const filteredDonors = normalizedDonors.filter((donor) => {
    const matchesSearch =
      donor.uii.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donor.firstName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donor.lastName ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || donor.eligibilityStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donor Management</h1>
          <p className="text-muted-foreground">
            Manage donor registrations, consent documentation, and eligibility status
          </p>
        </div>
        <Button
          onClick={() =>
            toast({
              title: "Feature Coming Soon",
              description: "Donor registration will be available in the next update.",
            })
          }
          data-testid="button-add-donor"
        >
          <Plus className="h-4 w-4 mr-2" />
          Register New Donor
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter Donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Search by name or UII..."
              className="flex-1"
              data-testid="input-search-donors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={filterStatus}
              onValueChange={setFilterStatus}
              data-testid="select-filter-status"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="ineligible">Ineligible</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              data-testid="button-filter"
              onClick={() =>
                toast({
                  title: "Filter Applied",
                  description: `Showing donors with status: ${filterStatus}`,
                })
              }
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Donors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDonors.length > 0 ? (
          filteredDonors.map((donor) => (
            <DonorCard
              key={donor.id}
              donor={donor}
              onEdit={(id) =>
                toast({
                  title: "Edit Feature Coming Soon",
                  description: `Editing donor ${id} will be available shortly.`,
                })
              }
              onViewConsent={(id) =>
                toast({
                  title: "Consent Document",
                  description: `Opening consent document for donor ${id}.`,
                })
              }
            />
          ))
        ) : (
          <p className="text-muted-foreground text-center col-span-full">
            No donors match your search or filter.
          </p>
        )}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button
          variant="outline"
          data-testid="button-load-more"
          onClick={() =>
            toast({
              title: "Pagination Coming Soon",
              description: "Additional donor records will load here soon.",
            })
          }
        >
          Load More Donors
        </Button>
      </div>
    </div>
  );
}
