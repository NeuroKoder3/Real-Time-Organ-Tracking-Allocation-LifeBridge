// src/components/reports/OrgansChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type OrgansDataPoint = {
  month: string;
  transported: number;
};

const data: OrgansDataPoint[] = [
  { month: "Jan", transported: 28 },
  { month: "Feb", transported: 35 },
  { month: "Mar", transported: 32 },
  { month: "Apr", transported: 45 },
  { month: "May", transported: 38 },
];

export default function OrgansChart() {
  return (
    <div className="h-80">
      <h2 className="text-lg font-semibold mb-3">Organs Transported (Last 5 Months)</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="transported" fill="#4F46E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
