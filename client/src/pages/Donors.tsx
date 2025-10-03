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
import { api } from "@/lib/api";
import type { Donor as APIDonor } from "@shared/schema";
import type { DonorCardProps } from "@/components/DonorCard";

// ----------------------------
// UI Donor type (adapter layer)
// ----------------------------
type UiDonor = DonorCardProps["donor"];

// Map DB donor → UI donor (with safe fallbacks for missing fields)
function mapDonor(donor: APIDonor): UiDonor {
  return {
    id: donor.id,
    uii: (donor as any).uii ?? donor.unosId ?? "",
    firstName: (donor as any).firstName ?? null,
    lastName: (donor as any).lastName ?? null,
    dateOfBirth: (donor as any).dateOfBirth ?? null,
    eligibilityStatus:
      (donor as any).eligibilityStatus ?? donor.status ?? "unknown",
    consentStatus: donor.consentStatus ?? "pending",
    consentDocumentUrl: (donor as any).consentDocumentUrl ?? undefined,
    createdAt: donor.createdAt ?? null,
  };
}

export default function Donors() {
  const { data: donors = [], isLoading } = useQuery<APIDonor[]>({
    queryKey: ["/api/donors"],
    queryFn: () => api<APIDonor[]>("/api/donors"),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading donors...
      </div>
    );
  }

  // Adapt API donors → UI donors
  const normalizedDonors: UiDonor[] = donors.map(mapDonor);

  // Apply filtering
  const filteredDonors = normalizedDonors.filter((donor) => {
    const matchesSearch =
      donor.uii.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donor.firstName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (donor.lastName ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || donor.eligibilityStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Donor Management</h1>
          <p className="text-muted-foreground">
            Manage donor registrations, consent documentation, and eligibility
            status
          </p>
        </div>
        <Button data-testid="button-add-donor">
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
            <Button variant="outline" data-testid="button-filter">
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
              onEdit={(id) => console.log(`Edit donor: ${id}`)}
              onViewConsent={(id) => console.log(`View consent: ${id}`)}
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
        <Button variant="outline" data-testid="button-load-more">
          Load More Donors
        </Button>
      </div>
    </div>
  );
}
