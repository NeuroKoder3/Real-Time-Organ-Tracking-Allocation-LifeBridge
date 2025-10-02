import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle, Package } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "specimen" | "donor" | "consent" | "quality" | "event";
}

export function StatusBadge({ status, type = "specimen" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (type) {
      case "specimen":
        switch (status) {
          case "recovered":
            return { variant: "default" as const, icon: Package, label: "Recovered" };
          case "processing":
            return { variant: "secondary" as const, icon: Clock, label: "Processing" };
          case "stored":
            return { variant: "outline" as const, icon: CheckCircle, label: "Stored" };
          case "distributed":
            return { variant: "default" as const, icon: Package, label: "Distributed" };
          case "transplanted":
            return { variant: "default" as const, icon: CheckCircle, label: "Transplanted" };
          default:
            return { variant: "secondary" as const, icon: Clock, label: status };
        }
      case "donor":
        switch (status) {
          case "eligible":
            return { variant: "default" as const, icon: CheckCircle, label: "Eligible" };
          case "pending":
            return { variant: "secondary" as const, icon: Clock, label: "Pending Review" };
          case "rejected":
            return { variant: "destructive" as const, icon: XCircle, label: "Rejected" };
          default:
            return { variant: "secondary" as const, icon: Clock, label: status };
        }
      case "consent":
        switch (status) {
          case "consented":
            return { variant: "default" as const, icon: CheckCircle, label: "Consented" };
          case "pending":
            return { variant: "secondary" as const, icon: Clock, label: "Pending" };
          case "withdrawn":
            return { variant: "destructive" as const, icon: XCircle, label: "Withdrawn" };
          default:
            return { variant: "secondary" as const, icon: Clock, label: status };
        }
      case "quality":
        switch (status) {
          case "pass":
            return { variant: "default" as const, icon: CheckCircle, label: "Pass" };
          case "fail":
            return { variant: "destructive" as const, icon: XCircle, label: "Fail" };
          case "pending":
            return { variant: "secondary" as const, icon: Clock, label: "Pending" };
          default:
            return { variant: "secondary" as const, icon: Clock, label: status };
        }
      case "event":
        switch (status) {
          case "low":
            return { variant: "outline" as const, icon: AlertTriangle, label: "Low" };
          case "medium":
            return { variant: "secondary" as const, icon: AlertTriangle, label: "Medium" };
          case "high":
            return { variant: "destructive" as const, icon: AlertTriangle, label: "High" };
          case "critical":
            return { variant: "destructive" as const, icon: XCircle, label: "Critical" };
          default:
            return { variant: "secondary" as const, icon: AlertTriangle, label: status };
        }
      default:
        return { variant: "secondary" as const, icon: Clock, label: status };
    }
  };

  const { variant, icon: Icon, label } = getStatusConfig();

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// auto-fix: provide default export for compatibility with default imports
export default StatusBadge;
