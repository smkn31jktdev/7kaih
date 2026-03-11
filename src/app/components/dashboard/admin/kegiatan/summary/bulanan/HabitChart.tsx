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
import { Download, BarChart3 } from "lucide-react";
import type { StudentSummary } from "./types";
import { RATING_HEADERS } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

const RATING_LABELS: Record<number, string> = {
  1: "Kurang Baik",
  2: "Cukup Baik",
  3: "Baik",
  4: "Sangat Baik",
  5: "Istimewa",
};

interface HabitChartProps {
  summary: StudentSummary;
}

export default function MonthlyHabitChart({ summary }: HabitChartProps) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  // Truncated labels for chart display
  const indicatorLabels = summary.indicators.map((ind, idx) => {
    const short =
      ind.label.length > 20 ? ind.label.substring(0, 17) + "..." : ind.label;
    return `${idx + 1}. ${short}`;
  });

  // --- Line Chart Data: each indicator's rating as a point on a line ---
  const lineData = {
    labels: indicatorLabels,
    datasets: [
      {
        label: "Rating Kebiasaan",
        data: summary.indicators.map((ind) => ind.rating),
        borderColor: "rgb(20, 184, 166)",
        backgroundColor: "rgba(20, 184, 166, 0.1)",
        borderWidth: 2.5,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: summary.indicators.map((ind) => {
          const colorMap: Record<number, string> = {
            1: "rgb(239, 68, 68)",
            2: "rgb(251, 146, 60)",
            3: "rgb(234, 179, 8)",
            4: "rgb(59, 130, 246)",
            5: "rgb(16, 185, 129)",
          };
          return colorMap[ind.rating] ?? "rgb(156, 163, 175)";
        }),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.35,
        fill: true,
      },
    ],
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
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12, family: "'Inter', sans-serif" },
        bodyFont: { size: 11, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          title: function (items: Array<{ dataIndex: number }>) {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            return summary.indicators[idx]?.label || "";
          },
          label: function (context: { parsed: { y: number | null } }) {
            const value = context.parsed.y;
            if (value === null) return "Tidak ada data";
            return `Rating: ${value} (${RATING_LABELS[value] || ""})`;
          },
          afterLabel: function (context: { dataIndex: number }) {
            const note = summary.indicators[context.dataIndex]?.note;
            if (note) return `Catatan: ${note}`;
            return "";
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
            const labels: Record<number, string> = {
              1: "1 - Kurang",
              2: "2 - Cukup",
              3: "3 - Baik",
              4: "4 - Sangat Baik",
              5: "5 - Istimewa",
            };
            return labels[Number(value)] ?? "";
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
          font: { size: 10, family: "'Inter', sans-serif" },
          color: "#374151",
          maxRotation: 45,
          minRotation: 0,
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
      `Grafik Kebiasaan Bulanan — ${summary.nama}`,
      exportCanvas.width / 2,
      30,
    );
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "#6B7280";
    ctx.fillText(
      `${summary.monthLabel} • ${summary.kelas}`,
      exportCanvas.width / 2,
      48,
    );

    // Chart
    ctx.drawImage(canvas, padding, 60);

    link.download = `grafik-bulanan-${summary.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${summary.monthKey}.png`;
    link.href = exportCanvas.toDataURL("image/png", 1.0);
    link.click();
  }, [summary]);

  if (summary.indicators.length === 0) {
    return null;
  }

  // Calculate quick stats
  const ratings = summary.indicators
    .map((ind) => ind.rating)
    .filter((r) => r > 0);
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : "-";
  const highestRating = ratings.length > 0 ? Math.max(...ratings) : 0;
  const lowestRating = ratings.length > 0 ? Math.min(...ratings) : 0;

  // Count per rating level
  const ratingDistribution = RATING_HEADERS.map((h) => ({
    ...h,
    count: summary.indicators.filter((ind) => ind.rating === h.value).length,
  }));
  const dominantRating = ratingDistribution.reduce((a, b) =>
    b.count > a.count ? b : a,
  );

  return (
    <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
      {/* Chart Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            Grafik Rating Kebiasaan
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Perbandingan rating per indikator
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
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
              Rata-rata
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {avgRating}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
              Tertinggi
            </p>
            <p className="text-lg font-bold text-emerald-600 mt-0.5">
              {highestRating || "-"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
              Terendah
            </p>
            <p className="text-lg font-bold text-amber-600 mt-0.5">
              {lowestRating || "-"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
              Dominan
            </p>
            <p className="text-lg font-bold text-teal-600 mt-0.5">
              {dominantRating.count > 0 ? dominantRating.value : "-"}
            </p>
            {dominantRating.count > 0 && (
              <p className="text-[10px] text-gray-400">
                {dominantRating.label}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="px-5 pb-5">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
            Distribusi Rating
          </p>
          <div className="space-y-2">
            {ratingDistribution.map((item) => {
              const percentage =
                summary.indicators.length > 0
                  ? (item.count / summary.indicators.length) * 100
                  : 0;
              const barColorMap: Record<number, string> = {
                1: "bg-red-500",
                2: "bg-orange-400",
                3: "bg-yellow-400",
                4: "bg-blue-500",
                5: "bg-emerald-500",
              };
              return (
                <div key={item.value} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-24 truncate">
                    {item.value}. {item.label}
                  </span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColorMap[item.value] || "bg-gray-400"}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-14 text-right">
                    {item.count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
