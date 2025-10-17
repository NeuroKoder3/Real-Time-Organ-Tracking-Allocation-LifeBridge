// src/components/reports/RecipientsChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RecipientsDataPoint = {
  week: string;
  matched: number;
};

const data: RecipientsDataPoint[] = [
  { week: "Week 1", matched: 5 },
  { week: "Week 2", matched: 8 },
  { week: "Week 3", matched: 6 },
  { week: "Week 4", matched: 10 },
];

export default function RecipientsChart() {
  return (
    <div className="h-80">
      <h2 className="text-lg font-semibold mb-3">Recipients Matched (Last Month)</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="matched"
            stroke="#16A34A"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
