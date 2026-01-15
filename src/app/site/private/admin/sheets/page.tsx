"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import { Calendar, Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import Select from "@/app/components/Select";

interface SummaryBrief {
  nisn: string;
  nama: string;
  kelas?: string;
  monthKey?: string;
  monthLabel?: string;
}

interface SummaryMonthOption {
  key: string;
  label: string;
}

interface SummaryResponse {
  summaries?: SummaryBrief[];
  availableMonths?: SummaryMonthOption[];
  selectedMonth?: string | null;
  totalRecords?: number;
}

export default function AdminSheetsPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [month, setMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<SummaryBrief[]>([]);
  const [availableMonths, setAvailableMonths] = useState<SummaryMonthOption[]>(
    []
  );
  const [totalSummaries, setTotalSummaries] = useState(0);
  const monthRef = useRef<string | null>(null);

  const updateMonth = useCallback((value: string) => {
    monthRef.current = value;
    setMonth(value);
  }, []);

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  const fetchSummaries = useCallback(
    async (monthOverride?: string | null) => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          return null;
        }

        const monthToFetch = monthOverride ?? monthRef.current ?? undefined;
        const endpoint = monthToFetch
          ? `/api/admin/kegiatan/summary?month=${encodeURIComponent(
              monthToFetch
            )}`
          : "/api/admin/kegiatan/summary";

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Failed to fetch summaries:", res.status);
          return null;
        }

        const data: SummaryResponse = await res.json();
        setSummaries(data.summaries || []);
        setAvailableMonths(data.availableMonths || []);

        const totalCount =
          typeof data.totalRecords === "number"
            ? data.totalRecords
            : data.summaries?.length ?? 0;
        setTotalSummaries(totalCount);

        if (monthOverride === undefined) {
          if (!monthRef.current) {
            const fallbackMonth =
              data.selectedMonth || data.availableMonths?.[0]?.key || "";
            if (fallbackMonth) {
              updateMonth(fallbackMonth);
            }
          } else if (
            monthRef.current &&
            data.availableMonths &&
            data.availableMonths.length > 0 &&
            !data.availableMonths.some(
              (option) => option.key === monthRef.current
            )
          ) {
            const fallbackMonth = data.availableMonths[0].key;
            updateMonth(fallbackMonth);
            void fetchSummaries(fallbackMonth);
          }
        }

        return data;
      } catch (error) {
        console.error("Fetch summaries error:", error);
        return null;
      }
    },
    [updateMonth]
  );

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const currentMonthLabel = useMemo(() => {
    if (!month) {
      return "-";
    }
    const match = availableMonths.find((item) => item.key === month);
    return match?.label ?? month;
  }, [availableMonths, month]);

  const filteredSummaries = useMemo(() => {
    if (!month) return summaries;
    return summaries.filter((s) => s.monthKey === month);
  }, [month, summaries]);

  const downloadExcel = async () => {
    if (!month) {
      setMessage("Silakan pilih bulan terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setMessage("Sesi berakhir. Silakan login kembali.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/sheets/export?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setMessage(err?.error || `Gagal membuat file (${res.status})`);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        res.headers.get("Content-Disposition")?.split("filename=")[1] ||
        `penilaian_${month}.csv`;
      a.download = filename.replace(/"/g, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage("File berhasil diunduh.");
    } catch (error) {
      console.error(error);
      setMessage("Terjadi kesalahan saat mengunduh file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          onToggleSidebar={() => setIsSidebarCollapsed((s) => !s)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((s) => !s)}
        />

        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 text-center md:text-left">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Rekap Data
                </h1>
                <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                  Unduh laporan penilaian bulanan siswa dalam format Excel
                  (.csv).
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* Control Panel */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Selector Section */}
                  <div className="flex-1 w-full space-y-4">
                    <div className="flex items-center gap-3 text-gray-900 font-bold text-lg mb-2">
                      <span className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[var(--secondary)]">
                        <Calendar className="w-5 h-5" />
                      </span>
                      Pilih Periode
                    </div>

                    <div className="max-w-md">
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 pl-1">
                        Bulan Laporan
                      </label>
                      <Select
                        value={month}
                        onChange={(value) => {
                          if (!value || value === monthRef.current) return;
                          updateMonth(value);
                          void fetchSummaries(value);
                        }}
                        options={availableMonths.map((option) => ({
                          value: option.key,
                          label: option.label,
                        }))}
                        placeholder={
                          availableMonths.length === 0
                            ? "Data tidak tersedia"
                            : "Pilih bulan..."
                        }
                        disabled={availableMonths.length === 0}
                        className="w-full text-sm"
                        searchable
                      />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={downloadExcel}
                        disabled={loading || !month}
                        className="px-6 py-2.5 rounded-xl bg-[var(--secondary)] text-white font-medium text-sm hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-teal-100 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {loading ? "Memproses..." : "Download Excel"}
                      </button>
                      <button
                        onClick={() => fetchSummaries(month || undefined)}
                        className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                    </div>

                    {message && (
                      <div
                        className={`p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                          message.toLowerCase().includes("berhasil")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {message}
                      </div>
                    )}
                  </div>

                  {/* Stats Section */}
                  <div className="w-full lg:w-80 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">
                      Ringkasan Data
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                          Terpilih
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {filteredSummaries.length}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Data siswa bulan {currentMonthLabel}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                          Total Arsip
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {totalSummaries}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Total semua periode
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold text-gray-900">Preview Data</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">NISN</th>
                        <th className="px-6 py-4">Nama Siswa</th>
                        <th className="px-6 py-4">Kelas</th>
                        <th className="px-6 py-4">Periode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {summaries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-gray-400"
                          >
                            Belum ada data yang dimuat.
                          </td>
                        </tr>
                      ) : filteredSummaries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-gray-400"
                          >
                            Tidak ada data untuk bulan ini.
                          </td>
                        </tr>
                      ) : (
                        filteredSummaries.map((s, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                              {s.nisn}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {s.nama}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {s.kelas || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                {s.monthLabel || s.monthKey}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
