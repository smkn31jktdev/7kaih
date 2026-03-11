"use client";

import { FileText, ChevronRight } from "lucide-react";
import Select from "@/app/components/Select";
import type { StudentSummary, SummaryMonthOption } from "./types";

interface SummaryTableProps {
  summaries: StudentSummary[];
  summaryLoading: boolean;
  summaryMonths: SummaryMonthOption[];
  selectedSummaryMonth: string | null;
  onMonthChange: (newMonth: string) => void;
  onSelectSummary: (summary: StudentSummary) => void;
}

export default function SummaryTable({
  summaries,
  summaryLoading,
  summaryMonths,
  selectedSummaryMonth,
  onMonthChange,
  onSelectSummary,
}: SummaryTableProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Laporan Bulanan</h3>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Select
            value={selectedSummaryMonth ?? ""}
            onChange={onMonthChange}
            options={summaryMonths.map((month) => ({
              value: month.key,
              label: month.label,
            }))}
            placeholder={
              summaryMonths.length === 0 ? "Menunggu data..." : "Pilih Bulan"
            }
            disabled={summaryMonths.length === 0 || summaryLoading}
            className="text-sm"
            searchable
          />
        </div>
      </div>

      <div className="p-0">
        {summaryLoading ? (
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
              </div>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 rounded-b-3xl">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-gray-900 font-medium mb-1">
              Belum ada laporan
            </h3>
            <p className="text-gray-500 text-sm">
              Pilih bulan lain atau tunggu data masuk.
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
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                    {summary.nama.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-[var(--secondary)] transition-colors">
                      {summary.nama}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <span>{summary.kelas}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{summary.nisn}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
