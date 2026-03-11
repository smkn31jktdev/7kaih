"use client";

import { useState, useEffect } from "react";
import PiketSidebar from "@/app/components/dashboard/piket/layout/sidebar";
import PiketNavbar from "@/app/components/dashboard/piket/layout/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import DataKelas from "@/app/components/dashboard/piket/data/DataKelas";
import { DatePicker } from "@/app/components/DatePicker";

interface StudentAttendance {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  status: "hadir" | "tidak_hadir" | "belum";
  waktuAbsen: string | null;
  alasanTidakHadir: string | null;
}

export default function MonitoringSection() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Date selection
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  const fetchAttendance = async (dateStr: string) => {
    try {
      setDataLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) return;

      const response = await fetch(`/api/piket/kehadiran?tanggal=${dateStr}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);

    // Polling every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchAttendance(selectedDate);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Strict Piket Email Verification
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("adminUser");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.email !== "piket@smkn31jkt.id") {
          window.location.href = "/site/private/admin";
        }
      }
    } catch (_error) {
      void _error;
    }
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
    <div className="flex h-screen bg-gray-50">
      <PiketSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PiketNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Monitoring Absensi Siswa
                </h1>
                <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                  Pantau kehadiran, izin, dan siswa tanpa keterangan berdasarkan
                  kelas.
                </p>
              </div>

              {/* Date Picker */}
              <div className="shrink-0 w-full md:w-auto md:min-w-[200px]">
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  className="w-full"
                  align="right"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
              {/* Header section with search & filters */}
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, kelas, atau nisn..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 focus:border-[var(--secondary)] focus:ring-[var(--secondary)]/20 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* Summary mini */}
                <div className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />{" "}
                    {students.filter((s) => s.status === "hadir").length}
                  </span>
                  <div className="w-px h-4 bg-gray-200 mx-2" />
                  <span className="text-amber-600 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />{" "}
                    {students.filter((s) => s.status === "tidak_hadir").length}
                  </span>
                  <div className="w-px h-4 bg-gray-200 mx-2" />
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />{" "}
                    {students.filter((s) => s.status === "belum").length}
                  </span>
                </div>
              </div>

              {/* Data Table per Tab Kelas */}
              <div className="flex-1 overflow-auto bg-gray-50/50">
                <DataKelas
                  students={students}
                  searchQuery={searchQuery}
                  dataLoading={dataLoading}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
