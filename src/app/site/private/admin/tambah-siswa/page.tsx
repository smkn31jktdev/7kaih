"use client";

import { useState } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { UserPlus, Save } from "lucide-react";
import { SnackbarProvider, useSnackbar } from "notistack";

function TambahSiswaForm() {
  const { enqueueSnackbar } = useSnackbar();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nisn: "",
    nama: "",
    kelas: "",
    walas: "",
    password: "",
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch("/api/admin/tambah-siswa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        enqueueSnackbar("Siswa berhasil ditambahkan!", { variant: "success" });
        // Reset form
        setFormData({
          nisn: "",
          nama: "",
          kelas: "",
          walas: "",
          password: "",
        });
      } else {
        enqueueSnackbar(result.error || "Terjadi kesalahan", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      enqueueSnackbar("Terjadi kesalahan saat menambahkan siswa", {
        variant: "error",
      });
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
                Tambah Siswa
              </h1>
              <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                Tambahkan data siswa baru ke dalam sistem sekolah.
              </p>
            </div>

            <div className="w-full">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-6">
                    <UserPlus className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-900">
                      Informasi Siswa
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NISN */}
                    <div className="space-y-2">
                      <label
                        htmlFor="nisn"
                        className="text-sm font-semibold text-gray-700"
                      >
                        NISN
                      </label>
                      <input
                        type="text"
                        id="nisn"
                        name="nisn"
                        value={formData.nisn}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Masukkan NISN"
                      />
                    </div>

                    {/* Nama */}
                    <div className="space-y-2">
                      <label
                        htmlFor="nama"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Nama
                      </label>
                      <input
                        type="text"
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    {/* Kelas */}
                    <div className="space-y-2">
                      <label
                        htmlFor="kelas"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Kelas
                      </label>
                      <input
                        type="text"
                        id="kelas"
                        name="kelas"
                        value={formData.kelas}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Contoh: 10A, 11B"
                      />
                    </div>

                    {/* Walas */}
                    <div className="space-y-2">
                      <label
                        htmlFor="walas"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Guru Wali
                      </label>
                      <input
                        type="text"
                        id="walas"
                        name="walas"
                        value={formData.walas}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Masukkan nama guru wali"
                      />
                    </div>

                    {/* Password */}
                    <div className="md:col-span-2 space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                        placeholder="Masukkan password"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`group relative flex items-center gap-3 px-6 py-2.5 rounded-xl bg-[var(--secondary)] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[var(--secondary)]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        loading ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <span>Simpan Siswa</span>
                      <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        <Save className="w-4 h-4" />
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function TambahSiswaPage() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <TambahSiswaForm />
    </SnackbarProvider>
  );
}
