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
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          {/* Header Section */}
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Tambah Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Tambahkan data siswa baru ke dalam sistem.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NISN */}
                    <div>
                      <label
                        htmlFor="nisn"
                        className="block text-sm font-medium text-slate-700 mb-2"
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
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan NISN"
                      />
                    </div>

                    {/* Nama */}
                    <div>
                      <label
                        htmlFor="nama"
                        className="block text-sm font-medium text-slate-700 mb-2"
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
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>

                    {/* Kelas */}
                    <div>
                      <label
                        htmlFor="kelas"
                        className="block text-sm font-medium text-slate-700 mb-2"
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
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Contoh: 10A, 11B"
                      />
                    </div>

                    {/* Walas */}
                    <div>
                      <label
                        htmlFor="walas"
                        className="block text-sm font-medium text-slate-700 mb-2"
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
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan nama guru wali"
                      />
                    </div>

                    {/* Password */}
                    <div className="md:col-span-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700 mb-2"
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
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Masukkan password"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-6 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                        loading ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <Save className="w-5 h-5" />
                      Simpan Siswa
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
