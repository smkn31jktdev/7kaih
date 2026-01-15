"use client";

import { useState } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { Table, RefreshCw, Save, SquarePen } from "lucide-react";
import { SnackbarProvider, useSnackbar } from "notistack";

function ExcelImportForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1NgHOR1NWzE9KCfzmSZwwnJ7gcz-G8V0R1PrIfS-Nql0/edit?usp=sharing";
  interface StudentRow {
    nisn: string;
    nama: string;
    kelas: string;
    walas: string;
    password: string;
  }

  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed((s) => !s);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((s) => !s);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  function extractSheetId(url: string) {
    try {
      const m = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  const handleLoad = async () => {
    const sheetId = extractSheetId(sheetUrl);
    if (!sheetId) {
      enqueueSnackbar("Sheet ID tidak valid", { variant: "error" });
      return;
    }

    setLoading(true);
    try {
      // Call server-side proxy which uses the API key from env
      const res = await fetch("/api/admin/tambah-siswa/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, range: "B6:F" }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Sheets fetch failed: ${res.status} ${t}`);
      }
      const data = await res.json();
      const values: string[][] = data.values || [];

      const mapped = values.map((r) => ({
        nisn: r[0] ? String(r[0]).trim() : "",
        nama: r[1] ? String(r[1]).trim() : "",
        kelas: r[2] ? String(r[2]).trim() : "",
        walas: r[3] ? String(r[3]).trim() : "",
        password: r[4] ? String(r[4]).trim() : "",
      }));

      setRows(mapped);
      enqueueSnackbar(`${mapped.length} baris berhasil dimuat`, {
        variant: "success",
      });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(`Gagal memuat sheet: ${message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!rows.length) {
      enqueueSnackbar("Tidak ada data untuk diimpor", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tambah-siswa/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: rows }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || JSON.stringify(j));
      enqueueSnackbar(j.message || "Import berhasil", { variant: "success" });
      // optionally clear rows
      setRows([]);
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(`Import gagal: ${message}`, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {/* Header */}
            <div className="mb-8 md:mb-10 w-full text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Import Siswa (Excel/Sheet)
              </h1>
              <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                Import data siswa secara massal dari Google Spreadsheet.
              </p>
            </div>

            <div className="w-full">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <div className="space-y-6">
                  {/* Info Block */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900 text-sm">
                    <Table className="w-5 h-5 flex-shrink-0 text-blue-500" />
                    <div>
                      <p className="font-semibold mb-1">Panduan Import</p>
                      <p className="opacity-80">
                        Pastikan Google Sheet Anda dapat diakses oleh publik
                        atau service account. Struktur kolom harus sesuai dengan
                        format yang ditentukan (NISN, Nama, Kelas, Walas,
                        Password).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        URL Google Sheet
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={sheetUrl}
                          readOnly
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const url = sheetUrl?.trim();
                              if (!url) return;
                              // open in new tab/window
                              window.open(url, "_blank", "noopener,noreferrer");
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          title="Buka Sheet"
                          className="inline-flex items-center justify-center w-12 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer border border-amber-200"
                        >
                          <SquarePen className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 border-t border-gray-100 pt-6">
                    <button
                      onClick={handleLoad}
                      disabled={loading}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-xl hover:bg-blue-100 transition-colors ${
                        loading
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                      <span>Muat Data Sheet</span>
                    </button>

                    <button
                      onClick={handleImport}
                      disabled={loading || !rows.length}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--secondary)] text-white font-bold rounded-xl shadow-lg shadow-[var(--secondary)]/20 hover:brightness-110 transition-all ${
                        loading || !rows.length
                          ? "cursor-not-allowed opacity-50 shadow-none"
                          : "cursor-pointer"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Semua Siswa</span>
                    </button>

                    <div className="ml-auto text-sm text-gray-500">
                      Baris data:{" "}
                      <strong className="text-gray-900">{rows.length}</strong>
                    </div>
                  </div>

                  {/* Table Preview */}
                  <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              NISN
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Nama
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Kelas
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Guru Wali
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Password
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {rows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-12 text-center text-sm text-gray-400"
                              >
                                Belum ada data dimuat. Klik tombol "Muat Data
                                Sheet".
                              </td>
                            </tr>
                          ) : (
                            rows.map((r, i) => (
                              <tr
                                key={i}
                                className="hover:bg-gray-50/50 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-gray-500 font-medium whitespace-nowrap">
                                  {i + 1}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                                  {r.nisn}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium whitespace-nowrap">
                                  {r.nama}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                  {r.kelas}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                  {r.walas}
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-gray-400 whitespace-nowrap">
                                  {r.password}
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
        </main>
      </div>
    </div>
  );
}

export default function ExcelImportPage() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <ExcelImportForm />
    </SnackbarProvider>
  );
}
