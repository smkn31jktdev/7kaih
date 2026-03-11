"use client";

import { Check, HandCoins, X, ArrowDownToLine } from "lucide-react";
import Select from "@/app/components/Select";
import type { BeribadahStudent, BeribadahEntry } from "./types";
import { PRAYER_COLUMNS } from "./types";
import { formatMonthLabel } from "../utils";

interface HarianDetailModalProps {
  student: BeribadahStudent;
  filteredEntries: BeribadahEntry[];
  selectedMonth: string;
  availableMonths: string[];
  onMonthChange: (month: string) => void;
  onClose: () => void;
  onDownloadPDF: () => void;
}

function formatDisplayDate(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(parsed);
  }
  return value;
}

export default function HarianDetailModal({
  student,
  filteredEntries,
  selectedMonth,
  availableMonths,
  onMonthChange,
  onClose,
  onDownloadPDF,
}: HarianDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detail Jurnal Siswa
              </h2>
              <p className="text-sm text-gray-500">{student.nama}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadPDF}
              className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
              title="Download PDF"
            >
              <ArrowDownToLine className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fixed Stats Section */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Kelas
              </label>
              <p className="font-bold text-blue-900 text-lg">
                {student.kelas || "-"}
              </p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Total Entri
              </label>
              <p className="font-bold text-emerald-900 text-lg">
                {student.entries.length} Hari
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Filter Bulan
              </label>
              <Select
                value={selectedMonth}
                onChange={onMonthChange}
                options={[
                  { value: "all", label: "Semua Bulan" },
                  ...availableMonths.map((m) => ({
                    value: m,
                    label: formatMonthLabel(m),
                  })),
                ]}
                placeholder="Pilih Bulan"
              />
            </div>
          </div>
        </div>

        {/* Scrollable Table Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 md:p-8">
          <div className="border border-gray-200 rounded-2xl flex-1 overflow-auto relative">
            <div className="min-w-full inline-block align-middle">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-4 min-w-[100px]">Tanggal</th>
                    {PRAYER_COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-4 min-w-[80px] text-center"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={PRAYER_COLUMNS.length + 1}
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        Tidak ada data untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, i) => (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatDisplayDate(entry.tanggal)}
                        </td>
                        {PRAYER_COLUMNS.map((col) => (
                          <td key={col.key} className="px-3 py-3 text-center">
                            {col.type === "boolean" ? (
                              entry[col.key] ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                              ) : (
                                <div className="w-3.5 h-3.5 mx-auto" />
                              )
                            ) : (
                              <span className="font-mono text-gray-600">
                                {entry.zakatInfaqSedekah || "-"}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
