"use client";

import { X, Download, TrendingUp } from "lucide-react";
import type { StudentSemesterSummary } from "./types";
import { RATING_HEADERS, getRatingLabel } from "./types";
import { downloadSemesterPDF } from "./pdfGenerator";
import HabitChart from "./HabitChart";

interface DetailModalProps {
  summary: StudentSemesterSummary;
  onClose: () => void;
}

function RatingDot({ rating }: { rating: number }) {
  const colorMap: Record<number, string> = {
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-yellow-500",
    4: "bg-blue-500",
    5: "bg-emerald-500",
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold ${colorMap[rating] ?? "bg-gray-300"}`}
      title={getRatingLabel(rating)}
    >
      {rating || "-"}
    </span>
  );
}

export default function DetailModal({ summary, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Rangkuman Semester
            </h3>
            <p className="text-sm text-gray-500">
              {summary.nama} • {summary.kelas} • {summary.semesterLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Rata-rata</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.overallRating}
              </p>
              <p className="text-xs text-gray-400">
                {getRatingLabel(summary.overallRating)}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Indikator</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.indicators.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Bulan Aktif</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.months.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Tahun Ajaran</p>
              <p className="text-xl font-bold text-gray-900">
                {summary.tahunAjaran}
              </p>
            </div>
          </div>

          {/* Semester Detail Table */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 p-3 text-center">
                  <span className="text-xs font-bold text-gray-400">#</span>
                </div>
                <div className="flex-1 min-w-0 p-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Indikator
                  </span>
                </div>
                {summary.months.map((month) => {
                  const shortMonth = month.label.split(" ")[0]?.substring(0, 3);
                  return (
                    <div
                      key={month.key}
                      className="flex-shrink-0 w-12 p-2 text-center hidden sm:block"
                    >
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {shortMonth}
                      </span>
                    </div>
                  );
                })}
                <div className="flex-shrink-0 w-16 p-3 text-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Avg
                  </span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-50">
              {summary.indicators.map((indicator, index) => (
                <div
                  key={indicator.id}
                  className="flex items-center hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 p-3 text-center">
                    <span className="text-xs font-bold text-gray-400">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 p-3">
                    <p className="text-sm text-gray-900 leading-snug">
                      {indicator.label}
                    </p>
                  </div>
                  {summary.months.map((month) => {
                    const monthRating = indicator.ratings[month.key];
                    return (
                      <div
                        key={month.key}
                        className="flex-shrink-0 w-12 p-2 text-center hidden sm:flex justify-center"
                        title={
                          monthRating
                            ? `${month.label}: ${getRatingLabel(monthRating)} — ${indicator.notes[month.key] || ""}`
                            : `${month.label}: Tidak ada data`
                        }
                      >
                        {monthRating ? (
                          <RatingDot rating={monthRating} />
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-300 text-xs">
                            -
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex-shrink-0 w-16 p-3 flex justify-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {indicator.averageRating || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Legend */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              Keterangan Penilaian
            </p>
            <div className="flex flex-wrap gap-3">
              {RATING_HEADERS.map((header) => (
                <div key={header.value} className="flex items-center gap-1.5">
                  <RatingDot rating={header.value} />
                  <span className="text-xs text-gray-600">{header.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Habit Chart */}
          <HabitChart summary={summary} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => downloadSemesterPDF(summary)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
