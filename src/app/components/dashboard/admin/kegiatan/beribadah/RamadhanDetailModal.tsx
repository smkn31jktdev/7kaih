"use client";

import { Check, Moon, Star, Calendar, X, ArrowDownToLine } from "lucide-react";
import type { RamadhanStudent } from "./types";
import { RAMADHAN_COLOR, getRatingColor } from "./types";

interface RamadhanDetailModalProps {
  student: RamadhanStudent;
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

export default function RamadhanDetailModal({
  student,
  onClose,
  onDownloadPDF,
}: RamadhanDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div
          className="p-6 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${RAMADHAN_COLOR} 0%, #15936A 100%)`,
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25">
                <Moon className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{student.nama}</h2>
                <p className="text-white/80 text-sm">
                  Ramadhan {student.hijriYear} H
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onDownloadPDF}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
                title="Download PDF"
              >
                <ArrowDownToLine className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-red-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="font-bold text-gray-900">
                  Sholat Tarawih & Witir
                </h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {student.summary.totalTarawihWitir}
                    <span className="text-lg font-normal text-gray-500">
                      {" "}
                      / 30 malam
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {student.summary.tarawihWitirNote}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-sm border ${getRatingColor(student.summary.tarawihWitirRating)}`}
                >
                  {student.summary.tarawihWitirRating}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-gray-900">Berpuasa</h4>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {student.summary.totalPuasa}
                    <span className="text-lg font-normal text-gray-500">
                      {" "}
                      / 30 hari
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {student.summary.puasaNote}
                  </p>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl font-bold text-sm border ${getRatingColor(student.summary.puasaRating)}`}
                >
                  {student.summary.puasaRating}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <div className="border border-gray-200 rounded-2xl flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead
                className="text-white font-semibold sticky top-0 z-10"
                style={{ backgroundColor: RAMADHAN_COLOR }}
              >
                <tr>
                  <th className="px-4 py-4 text-center">Hari Ke-</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4 text-center">Tarawih & Witir</th>
                  <th className="px-4 py-4 text-center">Berpuasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {student.entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      Belum ada data untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  student.entries.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center font-bold text-[#1AAC7A]">
                        {entry.ramadhanDay || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatDisplayDate(entry.tanggal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.sholatTarawihWitir ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.berpuasa ? (
                          <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-5 h-5 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
