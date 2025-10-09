"use client";

import { useState } from "react";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";

export default function StudentDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StudentSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <StudentNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Dashboard Siswa
            </h1>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example cards - you can replace with actual content */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kegiatan Hari Ini
                </h3>
                <p className="text-3xl font-bold text-green-600">5/7</p>
                <p className="text-sm text-gray-600">Kebiasaan selesai</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Poin Bulan Ini
                </h3>
                <p className="text-3xl font-bold text-blue-600">1,250</p>
                <p className="text-sm text-gray-600">Total poin</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Rangking Kelas
                </h3>
                <p className="text-3xl font-bold text-orange-600">#3</p>
                <p className="text-sm text-gray-600">Posisi saat ini</p>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Aktivitas Terbaru
              </h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Bangun Pagi
                          </p>
                          <p className="text-sm text-gray-600">
                            Hari ini, 04:00
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            ✓
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Beribadah</p>
                          <p className="text-sm text-gray-600">
                            Hari ini, 05:00
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        +10 poin
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-400 font-semibold">○</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Makan Sehat
                          </p>
                          <p className="text-sm text-gray-600">Belum selesai</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-400">
                        0 poin
                      </span>
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
