// src/components/reports/AllocationSuccessRate.tsx
import { Pie } from "react-chartjs-2";

export default function AllocationSuccessRate() {
  const data = {
    labels: ["Successful Matches", "Rejected Matches"],
    datasets: [
      {
        data: [22, 6],
        backgroundColor: ["#16a34a", "#ef4444"],
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      title: { display: true, text: "Allocation Success Rate" },
    },
  };

  return <Pie data={data} options={options} />;
}
