import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";
import QRCodeDisplay from "./QRCodeDisplay";
import { FileText, User, Edit } from "lucide-react";
import { format } from "date-fns";

export interface DonorCardProps {
  donor: {
    id: string;
    uii: string;
    firstName?: string | null;
    lastName?: string | null;
    dateOfBirth?: Date | null;
    eligibilityStatus: string;
    consentStatus: string;
    consentDocumentUrl?: string | null;
    createdAt?: Date | null;
  };
  onEdit?: (donorId: string) => void;
  onViewConsent?: (donorId: string) => void;
}

export function DonorCard({ donor, onEdit, onViewConsent }: DonorCardProps) {
  const donorName =
    donor.firstName && donor.lastName
      ? `${donor.firstName} ${donor.lastName}`
      : "Anonymous Donor";

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {donorName}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{donor.uii}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={donor.eligibilityStatus} type="donor" />
            <StatusBadge status={donor.consentStatus} type="consent" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-medium">
              {donor.dateOfBirth
                ? format(donor.dateOfBirth, "MMM dd, yyyy")
                : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Registration Date</p>
            <p className="font-medium">
              {donor.createdAt
                ? format(donor.createdAt, "MMM dd, yyyy")
                : "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(donor.id)}
              data-testid={`button-edit-donor-${donor.id}`}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {donor.consentDocumentUrl != null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewConsent?.(donor.id)}
                data-testid={`button-view-consent-${donor.id}`}
              >
                <FileText className="h-3 w-3 mr-1" />
                Consent
              </Button>
            )}
          </div>

          <QRCodeDisplay value={donor.uii} title="Donor ID" size={80} />
        </div>
      </CardContent>
    </Card>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default DonorCard;
