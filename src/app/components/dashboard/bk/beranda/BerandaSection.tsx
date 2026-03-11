"use client";

import { useState, useEffect } from "react";
import BKSidebar from "../layout/sidebar";
import BKNavbar from "../layout/navbar";
import { User, MessageCircleQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";

export default function BKBerandaSection() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [guruName, setGuruName] = useState("");
  const [loading, setLoading] = useState(true);

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        // We fallback to adminToken since BK registers as part of the admin panel
        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("piketToken");
        if (!token) return;
        const response = await fetch("/api/auth/admin/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setGuruName(data.user.nama);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-poppins">
      <BKSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BKNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="mb-8 md:mb-10 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Beranda Guru BK / Piket
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                Selamat datang di halaman bimbingan dan konseling. Anda bisa
                memantau dan menindaklanjuti keluhan / aduan siswa di sini.
              </p>
            </div>

            <div className="flex flex-col xl:flex-row gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profil Guru */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        Profil Akun
                      </p>
                      {loading ? (
                        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-lg font-bold text-gray-900 truncate">
                          {guruName || "Guru BK"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick Access ke Chat */}
                  <div className="bg-gradient-to-br from-[var(--secondary)] to-teal-500 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                        <MessageCircleQuestion className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-teal-50 mb-1">
                          Aduan Siswa
                        </p>
                        <p className="text-lg font-bold">Pantau Chat</p>
                      </div>
                    </div>
                    <Link
                      href="/site/private/bk/chat"
                      className="relative z-10 w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-[var(--secondary)] rounded-full flex items-center justify-center transition-all duration-300"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Informasi Sistem
                  </h3>
                  <div className="space-y-4 text-gray-600">
                    <p>
                      Sebagai Guru BK / Piket, tugas utama Anda adalah
                      menanggapi laporan atau keluhan yang dikirimkan oleh
                      siswa, baik secara langsung maupun yang diteruskan oleh
                      guru wali kelas mereka.
                    </p>
                    <p>
                      Pastikan Anda mengecek menu{" "}
                      <strong>Aduan Siswa (Chat)</strong> secara berkala agar
                      setiap permasalahan dapat segera ditindaklanjuti.
                    </p>
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
