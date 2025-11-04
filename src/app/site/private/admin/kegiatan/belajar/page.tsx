"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import {
  Check,
  MoveRight,
  BookOpen,
  User,
  X,
  ArrowDownToLine,
} from "lucide-react";
import jsPDF from "jspdf";
import Skeleton from "react-loading-skeleton";

const BELAJAR_DESKRIPSI_MAP: Record<string, string> = {
  "membaca-kitab-suci": "Membaca kitab suci ( sesuai Agama yang dianutnya )",
  "membaca-buku-bacaan": "Membaca buku bacaan / novel / hobby / sejarah dsb.",
  "membaca-buku-pelajaran": "Membaca buku mata pelajaran",
  "mengerjakan-tugas": "Mengerjakan tugas / PR",
  lainnya: "",
};

interface BelajarEntry {
  tanggal: string;
  yaAtauTidak: boolean;
  deskripsi: string;
}

interface BelajarStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BelajarEntry[];
}

export default function AdminBelajarPage() {
  const [students, setStudents] = useState<BelajarStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<BelajarStudent | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error(
            "Token admin tidak ditemukan, silakan login kembali."
          );
        }

        const response = await fetch("/api/admin/kegiatan/belajar", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          throw new Error("Sesi admin berakhir, silakan login kembali.");
        }

        if (!response.ok) {
          throw new Error("Gagal mengambil data");
        }

        const result: BelajarStudent[] = await response.json();
        setStudents(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const modalMonthLabel = useMemo(() => {
    if (!selectedStudent || selectedStudent.entries.length === 0) {
      return "-";
    }

    const firstDate = new Date(selectedStudent.entries[0].tanggal);
    if (Number.isNaN(firstDate.getTime())) {
      return selectedStudent.entries[0].tanggal;
    }

    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(firstDate);
  }, [selectedStudent]);

  if (loading) {
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
            {/* Header Section */}
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
                <div
                  style={{ backgroundColor: "var(--secondary)" }}
                  className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-full text-center">
                      <Skeleton height={32} width={300} className="mb-2" />
                      <Skeleton height={20} width={400} />
                    </div>
                  </div>
                </div>

                <div className="p-2 sm:p-4">
                  <div className="flex flex-col gap-6 xl:flex-row">
                    <div className="flex-1 space-y-6">
                      {/* Data Belajar Container */}
                      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl p-5 border border-purple-100">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                                  <BookOpen className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                  <Skeleton height={20} width={200} />
                                  <Skeleton height={16} width={250} />
                                </div>
                              </div>

                              <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                                <div className="space-y-3">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-purple-50 px-4 py-4"
                                    >
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                          <Skeleton
                                            circle
                                            height={48}
                                            width={48}
                                          />
                                        </div>
                                        <div className="min-w-0">
                                          <Skeleton height={16} width={120} />
                                          <Skeleton height={12} width={80} />
                                        </div>
                                      </div>
                                      <Skeleton height={32} width={80} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
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

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  const handleOpenModal = (student: BelajarStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDownloadPDF = async () => {
    if (!selectedStudent) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    try {
      const regularUrl =
        "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.ttf";
      const boldUrl =
        "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.ttf";

      const [regularResponse, boldResponse] = await Promise.all([
        fetch(regularUrl),
        fetch(boldUrl),
      ]);

      const regularBuffer = await regularResponse.arrayBuffer();
      const boldBuffer = await boldResponse.arrayBuffer();

      const regularBase64 = btoa(
        String.fromCharCode(...new Uint8Array(regularBuffer))
      );
      const boldBase64 = btoa(
        String.fromCharCode(...new Uint8Array(boldBuffer))
      );

      doc.addFileToVFS("Poppins-Regular.ttf", regularBase64);
      doc.addFileToVFS("Poppins-Bold.ttf", boldBase64);

      doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
      doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
    } catch (error) {
      console.error(
        "Failed to load Poppins font, using default Helvetica",
        error
      );
    }
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const tableWidth = 170;
    const tableTop = 95;
    const headerMainHeight = 9;
    const headerSubHeight = 9;
    const rowHeight = 12;
    const dateColWidth = 60;
    const learnColWidth = 50;
    const descColWidth = 60;
    const rowsToRender = Math.max(selectedStudent.entries.length, 10);

    const renderBaseLayout = () => {
      const pageCenterX = pageWidth / 2;

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // School/Organization Name
      doc.setFont("Poppins", "bold");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text("SMK NEGERI 31 JAKARTA", pageCenterX, 20, { align: "center" });

      // Main Title
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("JURNAL KEBIASAAN BAIK", pageCenterX, 35, { align: "center" });

      // Subtitle
      doc.setFont("Poppins", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("Belajar", pageCenterX, 45, { align: "center" });

      // Student Information Section
      doc.setFillColor(250, 250, 250);
      doc.rect(marginX, 60, pageWidth - 2 * marginX, 25, "F");
      doc.setDrawColor(22, 62, 130);
      doc.setLineWidth(0.5);
      doc.rect(marginX, 60, pageWidth - 2 * marginX, 25);

      doc.setFont("Poppins", "bold");
      doc.setTextColor(22, 62, 130);
      doc.setFontSize(11);

      const infoStartY = 70;
      const infoSpacing = 5;
      const labelX = marginX + 5;
      const valueX = marginX + 30;

      doc.text("Nama Siswa", labelX, infoStartY);
      doc.text("Kelas", labelX, infoStartY + infoSpacing);
      doc.text("Periode", labelX, infoStartY + infoSpacing * 2);

      doc.setFont("Poppins", "bold");
      doc.setTextColor(45, 45, 45);
      doc.text(selectedStudent.nama || "-", valueX, infoStartY);
      doc.text(selectedStudent.kelas || "-", valueX, infoStartY + infoSpacing);
      doc.text(modalMonthLabel || "-", valueX, infoStartY + infoSpacing * 2);
    };

    const renderTableHeader = () => {
      const startX = marginX;
      const startY = tableTop;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.setFillColor(230, 236, 247);
      doc.rect(startX, startY, tableWidth, headerMainHeight, "F");
      doc.setFillColor(244, 247, 255);
      doc.rect(
        startX,
        startY + headerMainHeight,
        tableWidth,
        headerSubHeight,
        "F"
      );
      doc.rect(startX, startY, tableWidth, headerMainHeight + headerSubHeight);
      doc.line(
        startX + dateColWidth,
        startY,
        startX + dateColWidth,
        startY + headerMainHeight + headerSubHeight
      );
      doc.line(
        startX + dateColWidth + learnColWidth,
        startY,
        startX + dateColWidth + learnColWidth,
        startY + headerMainHeight + headerSubHeight
      );

      doc.setFont("Poppins", "bold");
      doc.setTextColor(45, 45, 45);
      doc.setFontSize(10);

      const combinedHeaderCenter =
        startY + (headerMainHeight + headerSubHeight) / 2 + 1;

      const titleY = combinedHeaderCenter - 2;
      const subHeaderCenter =
        startY + headerMainHeight + headerSubHeight / 2 + 1;

      doc.text(
        "Hari/Tanggal",
        startX + dateColWidth / 2,
        combinedHeaderCenter,
        { align: "center" }
      );
      doc.text("Belajar", startX + dateColWidth + learnColWidth / 2, titleY, {
        align: "center",
      });
      doc.text(
        "Deskripsi",
        startX + dateColWidth + learnColWidth + descColWidth / 2,
        combinedHeaderCenter,
        { align: "center" }
      );

      doc.setFontSize(11);

      doc.text(
        "YA",
        startX + dateColWidth + learnColWidth / 3,
        subHeaderCenter,
        { align: "center" }
      );
      doc.text(
        "TIDAK",
        startX + dateColWidth + (2 * learnColWidth) / 3,
        subHeaderCenter,
        { align: "center" }
      );

      return startY + headerMainHeight + headerSubHeight;
    };

    const drawChoiceMarker = (centerX: number, centerY: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(centerX - 2, centerY - 0.5, centerX - 0.5, centerY + 1);
      doc.line(centerX - 0.5, centerY + 1, centerX + 2, centerY - 1.5);
    };

    renderBaseLayout();
    let currentY = renderTableHeader();
    doc.setFont("Poppins", "normal");
    doc.setFontSize(11);
    doc.setTextColor(45, 45, 45);
    doc.setLineWidth(0.3);

    for (let index = 0; index < rowsToRender; index += 1) {
      if (currentY + rowHeight > pageHeight - marginX) {
        doc.addPage();
        renderBaseLayout();
        currentY = renderTableHeader();
        doc.setFont("Poppins", "normal");
        doc.setFontSize(11);
        doc.setTextColor(45, 45, 45);
        doc.setLineWidth(0.3);
      }

      const entry = selectedStudent.entries[index];
      const rowTop = currentY;

      doc.rect(marginX, rowTop, dateColWidth, rowHeight);
      doc.rect(marginX + dateColWidth, rowTop, learnColWidth / 2, rowHeight);
      doc.rect(
        marginX + dateColWidth + learnColWidth / 2,
        rowTop,
        learnColWidth / 2,
        rowHeight
      );
      doc.rect(
        marginX + dateColWidth + learnColWidth,
        rowTop,
        descColWidth,
        rowHeight
      );

      if (entry) {
        doc.text(
          formatDisplayDate(entry.tanggal),
          marginX + 3,
          rowTop + rowHeight / 2 + 1,
          {
            align: "left",
            maxWidth: dateColWidth - 6,
          }
        );

        const yaCenterX = marginX + dateColWidth + learnColWidth / 4;
        const tidakCenterX = marginX + dateColWidth + (3 * learnColWidth) / 4;
        const centerY = rowTop + rowHeight / 2;

        if (entry.yaAtauTidak) {
          drawChoiceMarker(yaCenterX, centerY);
        } else {
          drawChoiceMarker(tidakCenterX, centerY);
        }

        const descText =
          BELAJAR_DESKRIPSI_MAP[entry.deskripsi] || entry.deskripsi || "-";
        const descLines = doc.splitTextToSize(descText, descColWidth - 6);
        doc.text(
          descLines,
          marginX + dateColWidth + learnColWidth + 3,
          rowTop + 4
        );
      }

      currentY += rowHeight;
    }

    const safeFileName = selectedStudent.nama
      ? selectedStudent.nama.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()
      : "siswa";
    doc.save(`jurnal-belajar-${safeFileName}.pdf`);
  };

  const formatDisplayDate = (value: string) => {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parsed);
    }

    return value;
  };

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

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
                      <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Data Belajar Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pantau aktivitas belajar siswa.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="flex flex-col gap-6 xl:flex-row">
                  <div className="flex-1 space-y-6">
                    {/* Data Belajar Container */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl p-5 border border-indigo-100">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  Daftar Siswa Belajar
                                </h3>
                                <p className="text-sm text-slate-500">
                                  Pilih siswa untuk melihat jurnal harian mereka
                                </p>
                              </div>
                            </div>

                            {students.length === 0 ? (
                              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                                Belum ada data belajar.
                              </div>
                            ) : (
                              <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                                <div className="space-y-3">
                                  {students.map((student) => (
                                    <div
                                      key={student.nisn}
                                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-purple-50 px-4 py-4 hover:bg-purple-50/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                                          <User className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-slate-800 truncate">
                                            {student.nama}
                                          </p>
                                          <p className="text-xs text-slate-500 truncate">
                                            {student.kelas ||
                                              "Kelas belum diisi"}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenModal(student)}
                                        className="flex items-center gap-2 rounded-full bg-purple-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                                      >
                                        Detail
                                        <MoveRight className="w-4 h-4" />
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
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 pt-10 pb-6 sm:pb-10">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 rounded-t-3xl px-6 py-5 bg-gradient-to-r from-purple-500 to-violet-500">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Jurnal Belajar
                </h2>
                <p className="text-sm text-white/80">
                  Data kebiasaan dari kebiasaan_hebat
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  title="Download PDF"
                >
                  <ArrowDownToLine className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Nama
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedStudent.nama}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    NISN
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedStudent.nisn}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Kelas
                  </p>
                  <p className="font-semibold text-slate-800">
                    {selectedStudent.kelas || "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Bulan
                  </p>
                  <p className="font-semibold text-slate-800">
                    {modalMonthLabel}
                  </p>
                </div>
              </div>

              <div className="overflow-y-auto max-h-96 rounded-2xl border border-slate-200">
                <table className="min-w-full table-fixed">
                  <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="w-2/6 border-r border-slate-200 px-4 py-3 text-left">
                        Hari/Tanggal
                      </th>
                      <th className="w-1/6 border-r border-slate-200 px-4 py-3 text-center">
                        Ya
                      </th>
                      <th className="w-1/6 border-r border-slate-200 px-4 py-3 text-center">
                        Tidak
                      </th>
                      <th className="w-2/6 px-4 py-3 text-left">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {selectedStudent.entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Belum ada catatan belajar.
                        </td>
                      </tr>
                    ) : (
                      selectedStudent.entries.map((entry, index) => (
                        <tr
                          key={`${entry.tanggal}-${index}`}
                          className="odd:bg-white even:bg-slate-50"
                        >
                          <td className="border-t border-slate-200 px-4 py-3 align-top">
                            {formatDisplayDate(entry.tanggal)}
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-center align-top">
                            {entry.yaAtauTidak ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-600" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 text-center align-top">
                            {!entry.yaAtauTidak ? (
                              <Check className="mx-auto h-4 w-4 text-rose-600" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="border-t border-slate-200 px-4 py-3 align-top">
                            {BELAJAR_DESKRIPSI_MAP[entry.deskripsi] ||
                              entry.deskripsi ||
                              "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
