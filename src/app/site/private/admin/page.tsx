"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  Users,
  FileText,
  User,
  Mail,
  ChevronRight,
  Download,
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
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Laporan Bulanan
                        </h3>
                      </div>
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
                            ? "Menunggu data..."
                            : "Pilih Bulan"
                        }
                        disabled={summaryMonths.length === 0 || summaryLoading}
                        className="text-sm"
                        searchable
                      />
                    </div>
                  </div>

                  <div className="p-0">
                    {summaryLoading ? (
                      <div className="p-8 space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                              <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : summaries.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">
                          Belum ada laporan
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Pilih bulan lain atau tunggu data masuk.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {summaries.map((summary) => (
                          <div
                            key={summary.nisn}
                            className="group flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => openSummaryModal(summary)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                                {summary.nama.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 group-hover:text-[var(--secondary)] transition-colors">
                                  {summary.nama}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                  <span>{summary.kelas}</span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span>{summary.nisn}</span>
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Rangkuman Kebiasaan
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedSummary.nama} • {selectedSummary.kelas}
                </p>
              </div>
              <button
                onClick={closeSummaryModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {selectedSummary.indicators.map((indicator, index) => (
                  <div
                    key={indicator.id}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {indicator.label}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            Nilai: {indicator.rating}
                          </span>
                          <span className="text-xs text-gray-400">
                            (
                            {
                              RATING_HEADERS.find(
                                (h) => h.value === indicator.rating
                              )?.label
                            }
                            )
                          </span>
                        </div>
                        {indicator.note && (
                          <div className="text-xs text-gray-500 bg-white p-3 rounded-xl border border-gray-100 italic">
                            &quot;{indicator.note}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end gap-3">
              <button
                onClick={closeSummaryModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handleDownloadSummaryPDF}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[var(--secondary)] hover:bg-teal-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-teal-200"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
