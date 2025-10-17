// src/components/reports/TransportsChart.tsx
import { Bar } from "react-chartjs-2";

export default function TransportsChart() {
  const data = {
    labels: ["Air", "Ground", "Drone", "Delayed", "On-Time"],
    datasets: [
      {
        label: "Transport Stats",
        data: [6, 14, 3, 5, 18],
        backgroundColor: ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#22c55e"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Organ Transport Methods & Status" },
    },
  };

  return <Bar data={data} options={options} />;
}
