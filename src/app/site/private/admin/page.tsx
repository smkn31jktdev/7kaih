"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  ArrowDownToLine,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import Select from "@/app/components/Select";

interface Student {
  id: string;
  nama: string;
  kelas: string;
  nisn: string;
  isOnline: boolean;
}

interface SummaryIndicator {
  id: string;
  label: string;
  rating: number;
  note: string;
}

interface StudentSummary {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  monthLabel: string;
  monthKey: string;
  indicators: SummaryIndicator[];
}

interface SummaryMonthOption {
  key: string;
  label: string;
}

const RATING_HEADERS = [
  { value: 1, label: "Kurang Baik" },
  { value: 2, label: "Cukup Baik" },
  { value: 3, label: "Baik" },
  { value: 4, label: "Sangat Baik" },
  { value: 5, label: "Istimewa" },
];

export default function AdminDashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryMonths, setSummaryMonths] = useState<SummaryMonthOption[]>([]);
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<
    string | null
  >(null);
  const summaryMonthRef = useRef<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<StudentSummary | null>(
    null
  );
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const updateSelectedSummaryMonth = useCallback((value: string | null) => {
    summaryMonthRef.current = value;
    setSelectedSummaryMonth(value);
  }, []);

  const selectedSummaryMonthLabel = useMemo(() => {
    if (!selectedSummaryMonth) {
      return null;
    }
    const option = summaryMonths.find(
      (month) => month.key === selectedSummaryMonth
    );
    return option?.label ?? null;
  }, [selectedSummaryMonth, summaryMonths]);

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  const fetchSummaries = useCallback(
    async (monthOverride?: string | null) => {
      let fallbackRefetch: string | null = null;
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          console.error("No token found");
          setSummaryError(
            "Token admin tidak ditemukan. Silakan login kembali."
          );
          setSummaries([]);
          return;
        }
        const monthToFetch =
          monthOverride ?? summaryMonthRef.current ?? undefined;
        const endpoint = monthToFetch
          ? `/api/admin/kegiatan/summary?month=${encodeURIComponent(
              monthToFetch
            )}`
          : "/api/admin/kegiatan/summary";
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Gagal memuat rangkuman");
        }
        const data = await response.json();
        setSummaries(data.summaries || []);
        setSummaryMonths(data.availableMonths || []);
        if (monthOverride === undefined) {
          if (!summaryMonthRef.current) {
            const fallbackMonth =
              data.selectedMonth || data.availableMonths?.[0]?.key || null;
            if (fallbackMonth) {
              updateSelectedSummaryMonth(fallbackMonth);
            }
          } else if (
            summaryMonthRef.current &&
            data.availableMonths &&
            data.availableMonths.length > 0 &&
            !data.availableMonths.some(
              (option: SummaryMonthOption) =>
                option.key === summaryMonthRef.current
            )
          ) {
            const fallbackMonth = data.availableMonths[0].key;
            fallbackRefetch = fallbackMonth;
            updateSelectedSummaryMonth(fallbackMonth);
          }
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
        setSummaryError(
          error instanceof Error ? error.message : "Terjadi kesalahan"
        );
        setSummaries([]);
      } finally {
        setSummaryLoading(false);
        if (fallbackRefetch) {
          void fetchSummaries(fallbackRefetch);
        }
      }
    },
    [updateSelectedSummaryMonth]
  );

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
    fetchSummaries();

    // Polling for real-time updates every 10 seconds
    const interval = setInterval(fetchStudents, 10000);
    const summaryInterval = setInterval(() => {
      fetchSummaries();
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(summaryInterval);
    };
  }, [fetchSummaries]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const openSummaryModal = (summary: StudentSummary) => {
    setSelectedSummary(summary);
    setIsSummaryModalOpen(true);
  };

  const closeSummaryModal = () => {
    setIsSummaryModalOpen(false);
    setSelectedSummary(null);
  };

  const handleSummaryMonthChange = (newMonth: string) => {
    if (!newMonth || newMonth === summaryMonthRef.current) {
      return;
    }
    if (isSummaryModalOpen) {
      closeSummaryModal();
    }
    updateSelectedSummaryMonth(newMonth);
    fetchSummaries(newMonth);
  };

  const handleDownloadSummaryPDF = () => {
    if (!selectedSummary) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 20;

    const summaryYear = selectedSummary.monthKey.split("-")[0] || "";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "LAPORAN PROSES 7 KEBIASAAN BAIK ANAK INDONESIA HEBAT",
      pageWidth / 2,
      cursorY,
      { align: "center" }
    );
    cursorY += 6;
    doc.setFontSize(9);
    doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, cursorY, {
      align: "center",
    });
    cursorY += 6;
    doc.text(`TAHUN ${summaryYear}`, pageWidth / 2, cursorY, {
      align: "center",
    });

    cursorY += 12;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    const infoX = 20;
    doc.text(`Nama Siswa : ${selectedSummary.nama}`, infoX, cursorY);
    cursorY += 6;
    doc.text(`NIS / NISN : ${selectedSummary.nisn || "-"}`, infoX, cursorY);
    cursorY += 6;
    doc.text(`Kelas : ${selectedSummary.kelas || "-"}`, infoX, cursorY);

    const marginX = 15;
    const columnWidths = [12, 60, 16, 16, 16, 16, 16, 28];
    const headerRowHeight = 10;
    const subHeaderHeight = 7;
    cursorY += 10;
    const tableTop = cursorY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const drawTableHeader = (startY: number) => {
      const headerY = startY;
      doc.rect(
        marginX,
        headerY,
        columnWidths[0],
        headerRowHeight + subHeaderHeight
      );
      doc.text("NO", marginX + columnWidths[0] / 2, headerY + headerRowHeight, {
        align: "center",
      });

      const indikatorX = marginX + columnWidths[0];
      doc.rect(
        indikatorX,
        headerY,
        columnWidths[1],
        headerRowHeight + subHeaderHeight
      );
      doc.text(
        "INDIKATOR",
        indikatorX + columnWidths[1] / 2,
        headerY + headerRowHeight,
        { align: "center" }
      );

      let runningX = indikatorX + columnWidths[1];
      RATING_HEADERS.forEach((header) => {
        const width = columnWidths[header.value + 1];
        doc.rect(runningX, headerY, width, headerRowHeight);
        const labelLines = doc.splitTextToSize(
          header.label,
          width - 2
        ) as string[];
        doc.setFontSize(8);
        labelLines.forEach((line: string, lineIndex: number) => {
          const lineY = headerY + 3 + lineIndex * 2.5;
          doc.text(line, runningX + width / 2, lineY, { align: "center" });
        });
        doc.setFontSize(8);
        doc.rect(runningX, headerY + headerRowHeight, width, subHeaderHeight);
        doc.text(
          String(header.value),
          runningX + width / 2,
          headerY + headerRowHeight + 3.5,
          { align: "center" }
        );
        doc.setFontSize(8);
        runningX += width;
      });

      doc.rect(
        runningX,
        headerY,
        columnWidths[columnWidths.length - 1],
        headerRowHeight + subHeaderHeight
      );
      doc.text(
        "KETERANGAN",
        runningX + columnWidths[columnWidths.length - 1] / 2,
        headerY + headerRowHeight,
        { align: "center" }
      );
      return headerY + headerRowHeight + subHeaderHeight;
    };

    // Draw initial header
    let currentY = drawTableHeader(tableTop);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lineHeight = 5;
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = 20;

    selectedSummary.indicators.forEach((indicator, index) => {
      const indicatorLines = doc.splitTextToSize(
        indicator.label,
        columnWidths[1] - 4
      ) as string[];
      const noteLines = doc.splitTextToSize(
        indicator.note || "-",
        columnWidths[columnWidths.length - 1] - 4
      ) as string[];
      const maxLines = Math.max(indicatorLines.length, noteLines.length, 1);
      const rowHeight = maxLines * lineHeight + 4;

      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 20;
        currentY = drawTableHeader(currentY);
      }

      let cellX = marginX;

      doc.rect(cellX, currentY, columnWidths[0], rowHeight);
      doc.text(
        String(index + 1),
        cellX + columnWidths[0] / 2,
        currentY + rowHeight / 2 + 1,
        { align: "center" }
      );
      cellX += columnWidths[0];

      doc.rect(cellX, currentY, columnWidths[1], rowHeight);
      indicatorLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, cellX + 2, currentY + 5 + lineIndex * lineHeight);
      });
      cellX += columnWidths[1];

      RATING_HEADERS.forEach((header) => {
        const width = columnWidths[header.value + 1];
        doc.rect(cellX, currentY, width, rowHeight);
        if (indicator.rating === header.value) {
          doc.setFont("helvetica", "bold");
          doc.text("V", cellX + width / 2, currentY + rowHeight / 2 + 1, {
            align: "center",
          });
          doc.setFont("helvetica", "normal");
        }
        cellX += width;
      });

      const noteWidth = columnWidths[columnWidths.length - 1];
      doc.rect(cellX, currentY, noteWidth, rowHeight);
      noteLines.forEach((line: string, lineIndex: number) => {
        doc.text(line, cellX + 2, currentY + 5 + lineIndex * lineHeight);
      });

      currentY += rowHeight;
    });

    currentY += 12;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Jakarta, ${selectedSummary.monthLabel}`,
      pageWidth - 70,
      currentY
    );

    currentY += 20;
    const sectionY = currentY;
    doc.text("Guru Wali", marginX, sectionY);
    doc.text("Orang Tua", pageWidth / 2 - 15, sectionY);
    doc.text("Siswa", pageWidth - 40, sectionY);

    currentY += 20;
    doc.setFont("helvetica", "bold");
    doc.text(selectedSummary.walas, marginX, currentY);
    doc.text("__________________", pageWidth / 2 - 15, currentY);
    doc.text(selectedSummary.nama, pageWidth - 40, currentY);

    doc.save(
      `laporan-kebiasaan-${selectedSummary.nama
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.pdf`
    );
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
                      <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Dashboard Admin</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pantau aktivitas sistem dan kelola data pengguna dengan
                      mudah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="flex flex-col gap-6 xl:flex-row">
                  <div className="flex-1 space-y-6">
                    {/* Recent Activity + Student List Container */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex-1">
                          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white rounded-2xl p-5 border border-indigo-100">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-indigo-500" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  Informasi Admin
                                </h3>
                                <p className="text-sm text-slate-500">
                                  Ringkasan informasi admin
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {adminLoading ? (
                                // Admin Info Skeleton Loading
                                <>
                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-emerald-50 px-4 py-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                                    <div className="flex-1">
                                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-1"></div>
                                      <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                  </div>

                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-indigo-50 px-4 py-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                                    <div className="flex-1">
                                      <div className="h-4 bg-gray-200 rounded animate-pulse w-28 mb-1"></div>
                                      <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                  </div>

                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-orange-50 px-4 py-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse"></div>
                                    <div className="flex-1">
                                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
                                      <div className="h-3 bg-gray-200 rounded animate-pulse w-36"></div>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                  </div>
                                </>
                              ) : (
                                // Actual Admin Info Content
                                <>
                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-emerald-50 px-4 py-4 hover:bg-emerald-50/50 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                      <Activity className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        Nama Admin/Guru
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {adminName || "Belum diatur"}
                                      </p>
                                    </div>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                  </div>

                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-indigo-50 px-4 py-4 hover:bg-indigo-50/50 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                      <Users className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        Banyak Siswa
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {studentCount} siswa terdaftar
                                      </p>
                                    </div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  </div>

                                  <div className="flex items-center gap-4 rounded-2xl bg-white/80 border border-orange-50 px-4 py-4 hover:bg-orange-50/50 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                                      <Activity className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        Email Admin
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {adminEmail || "Belum diatur"}
                                      </p>
                                    </div>
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Student List Section */}
                        <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0">
                          <div className="bg-white border border-slate-200 rounded-2xl h-full p-5">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-slate-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-slate-800">
                                List Siswa
                              </h3>
                            </div>
                            <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                              {studentsLoading ? (
                                // Student List Skeleton Loading
                                <div className="space-y-2">
                                  {[...Array(6)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-3 py-3 px-2 rounded-lg border-b border-slate-200/70 last:border-b-0"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : students.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                                  Belum ada data siswa.
                                </div>
                              ) : (
                                <ul className="space-y-2">
                                  {students.map((student) => (
                                    <li
                                      key={student.id}
                                      className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-200/70 last:border-b-0"
                                    >
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                        {student.nama.charAt(0)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate">
                                          {student.nama}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {student.kelas}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`w-2 h-2 rounded-full ${
                                            student.isOnline
                                              ? "bg-green-500"
                                              : "bg-gray-400"
                                          }`}
                                        ></div>
                                        <span className="text-xs text-slate-500">
                                          {student.isOnline
                                            ? "Online"
                                            : "Offline"}
                                        </span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Summary Report Container */}
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <div className="flex-1">
                      <div className="bg-gradient-to-r from-violet-50 via-purple-50 to-white rounded-2xl p-5 border border-violet-100">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              Rangkuman Laporan Siswa
                            </h3>
                            <p className="text-sm text-slate-500">
                              Pilih siswa untuk melihat laporan 7 kebiasaan baik
                              dan unduh PDF resmi.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div className="text-sm text-slate-600">
                            {selectedSummaryMonth && selectedSummaryMonthLabel
                              ? `Menampilkan laporan bulan ${selectedSummaryMonthLabel}`
                              : summaryMonths.length > 0
                              ? "Pilih bulan untuk melihat laporan."
                              : "Belum ada data bulan tersedia."}
                          </div>
                          <div className="w-full sm:w-64">
                            <Select
                              value={selectedSummaryMonth ?? ""}
                              onChange={handleSummaryMonthChange}
                              options={summaryMonths.map((month) => ({
                                value: month.key,
                                label: month.label,
                              }))}
                              placeholder={
                                summaryMonths.length === 0
                                  ? "Tidak ada data bulan"
                                  : "Pilih bulan laporan"
                              }
                              disabled={
                                summaryMonths.length === 0 || summaryLoading
                              }
                              className="text-sm"
                              searchable
                            />
                          </div>
                        </div>

                        {summaryLoading ? (
                          // Summary Skeleton Loading
                          <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-violet-50 px-4 py-4"
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse shrink-0"></div>
                                  <div className="min-w-0">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
                                    <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                                  </div>
                                </div>
                                <div className="h-8 bg-gray-200 rounded-full animate-pulse w-24"></div>
                              </div>
                            ))}
                          </div>
                        ) : summaryError ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                            {summaryError}
                          </div>
                        ) : summaries.length === 0 ? (
                          <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                            Belum ada rangkuman laporan.
                          </div>
                        ) : (
                          <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                            <div className="space-y-3">
                              {summaries.map((summary) => (
                                <div
                                  key={summary.nisn}
                                  className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-violet-50 px-4 py-4 hover:bg-violet-50/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                                      <FileText className="w-6 h-6 text-violet-700" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 truncate">
                                        {summary.nama}
                                      </p>
                                      <p className="text-xs text-slate-500 truncate">
                                        {summary.kelas || "-"} •{" "}
                                        {summary.monthLabel}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => openSummaryModal(summary)}
                                    className="rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                                  >
                                    Lihat Laporan
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      {isSummaryModalOpen && selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 pt-10 pb-6 sm:pb-10">
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div
              className="flex items-center justify-between gap-4 rounded-t-3xl px-6 py-5 flex-shrink-0"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Laporan 7 Kebiasaan Baik
                </h2>
                <p className="text-sm text-white/80">
                  {selectedSummary.nama} • {selectedSummary.monthLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSummaryPDF}
                  className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  title="Download PDF"
                >
                  <ArrowDownToLine className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={closeSummaryModal}
                  className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Nama
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedSummary.nama}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      NIS / NISN
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedSummary.nisn || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Kelas
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedSummary.kelas || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Bulan
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedSummary.monthLabel}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full table-fixed">
                    <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="w-12 border-b border-r border-slate-200 px-4 py-3 text-left">
                          No
                        </th>
                        <th className="w-56 border-b border-r border-slate-200 px-4 py-3 text-left">
                          Indikator
                        </th>
                        {RATING_HEADERS.map((header) => (
                          <th
                            key={`label-${header.value}`}
                            className="border-b border-r border-slate-200 px-4 py-3 text-center"
                          >
                            {header.label}
                          </th>
                        ))}
                        <th className="border-b border-slate-200 px-4 py-3 text-left">
                          Keterangan
                        </th>
                      </tr>
                      <tr>
                        <th className="border-r border-slate-200 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          &nbsp;
                        </th>
                        <th className="border-r border-slate-200 px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          &nbsp;
                        </th>
                        {RATING_HEADERS.map((header) => (
                          <th
                            key={`value-${header.value}`}
                            className="border-r border-slate-200 px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500 last:border-r-0"
                          >
                            {header.value}
                          </th>
                        ))}
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                          &nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-slate-700">
                      {selectedSummary.indicators.map((indicator, index) => (
                        <tr
                          key={indicator.id}
                          className="odd:bg-white even:bg-slate-50"
                        >
                          <td className="border-t border-r border-slate-200 px-4 py-3 align-top">
                            {index + 1}
                          </td>
                          <td className="border-t border-r border-slate-200 px-4 py-3 align-top text-sm font-medium text-slate-700">
                            {indicator.label}
                          </td>
                          {RATING_HEADERS.map((header) => (
                            <td
                              key={`${indicator.id}-${header.value}`}
                              className="border-t border-r border-slate-200 px-4 py-3 text-center align-top"
                            >
                              {indicator.rating === header.value ? "V" : ""}
                            </td>
                          ))}
                          <td className="border-t border-slate-200 px-4 py-3 align-top text-sm text-slate-600">
                            <span className="block whitespace-pre-wrap text-xs sm:text-sm">
                              {indicator.note}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeSummaryModal}
                    className="rounded-full bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
