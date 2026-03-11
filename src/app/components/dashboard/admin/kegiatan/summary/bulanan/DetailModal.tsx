"use client";

import { X, Download } from "lucide-react";
import type { StudentSummary } from "./types";
import { RATING_HEADERS } from "./types";
import { downloadSummaryPDF } from "./pdfGenerator";
import MonthlyHabitChart from "./HabitChart";

interface DetailModalProps {
  summary: StudentSummary;
  onClose: () => void;
}

export default function DetailModal({ summary, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Rangkuman Kebiasaan
            </h3>
            <p className="text-sm text-gray-500">
              {summary.nama} • {summary.kelas}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {summary.indicators.map((indicator, index) => (
              <div
                key={indicator.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50"
              >
                <div className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {indicator.label}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        Nilai: {indicator.rating}
                      </span>
                      <span className="text-xs text-gray-400">
                        (
                        {
                          RATING_HEADERS.find(
                            (h) => h.value === indicator.rating,
                          )?.label
                        }
                        )
                      </span>
                    </div>
                    {indicator.note && (
                      <div className="text-xs text-gray-500 bg-white p-3 rounded-xl border border-gray-100 italic">
                        &quot;{indicator.note}&quot;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Habit Chart */}
          <MonthlyHabitChart summary={summary} />
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={() => downloadSummaryPDF(summary)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[var(--secondary)] hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-teal-200"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
