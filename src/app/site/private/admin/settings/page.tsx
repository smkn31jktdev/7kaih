"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import {
  CheckCircle,
  Lock,
  User,
  Shield,
  Info,
  Loader2,
  Save,
  X,
} from "lucide-react";

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
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {/* Header */}
            <div className="mb-8 md:mb-10 w-full text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Pengaturan Akun
              </h1>
              <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                Kelola informasi profil, email, dan keamanan akun Anda.
              </p>
            </div>

            {/* Alert Messages */}
            {message && (
              <div
                className={`w-full mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                  message.type === "success"
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                    : "bg-red-50 border border-red-100 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
                <p className="font-medium text-sm">{message.text}</p>
              </div>
            )}

            {initialLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[var(--secondary)] animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Memuat pengaturan...</p>
              </div>
            ) : (
              <div className="w-full">
                {/* Profile Summary Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-[var(--secondary)] border-4 border-white shadow-sm ring-1 ring-gray-100">
                    {name ? name.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {name || "Administrator"}
                    </h2>
                    <p className="text-gray-500 text-sm mb-3">{email}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                      <CheckCircle className="w-3 h-3" />
                      Akun Terverifikasi
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-8">
                  {/* Section 1: Personal Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                      <User className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Informasi Pribadi
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                          placeholder="Nama Lengkap"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                          placeholder="nama@sekolah.sch.id"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Security */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Keamanan
                      </h3>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-4 flex gap-3 text-orange-800 text-sm mb-6">
                      <Info className="w-5 h-5 flex-shrink-0" />
                      <p>
                        Kosongkan kolom di bawah jika Anda tidak ingin mengubah
                        kata sandi saat ini.
                      </p>
                    </div>

                    <div className="space-y-5 w-full">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Kata Sandi Saat Ini
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                            placeholder="••••••••"
                          />
                          <Lock className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Kata Sandi Baru
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">
                            Konfirmasi Kata Sandi
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-8 flex flex-col md:flex-row gap-6 items-center justify-end border-t border-gray-100">
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
                      className="flex items-center gap-2 text-gray-500 font-medium hover:text-red-500 transition-colors group text-sm cursor-pointer"
                    >
                      <X className="w-5 h-5 group-hover:text-red-500 transition-colors" />
                      <span>Batalkan</span>
                    </button>

                    <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex items-center gap-3 px-6 py-2.5 rounded-xl bg-[var(--secondary)] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[var(--secondary)]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Simpan Perubahan</span>
                      <div className="bg-white/20 rounded-full p-1 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
