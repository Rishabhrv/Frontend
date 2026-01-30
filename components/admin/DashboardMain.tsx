"use client";

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function DashboardMain() {
  const data = {
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    datasets: [
      {
        data: [150, 380, 190, 290, 170, 180, 280, 100, 200, 390, 260, 120],
        backgroundColor: "#2563EB",
        borderRadius: 12,
      },
    ],
  };

  return (
    <main className="p-8 space-y-8 bg-[#F5F7FB] min-h-screen">
    
    </main>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
   
    </div>
  );
}
