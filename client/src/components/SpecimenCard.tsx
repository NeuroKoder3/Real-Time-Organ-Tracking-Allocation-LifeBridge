import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "./StatusBadge";
import QRCodeDisplay from "./QRCodeDisplay";
import { Package, MapPin, Calendar, Thermometer, Edit, History } from "lucide-react";
import { format } from "date-fns";

interface SpecimenCardProps {
  specimen: {
    id: string;
    uii: string;
    tissueType: string;
    status: string;
    currentLocation: string;
    storageConditions?: string | null;
    expirationDate?: Date | null;
    qualityScore?: string | null;
    processingNotes?: string | null;
    createdAt?: Date | null;
  };
  onEdit?: (specimenId: string) => void;
  onViewHistory?: (specimenId: string) => void;
}

export function SpecimenCard({ specimen, onEdit, onViewHistory }: SpecimenCardProps) {
  const getQualityBadgeVariant = (score?: string | null) => {
    switch (score) {
      case "A": return "default";
      case "B": return "secondary";
      case "C": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-4 w-4" />
              {specimen.tissueType.charAt(0).toUpperCase() + specimen.tissueType.slice(1)}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{specimen.uii}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={specimen.status} type="specimen" />
            {specimen.qualityScore && (
              <Badge variant={getQualityBadgeVariant(specimen.qualityScore) as "default" | "secondary" | "outline"}>
                Grade {specimen.qualityScore}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{specimen.currentLocation}</p>
              </div>
            </div>
            
            {specimen.storageConditions && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Storage</p>
                  <p className="font-medium">{specimen.storageConditions}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Recovered</p>
                <p className="font-medium">
                  {specimen.createdAt ? format(specimen.createdAt, "MMM dd, yyyy") : "Unknown"}
                </p>
              </div>
            </div>
            
            {specimen.expirationDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {format(specimen.expirationDate, "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {specimen.processingNotes && (
          <div className="pt-2 border-t">
            <p className="text-muted-foreground text-xs">Processing Notes</p>
            <p className="text-sm">{specimen.processingNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(specimen.id)}
              data-testid={`button-edit-specimen-${specimen.id}`}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewHistory?.(specimen.id)}
              data-testid={`button-view-history-${specimen.id}`}
            >
              <History className="h-3 w-3 mr-1" />
              History
            </Button>
          </div>
          
          <QRCodeDisplay
            value={specimen.uii}
            title="Specimen ID"
            size={80}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default SpecimenCard;
