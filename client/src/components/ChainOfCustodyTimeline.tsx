import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Package, Truck, Building2, Clock } from "lucide-react";
import { format } from "date-fns";

interface CustodyEvent {
  id: string;
  action: string;
  performedBy: string;
  location: string;
  timestamp: Date;
  notes?: string;
  environmentalData?: {
    temperature?: number;
    humidity?: number;
  };
}

interface ChainOfCustodyTimelineProps {
  events: CustodyEvent[];
  specimenId: string;
}

export function ChainOfCustodyTimeline({ events, specimenId }: ChainOfCustodyTimelineProps) {
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "recovered":
        return Package;
      case "processed":
        return Building2;
      case "stored":
        return CheckCircle;
      case "transferred":
        return Truck;
      default:
        return Clock;
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "recovered":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "processed":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
      case "stored":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      case "transferred":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Chain of Custody
        </CardTitle>
        <p className="text-sm text-muted-foreground font-mono">{specimenId}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = getActionIcon(event.action);
            const isLast = index === events.length - 1;

            return (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getActionColor(event.action)}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  {!isLast && <div className="w-px h-8 bg-border mt-2" />}
                </div>
                
                <div className="flex-1 space-y-2 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        by {event.performedBy} at {event.location}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{format(event.timestamp, "MMM dd, yyyy")}</p>
                      <p className="text-muted-foreground">{format(event.timestamp, "h:mm a")}</p>
                    </div>
                  </div>
                  
                  {event.notes && (
                    <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
                      {event.notes}
                    </p>
                  )}
                  
                  {event.environmentalData && (
                    <div className="flex gap-2">
                      {event.environmentalData.temperature && (
                        <Badge variant="outline" className="text-xs">
                          Temp: {event.environmentalData.temperature}°C
                        </Badge>
                      )}
                      {event.environmentalData.humidity && (
                        <Badge variant="outline" className="text-xs">
                          Humidity: {event.environmentalData.humidity}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No custody events recorded</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default ChainOfCustodyTimeline;
