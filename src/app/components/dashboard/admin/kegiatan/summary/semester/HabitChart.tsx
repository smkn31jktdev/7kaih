"use client";

import { useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Download, TrendingUp } from "lucide-react";
import type { StudentSemesterSummary } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// Curated color palette for chart datasets
const CHART_COLORS = [
  { bg: "rgba(99, 102, 241, 0.15)", border: "rgb(99, 102, 241)" }, // Indigo
  { bg: "rgba(16, 185, 129, 0.15)", border: "rgb(16, 185, 129)" }, // Emerald
  { bg: "rgba(245, 158, 11, 0.15)", border: "rgb(245, 158, 11)" }, // Amber
  { bg: "rgba(239, 68, 68, 0.15)", border: "rgb(239, 68, 68)" }, // Red
  { bg: "rgba(139, 92, 246, 0.15)", border: "rgb(139, 92, 246)" }, // Violet
  { bg: "rgba(6, 182, 212, 0.15)", border: "rgb(6, 182, 212)" }, // Cyan
  { bg: "rgba(236, 72, 153, 0.15)", border: "rgb(236, 72, 153)" }, // Pink
  { bg: "rgba(34, 197, 94, 0.15)", border: "rgb(34, 197, 94)" }, // Green
  { bg: "rgba(251, 146, 60, 0.15)", border: "rgb(251, 146, 60)" }, // Orange
  { bg: "rgba(59, 130, 246, 0.15)", border: "rgb(59, 130, 246)" }, // Blue
];

interface HabitChartProps {
  summary: StudentSemesterSummary;
}

export default function HabitChart({ summary }: HabitChartProps) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const monthLabels = summary.months.map((m) => {
    const parts = m.label.split(" ");
    return parts[0]?.substring(0, 3) ?? m.key;
  });

  // --- Line Chart Data: trend per indikator sepanjang bulan-bulan semester ---
  const lineData = {
    labels: monthLabels,
    datasets: summary.indicators.map((indicator, idx) => {
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return {
        label:
          indicator.label.length > 40
            ? indicator.label.substring(0, 37) + "..."
            : indicator.label,
        data: summary.months.map((m) => indicator.ratings[m.key] || null),
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: color.border,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.35,
        fill: false,
        spanGaps: true,
      };
    }),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#6B7280",
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12, family: "'Inter', sans-serif" },
        bodyFont: { size: 11, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: function (context: {
            dataset: { label?: string };
            parsed: { y: number | null };
          }) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (value === null) return `${label}: Tidak ada data`;
            const ratingLabels: Record<number, string> = {
              1: "Kurang Baik",
              2: "Cukup Baik",
              3: "Baik",
              4: "Sangat Baik",
              5: "Istimewa",
            };
            return `${label}: ${value} (${ratingLabels[value] || ""})`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 5.5,
        ticks: {
          stepSize: 1,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#9CA3AF",
          callback: function (value: string | number) {
            const ratingLabels: Record<number, string> = {
              1: "1 - Kurang",
              2: "2 - Cukup",
              3: "3 - Baik",
              4: "4 - Sangat Baik",
              5: "5 - Istimewa",
            };
            return ratingLabels[Number(value)] ?? "";
          },
        },
        grid: {
          color: "rgba(229, 231, 235, 0.5)",
          drawBorder: false,
        },
        border: { display: false },
      },
      x: {
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
            weight: 600 as const,
          },
          color: "#374151",
        },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  // --- Download handler ---
  const handleDownload = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = chart.canvas;
    const link = document.createElement("a");

    // Create a white-background version
    const exportCanvas = document.createElement("canvas");
    const padding = 40;
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.height + padding * 2 + 60;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Title
    ctx.fillStyle = "#111827";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Grafik Kebiasaan Semester — ${summary.nama}`,
      exportCanvas.width / 2,
      30,
    );
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "#6B7280";
    ctx.fillText(
      `${summary.semesterLabel} • ${summary.kelas} • ${summary.tahunAjaran}`,
      exportCanvas.width / 2,
      48,
    );

    // Chart
    ctx.drawImage(canvas, padding, 60);

    link.download = `grafik-semester-${summary.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${summary.semesterKey}.png`;
    link.href = exportCanvas.toDataURL("image/png", 1.0);
    link.click();
  }, [summary]);

  if (summary.indicators.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
      {/* Chart Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Grafik Perkembangan Kebiasaan
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Tren perubahan rating per bulan
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all"
          title="Download grafik sebagai gambar"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Unduh Grafik</span>
        </button>
      </div>

      {/* Chart Area */}
      <div className="p-5 bg-white">
        <div className="h-[340px]">
          <Line ref={chartRef} data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(() => {
            const allRatings = summary.indicators
              .flatMap((ind) => summary.months.map((m) => ind.ratings[m.key]))
              .filter((r): r is number => typeof r === "number" && r > 0);

            const highest = allRatings.length > 0 ? Math.max(...allRatings) : 0;
            const lowest = allRatings.length > 0 ? Math.min(...allRatings) : 0;
            const avg =
              allRatings.length > 0
                ? (
                    allRatings.reduce((a, b) => a + b, 0) / allRatings.length
                  ).toFixed(1)
                : "-";

            // Trend: compare last month avg with first month avg
            const firstMonth = summary.months[0]?.key;
            const lastMonth = summary.months[summary.months.length - 1]?.key;
            let trend = "-";
            let trendColor = "text-gray-500";
            if (firstMonth && lastMonth && firstMonth !== lastMonth) {
              const firstAvg = summary.indicators
                .map((ind) => ind.ratings[firstMonth])
                .filter((r): r is number => typeof r === "number" && r > 0);
              const lastAvg = summary.indicators
                .map((ind) => ind.ratings[lastMonth])
                .filter((r): r is number => typeof r === "number" && r > 0);
              if (firstAvg.length > 0 && lastAvg.length > 0) {
                const diff =
                  lastAvg.reduce((a, b) => a + b, 0) / lastAvg.length -
                  firstAvg.reduce((a, b) => a + b, 0) / firstAvg.length;
                if (diff > 0) {
                  trend = `+${diff.toFixed(1)}`;
                  trendColor = "text-emerald-600";
                } else if (diff < 0) {
                  trend = diff.toFixed(1);
                  trendColor = "text-red-600";
                } else {
                  trend = "0";
                  trendColor = "text-gray-500";
                }
              }
            }

            return (
              <>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    Rata-rata
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {avg}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    Tertinggi
                  </p>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">
                    {highest || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    Terendah
                  </p>
                  <p className="text-lg font-bold text-amber-600 mt-0.5">
                    {lowest || "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                    Tren
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${trendColor}`}>
                    {trend}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
