import { DonorCard } from "@/components/DonorCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    // Not in schema → fall back to unosId
    uii: (donor as any).uii ?? donor.unosId ?? "",
    // Not in schema → fallback to null
    firstName: (donor as any).firstName ?? null,
    lastName: (donor as any).lastName ?? null,
    // Not in schema → fallback
    dateOfBirth: (donor as any).dateOfBirth ?? null,
    // Prefer eligibilityStatus if present, else fallback to donor.status
    eligibilityStatus:
      (donor as any).eligibilityStatus ?? donor.status ?? "unknown",
    consentStatus: donor.consentStatus,
    // Not in schema → fallback
    consentDocumentUrl: (donor as any).consentDocumentUrl ?? undefined,
    createdAt: donor.createdAt ?? null,
  };
}

export default function Donors() {
  const { data: donors = [], isLoading } = useQuery<APIDonor[]>({
    queryKey: ["/api/donors"],
    queryFn: () => api<APIDonor[]>("/api/donors"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading donors...
      </div>
    );
  }

  // Adapt API donors → UI donors
  const normalizedDonors: UiDonor[] = donors.map(mapDonor);

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
            Search Donors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, UII, or registration date..."
              className="flex-1"
              data-testid="input-search-donors"
            />
            <Button variant="outline" data-testid="button-filter">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button data-testid="button-search-donors">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Donors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {normalizedDonors.map((donor) => (
          <DonorCard
            key={donor.id}
            donor={donor}
            onEdit={(id) => console.log(`Edit donor: ${id}`)}
            onViewConsent={(id) => console.log(`View consent: ${id}`)}
          />
        ))}
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
