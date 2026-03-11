"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import jsPDF from "jspdf";
import {
  MakanStudentList,
  MakanDetailModal,
} from "@/app/components/dashboard/admin/kegiatan/makan";
import type { MakanStudent } from "@/app/components/dashboard/admin/kegiatan/makan/types";
import {
  extractMonthKeys,
  filterEntriesByMonth,
  formatMonthLabel,
  formatDisplayDate,
  loadPoppinsFont,
  renderPDFHeader,
} from "@/app/components/dashboard/admin/kegiatan/utils";

export default function AdminMakanPage() {
  const [students, setStudents] = useState<MakanStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  void _error;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MakanStudent | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error(
            "Token admin tidak ditemukan, silakan login kembali.",
          );
        }

        const response = await fetch("/api/admin/kegiatan/makan", {
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

        const result: MakanStudent[] = await response.json();
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

  const modalMonthLabel = useMemo(
    () => formatMonthLabel(selectedMonth),
    [selectedMonth],
  );

  const filteredEntries = useMemo(() => {
    if (!selectedStudent) return [];
    return filterEntriesByMonth(selectedStudent.entries, selectedMonth);
  }, [selectedStudent, selectedMonth]);

  const handleOpenModal = (student: MakanStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setAvailableMonths(extractMonthKeys(student.entries));
    setSelectedMonth("all");
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

    await loadPoppinsFont(doc);

    const _pageWidth = doc.internal.pageSize.getWidth();
    void _pageWidth;
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const tableTop = 95;
    const headerMainHeight = 9;
    const headerSubHeight = 9;
    const rowHeight = 12;

    const dateColWidth = 40;
    const jenisMakananColWidth = 30;
    const laukColWidth = 35;
    const sayurBuahColWidth = 30;
    const suplemenColWidth = 35;
    const tableWidth =
      dateColWidth +
      jenisMakananColWidth +
      laukColWidth +
      sayurBuahColWidth +
      suplemenColWidth;

    renderPDFHeader(
      doc,
      "Makan Sehat",
      selectedStudent.nama,
      selectedStudent.kelas,
      modalMonthLabel,
    );

    let currentY = tableTop;

    const renderHeader = (y: number) => {
      doc.setFillColor(230, 236, 247);
      doc.rect(marginX, y, tableWidth, headerMainHeight, "F");
      doc.setFillColor(244, 247, 255);
      doc.rect(marginX, y + headerMainHeight, tableWidth, headerSubHeight, "F");

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(marginX, y, tableWidth, headerMainHeight + headerSubHeight);

      doc.setFont("Poppins", "bold");
      doc.setFontSize(9);
      doc.setTextColor(45, 45, 45);

      const centerY = y + (headerMainHeight + headerSubHeight) / 2 + 1;

      doc.text("Hari/Tanggal", marginX + dateColWidth / 2, centerY, {
        align: "center",
      });
      doc.text(
        "Jenis Makanan",
        marginX + dateColWidth + jenisMakananColWidth / 2,
        centerY,
        { align: "center" },
      );
      doc.text(
        "Makan Lauk",
        marginX + dateColWidth + jenisMakananColWidth + laukColWidth / 2,
        centerY,
        { align: "center" },
      );
      doc.text(
        "Sayur/Buah",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth / 2,
        centerY,
        { align: "center" },
      );

      doc.text(
        "Minum Suplemen?",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth +
          suplemenColWidth / 2,
        y + 4,
        { align: "center" },
      );
      doc.text(
        "YA",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth +
          suplemenColWidth / 4,
        y + headerMainHeight + 6,
        { align: "center" },
      );
      doc.text(
        "TIDAK",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth +
          (3 * suplemenColWidth) / 4,
        y + headerMainHeight + 6,
        { align: "center" },
      );

      const lineYBottom = y + headerMainHeight + headerSubHeight;
      const x1 = marginX + dateColWidth;
      const x2 = x1 + jenisMakananColWidth;
      const x3 = x2 + laukColWidth;
      const x4 = x3 + sayurBuahColWidth;
      const x5 = x4 + suplemenColWidth;

      doc.line(x1, y, x1, lineYBottom);
      doc.line(x2, y, x2, lineYBottom);
      doc.line(x3, y, x3, lineYBottom);
      doc.line(x4, y, x4, lineYBottom);

      doc.line(x4, y + headerMainHeight, x5, y + headerMainHeight);
      doc.line(
        x4 + suplemenColWidth / 2,
        y + headerMainHeight,
        x4 + suplemenColWidth / 2,
        lineYBottom,
      );

      return y + headerMainHeight + headerSubHeight;
    };

    const drawCheck = (x: number, y: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(x - 1.5, y, x - 0.5, y + 1.5);
      doc.line(x - 0.5, y + 1.5, x + 2, y - 2);
    };

    currentY = renderHeader(currentY);
    doc.setFont("Poppins", "normal");
    doc.setTextColor(45, 45, 45);

    filteredEntries.forEach((entry) => {
      if (currentY > pageHeight - marginX - rowHeight) {
        doc.addPage();
        currentY = marginX;
        currentY = renderHeader(currentY);
        doc.setFont("Poppins", "normal");
      }

      const rowTop = currentY;

      doc.rect(marginX, rowTop, dateColWidth, rowHeight);
      doc.rect(marginX + dateColWidth, rowTop, jenisMakananColWidth, rowHeight);
      doc.rect(
        marginX + dateColWidth + jenisMakananColWidth,
        rowTop,
        laukColWidth,
        rowHeight,
      );
      doc.rect(
        marginX + dateColWidth + jenisMakananColWidth + laukColWidth,
        rowTop,
        sayurBuahColWidth,
        rowHeight,
      );
      doc.rect(
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth,
        rowTop,
        suplemenColWidth / 2,
        rowHeight,
      );
      doc.rect(
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth +
          suplemenColWidth / 2,
        rowTop,
        suplemenColWidth / 2,
        rowHeight,
      );

      doc.text(formatDisplayDate(entry.tanggal), marginX + 3, rowTop + 8, {
        maxWidth: dateColWidth - 6,
      });
      doc.text(
        entry.jenisMakanan || "-",
        marginX + dateColWidth + 3,
        rowTop + 8,
        { maxWidth: jenisMakananColWidth - 6 },
      );
      doc.text(
        entry.jenisLaukSayur || "-",
        marginX + dateColWidth + jenisMakananColWidth + 3,
        rowTop + 8,
        { maxWidth: laukColWidth - 6 },
      );

      if (entry.makanSayurAtauBuah) {
        drawCheck(
          marginX +
            dateColWidth +
            jenisMakananColWidth +
            laukColWidth +
            sayurBuahColWidth / 2,
          rowTop + 6,
        );
      }

      if (entry.minumSuplemen) {
        drawCheck(
          marginX +
            dateColWidth +
            jenisMakananColWidth +
            laukColWidth +
            sayurBuahColWidth +
            suplemenColWidth / 4,
          rowTop + 6,
        );
      } else {
        drawCheck(
          marginX +
            dateColWidth +
            jenisMakananColWidth +
            laukColWidth +
            sayurBuahColWidth +
            (3 * suplemenColWidth) / 4,
          rowTop + 6,
        );
      }

      currentY += rowHeight;
    });

    const safeFileName = selectedStudent.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-makan-${safeFileName}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 font-poppins text-gray-800">
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
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-[var(--secondary)] mb-4"></div>
              <p className="text-gray-500">Memuat data makan sehat...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins text-gray-800">
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

        <main className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-6">
          <div className="space-y-6">
            <MakanStudentList
              students={students}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectStudent={handleOpenModal}
            />
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <MakanDetailModal
          student={selectedStudent}
          filteredEntries={filteredEntries}
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onMonthChange={setSelectedMonth}
          onClose={handleCloseModal}
          onDownloadPDF={handleDownloadPDF}
        />
      )}
    </div>
  );
}
