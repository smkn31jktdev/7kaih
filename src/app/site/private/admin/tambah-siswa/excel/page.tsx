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
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <Table className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Tambah Siswa dari Google Sheet</span>
                    </h1>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Google Sheet URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={sheetUrl}
                          readOnly
                          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-gray-100"
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
                          title="Edit Sheet"
                          className="inline-flex items-center px-3 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 cursor-pointer"
                        >
                          <SquarePen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLoad}
                      disabled={loading}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                        loading ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" /> Muat Dari Sheet
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={loading || !rows.length}
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                        loading || !rows.length
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                    >
                      <Save className="w-4 h-4" /> Simpan Siswa
                    </button>
                    <div className="ml-auto text-sm text-slate-600">
                      Baris dimuat: <strong>{rows.length}</strong>
                    </div>
                  </div>

                  <div className="overflow-auto bg-white border border-slate-100 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            No
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            NISN
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            Nama
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            Kelas
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            Guru Wali
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">
                            Password
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              Belum ada data dimuat.
                            </td>
                          </tr>
                        ) : (
                          rows.map((r, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {i + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {r.nisn}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {r.nama}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {r.kelas}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {r.walas}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
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
