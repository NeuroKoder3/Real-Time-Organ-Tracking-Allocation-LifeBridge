// src/components/reports/AllocationSuccessRate.tsx
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  ChartOptions,
  ChartData,
} from "chart.js";

// Register necessary components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

const data: ChartData<"pie", number[], string> = {
  labels: ["Successful Matches", "Rejected Matches"],
  datasets: [
    {
      data: [22, 6],
      backgroundColor: ["#16a34a", "#ef4444"],
      hoverOffset: 6,
    },
  ],
};

const options: ChartOptions<"pie"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom",
    },
    title: {
      display: true,
      text: "Allocation Success Rate",
    },
  },
};

export default function AllocationSuccessRate() {
  return <Pie data={data} options={options} />;
}
