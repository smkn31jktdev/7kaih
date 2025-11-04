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

        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <FileSpreadsheet className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Rekap Penilaian Akhir</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Unduh dan pantau rekap penilaian kebiasaan siswa dalam
                      format Excel dengan antarmuka konsisten.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="flex flex-col gap-6 xl:flex-row">
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/40 rounded-3xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-slate-800">
                              Pilih Periode Rekap
                            </h2>
                            <p className="text-sm text-slate-500">
                              Tentukan bulan yang ingin diunduh lalu buat file
                              Excel secara instan.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                              Pilih Bulan
                            </label>
                            <Select
                              value={month}
                              onChange={(value) => {
                                if (!value || value === monthRef.current) {
                                  return;
                                }
                                updateMonth(value);
                                void fetchSummaries(value);
                              }}
                              options={availableMonths.map((option) => ({
                                value: option.key,
                                label: option.label,
                              }))}
                              placeholder={
                                availableMonths.length === 0
                                  ? "Data bulan belum tersedia"
                                  : "Pilih bulan laporan"
                              }
                              disabled={availableMonths.length === 0}
                              className="w-full text-sm"
                              searchable
                            />
                            {availableMonths.length > 0 && (
                              <p className="text-xs text-slate-500">
                                Data bulan terakhir: {availableMonths[0].label}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                              type="button"
                              onClick={downloadExcel}
                              disabled={loading}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Download className="h-4 w-4" />
                              {loading ? "Membuat file..." : "Download Excel"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                fetchSummaries(month || undefined);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Refresh Preview
                            </button>
                          </div>

                          {message && (
                            <div
                              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                                message.toLowerCase().includes("berhasil")
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-rose-200 bg-rose-50 text-rose-600"
                              }`}
                            >
                              {message}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100/40 rounded-3xl p-5 border border-blue-100 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-800">
                              Statistik Cepat
                            </h2>
                            <p className="text-sm text-slate-500">
                              Lihat jumlah rangkuman tersedia untuk bulan yang
                              dipilih.
                            </p>
                            <div className="mt-4 grid grid-cols-1 gap-3">
                              <div className="rounded-2xl bg-white/80 border border-blue-100 px-4 py-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                                  Total Rangkuman
                                </p>
                                <p className="mt-1 text-3xl font-bold text-blue-800">
                                  {filteredSummaries.length}
                                </p>
                                <p className="text-xs text-blue-500">
                                  Data sesuai bulan {currentMonthLabel}
                                </p>
                              </div>
                              <div className="rounded-2xl bg-white/80 border border-indigo-100 px-4 py-4 shadow-sm">
                                <p className="text-xs font-medium uppercase tracking-wide text-indigo-500">
                                  Tersedia Keseluruhan
                                </p>
                                <p className="mt-1 text-3xl font-bold text-indigo-800">
                                  {totalSummaries}
                                </p>
                                <p className="text-xs text-indigo-500">
                                  Semua rekapan yang pernah dibuat •{" "}
                                  {availableMonths.length} bulan
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white rounded-2xl p-5 border border-indigo-100">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              Preview Rangkuman Bulanan
                            </h3>
                            <p className="text-sm text-slate-500">
                              Data siswa yang tersedia akan tampil otomatis
                              sesuai periode yang dipilih.
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                          <table className="min-w-full table-fixed text-sm">
                            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                              <tr>
                                <th className="w-32 px-4 py-3 text-left">
                                  NISN
                                </th>
                                <th className="px-4 py-3 text-left">Nama</th>
                                <th className="w-32 px-4 py-3 text-left">
                                  Kelas
                                </th>
                                <th className="w-40 px-4 py-3 text-left">
                                  Bulan
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700">
                              {summaries.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-sm text-slate-500"
                                  >
                                    Belum ada data rangkuman.
                                  </td>
                                </tr>
                              ) : filteredSummaries.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={4}
                                    className="px-4 py-6 text-center text-sm text-slate-500"
                                  >
                                    Tidak ditemukan data untuk bulan terpilih.
                                  </td>
                                </tr>
                              ) : (
                                filteredSummaries.map((s) => (
                                  <tr
                                    key={String(s.nisn)}
                                    className="odd:bg-white even:bg-slate-50"
                                  >
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                      {s.nisn}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      {s.nama}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {s.kelas || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      {s.monthLabel || s.monthKey}
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
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
