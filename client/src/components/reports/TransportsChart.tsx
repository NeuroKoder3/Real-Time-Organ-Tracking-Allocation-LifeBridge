// src/components/reports/TransportsChart.tsx
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

import { ChartData } from "chart.js";

// ✅ Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TransportsChart() {
  const data: ChartData<"bar"> = {
    labels: ["Air", "Ground", "Drone", "Delayed", "On-Time"],
    datasets: [
      {
        label: "Transport Stats",
        data: [6, 14, 3, 5, 18],
        backgroundColor: ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#22c55e"],
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#374151",
          font: { size: 13, weight: "bold" },
        },
      },
      title: {
        display: true,
        text: "Organ Transport Methods & Status",
        color: "#111827",
        font: { size: 16, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.formattedValue}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280", font: { size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#6b7280", font: { size: 12 } },
        grid: { color: "rgba(156,163,175,0.2)" },
      },
    },
  };

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
}
