"use client";

import { BookOpen, ChevronRight, TrendingUp } from "lucide-react";
import Select from "@/app/components/Select";
import type { StudentSemesterSummary, SemesterOption } from "./types";
import { getRatingLabel } from "./types";

interface SemesterTableProps {
  summaries: StudentSemesterSummary[];
  loading: boolean;
  semesterOptions: SemesterOption[];
  selectedSemester: string | null;
  onSemesterChange: (semesterKey: string) => void;
  onSelectSummary: (summary: StudentSemesterSummary) => void;
}

function RatingBadge({ rating }: { rating: number }) {
  const colorMap: Record<number, string> = {
    1: "bg-red-50 text-red-700 border-red-100",
    2: "bg-orange-50 text-orange-700 border-orange-100",
    3: "bg-yellow-50 text-yellow-700 border-yellow-100",
    4: "bg-blue-50 text-blue-700 border-blue-100",
    5: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold border ${colorMap[rating] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}
    >
      {rating > 0 ? rating : "-"}
    </span>
  );
}

export default function SemesterTable({
  summaries,
  loading,
  semesterOptions,
  selectedSemester,
  onSemesterChange,
  onSelectSummary,
}: SemesterTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Laporan Semester
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Rekapitulasi penilaian kebiasaan per semester
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={selectedSemester ?? ""}
            onChange={onSemesterChange}
            options={semesterOptions.map((opt) => ({
              value: opt.key,
              label: opt.label,
            }))}
            placeholder={
              semesterOptions.length === 0
                ? "Menunggu data..."
                : "Pilih Semester"
            }
            disabled={semesterOptions.length === 0 || loading}
            className="text-sm"
            searchable
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-0">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-b-3xl">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              Belum ada data semester
            </h3>
            <p className="text-gray-500 text-sm">
              Pilih semester lain atau tunggu data bulanan masuk.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto rounded-b-3xl">
            {summaries.map((summary) => (
              <div
                key={summary.nisn}
                className="group flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onSelectSummary(summary)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {summary.nama.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {summary.nama}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{summary.kelas}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{summary.nisn}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="flex items-center gap-1 text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        {summary.months.length} bulan
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs text-gray-400 mr-1">
                      Rata-rata:
                    </span>
                    <RatingBadge rating={summary.overallRating} />
                    <span className="text-xs text-gray-400">
                      {getRatingLabel(summary.overallRating)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
