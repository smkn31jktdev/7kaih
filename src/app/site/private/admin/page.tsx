"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import { Users, User, Mail } from "lucide-react";
import {
  SummaryTable,
  SummaryDetailModal,
  useSummaryData,
} from "@/app/components/dashboard/admin/kegiatan/summary/bulanan";
import {
  SemesterTable,
  SemesterDetailModal,
  useSemesterData,
} from "@/app/components/dashboard/admin/kegiatan/summary/semester";

interface Student {
  id: string;
  nama: string;
  kelas: string;
  nisn: string;
  isOnline: boolean;
}

export default function AdminDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminLoading, setAdminLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const {
    summaries,
    summaryLoading,
    summaryMonths,
    selectedSummaryMonth,
    selectedSummary,
    isSummaryModalOpen,
    handleSummaryMonthChange,
    openSummaryModal,
    closeSummaryModal,
  } = useSummaryData();

  const {
    semesterSummaries,
    loading: semesterLoading,
    semesterOptions,
    selectedSemester,
    selectedDetail: selectedSemesterDetail,
    isDetailOpen: isSemesterDetailOpen,
    handleSemesterChange,
    openDetail: openSemesterDetail,
    closeDetail: closeSemesterDetail,
  } = useSemesterData();

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          console.error("No token found");
          return;
        }
        const response = await fetch("/api/admin/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students);
          setStudentCount(data.count);
        } else {
          console.error("Failed to fetch students");
        }
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setStudentsLoading(false);
      }
    };

    const fetchAdmin = async () => {
      try {
        setAdminLoading(true);
        const token = localStorage.getItem("adminToken");
        console.log("Token found:", !!token);
        if (!token) {
          console.error("No token found");
          return;
        }
        const response = await fetch("/api/auth/admin/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Admin data:", data);
          setAdminName(data.user.nama);
          setAdminEmail(data.user.email);
        } else {
          console.error("Failed to fetch admin");
        }
      } catch (error) {
        console.error("Error fetching admin:", error);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchStudents();
    fetchAdmin();

    // Polling for real-time updates every 10 seconds
    const interval = setInterval(fetchStudents, 10000);

    return () => {
      clearInterval(interval);
    };
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
          {/* Header Section */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="mb-8 md:mb-10 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Dashboard Overview
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                Pantau aktivitas sistem sekolah dan kelola data siswa dengan
                mudah dalam satu tampilan.
              </p>
            </div>

            <div className="flex flex-col gap-6 xl:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex-1 space-y-6">
                {/* Admin Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Admin Profile */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Admin Aktif
                      </p>
                      {adminLoading ? (
                        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900 truncate">
                          {adminName || "Admin"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Students */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Total Siswa
                      </p>
                      {adminLoading ? (
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900">
                          {studentCount} Siswa
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Email */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Email Terdaftar
                      </p>
                      {adminLoading ? (
                        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p
                          className="text-base font-bold text-gray-900 truncate"
                          title={adminEmail}
                        >
                          {adminEmail || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <SummaryTable
                  summaries={summaries}
                  summaryLoading={summaryLoading}
                  summaryMonths={summaryMonths}
                  selectedSummaryMonth={selectedSummaryMonth}
                  onMonthChange={handleSummaryMonthChange}
                  onSelectSummary={openSummaryModal}
                />

                {/* Semester Summary */}
                <SemesterTable
                  summaries={semesterSummaries}
                  loading={semesterLoading}
                  semesterOptions={semesterOptions}
                  selectedSemester={selectedSemester}
                  onSemesterChange={handleSemesterChange}
                  onSelectSummary={openSemesterDetail}
                />
              </div>

              {/* Sidebar Right: Student List */}
              <div className="w-full xl:w-96 flex-shrink-0">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full">
                  <div className="p-6 border-b border-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      List Siswa
                    </h3>
                  </div>
                  <div className="p-2 h-[500px] overflow-y-auto">
                    {studentsLoading ? (
                      <div className="space-y-2 p-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 animate-pulse"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-24 bg-gray-200 rounded" />
                              <div className="h-2 w-16 bg-gray-200 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Belum ada siswa terdaftar</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {students.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                                student.isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              {student.nama.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[var(--secondary)] transition-colors">
                                {student.nama}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {student.kelas}
                              </p>
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                student.isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                              title={student.isOnline ? "Online" : "Offline"}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Summary Modal */}
      {isSummaryModalOpen && selectedSummary && (
        <SummaryDetailModal
          summary={selectedSummary}
          onClose={closeSummaryModal}
        />
      )}

      {/* Semester Detail Modal */}
      {isSemesterDetailOpen && selectedSemesterDetail && (
        <SemesterDetailModal
          summary={selectedSemesterDetail}
          onClose={closeSemesterDetail}
        />
      )}
    </div>
  );
}
