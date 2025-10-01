import { StatsCard } from '../StatsCard';
import { Package, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <StatsCard
        title="Total Specimens"
        value="1,247"
        description="Active tissue specimens"
        icon={Package}
        trend={{ value: 12, label: "from last month", isPositive: true }}
      />
      <StatsCard
        title="Registered Donors"
        value="856"
        description="Consented donors"
        icon={Users}
        trend={{ value: 8, label: "from last month", isPositive: true }}
      />
      <StatsCard
        title="Quality Issues"
        value="3"
        description="Pending investigations"
        icon={AlertTriangle}
        trend={{ value: -25, label: "from last month", isPositive: true }}
      />
      <StatsCard
        title="Successful Transplants"
        value="342"
        description="This year"
        icon={CheckCircle}
        trend={{ value: 15, label: "from last year", isPositive: true }}
      />
    </div>
  );
}
