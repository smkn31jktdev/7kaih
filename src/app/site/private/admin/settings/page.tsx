"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { CheckCircle, Lock, Mail, User, Wrench } from "lucide-react";

export default function AdminSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<null | {
    type: "success" | "error";
    text: string;
  }>(null);

  // Sidebar state for desktop collapse and mobile open
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const adminUserStr = localStorage.getItem("adminUser");
        if (!adminUserStr) {
          setMessage({
            type: "error",
            text: "Sesi admin tidak ditemukan. Silakan login lagi.",
          });
          window.location.href = "/site/personal/admin/login";
          return;
        }

        const adminUser = JSON.parse(adminUserStr);
        const adminEmail = adminUser.email;
        if (!adminEmail) {
          setMessage({
            type: "error",
            text: "Sesi admin tidak valid. Silakan login lagi.",
          });
          return;
        }

        // Fetch current admin data from database
        const response = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: adminEmail }),
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          // Pre-populate form with current data
          setName(user.username || "");
          setEmail(user.email || "");
          setOriginalEmail(user.email || "");
        } else {
          const errorData = await response.json();
          setMessage({
            type: "error",
            text: errorData.error || "Gagal memuat data admin",
          });
        }
      } catch (err: unknown) {
        console.error("Load admin data error:", err);
        setMessage({ type: "error", text: "Gagal memuat data admin" });
      } finally {
        setInitialLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const validate = () => {
    if (!name.trim()) return "Nama diperlukan";
    if (!email.trim()) return "Email diperlukan";
    // simple email check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Email tidak valid";
    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) return "Kata sandi baru minimal 8 karakter";
      if (newPassword !== confirmPassword) return "Kata sandi tidak cocok";
      if (!currentPassword)
        return "Kata sandi saat ini diperlukan untuk mengubah kata sandi";
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const err = validate();
    if (err) return setMessage({ type: "error", text: err });

    try {
      setLoading(true);
      // Use PUT to update admin settings, using originalEmail to identify the admin
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: originalEmail, // Current email to identify the admin
          name: name.trim(),
          newEmail: email.trim() !== originalEmail ? email.trim() : undefined, // Only send if changed
          currentPassword: newPassword ? currentPassword : undefined, // Only send if changing password
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save settings");

      // Update localStorage with new user data if email changed
      if (email.trim() !== originalEmail) {
        const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");
        adminUser.email = email.trim();
        localStorage.setItem("adminUser", JSON.stringify(adminUser));
        setOriginalEmail(email.trim());
      }

      setMessage({
        type: "success",
        text: data?.message || "Pengaturan berhasil disimpan",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error(err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menyimpan pengaturan",
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
          {/* Reduce horizontal padding so content uses more space */}
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Pengaturan Akun</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Kelola detail akun Anda, perbarui email atau ubah kata
                      sandi dengan aman.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                {message && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      message.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {initialLoading ? (
                  <div className="flex flex-col items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
                    <p className="text-slate-500 text-sm">
                      Memuat pengaturan Anda...
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Profile Section */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-indigo-100">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                        <div className="relative">
                          <div
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-xl"
                            style={{ backgroundColor: "var(--foreground)" }}
                          >
                            {name ? name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
                            {name || "Pengguna Admin"}
                          </h2>
                          <p className="text-indigo-600 font-medium mb-2 text-sm sm:text-base">
                            {email || "admin@anakhebat.com"}
                          </p>
                          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span>Akun Aktif</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settings Form */}
                    <form
                      onSubmit={handleSave}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                        {/* Personal Information Card */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                                  Informasi Pribadi
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500">
                                  Perbarui detail profil dasar Anda
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-6 space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nama Lengkap
                              </label>
                              <div className="relative">
                                <input
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Masukkan nama lengkap Anda"
                                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                />
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-4 top-3 sm:top-4" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Alamat Email
                              </label>
                              <div className="relative">
                                <input
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="Masukkan alamat email Anda"
                                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                />
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-4 top-3 sm:top-4" />
                              </div>
                              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Digunakan untuk login dan notifikasi penting
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Security Settings Card */}
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                                  Pengaturan Keamanan
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500">
                                  Ubah kata sandi akun Anda
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                              <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-2">
                                <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                                Biarkan kolom kata sandi kosong untuk
                                mempertahankan kata sandi saat ini
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Kata Sandi Saat Ini
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={currentPassword}
                                  onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                  }
                                  placeholder="Masukkan kata sandi saat ini"
                                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                />
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-4 top-3 sm:top-4" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Kata Sandi Baru
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) =>
                                    setNewPassword(e.target.value)
                                  }
                                  placeholder="Masukkan kata sandi baru"
                                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                />
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-4 top-3 sm:top-4" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Konfirmasi Kata Sandi Baru
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                  }
                                  placeholder="Konfirmasi kata sandi baru"
                                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                                />
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 sm:left-4 top-3 sm:top-4" />
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                Kata sandi minimal 8 karakter
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 text-center sm:text-left">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                            Semua perubahan secara otomatis disinkronkan dengan
                            database
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setMessage(null);
                                setName("");
                                setEmail("");
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                              }}
                              className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                            >
                              Reset Formulir
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-6 sm:px-8 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                  Menyimpan Perubahan...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Simpan Perubahan
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
