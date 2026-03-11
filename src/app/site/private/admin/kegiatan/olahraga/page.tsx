"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import jsPDF from "jspdf";
import {
  OlahragaStudentList,
  OlahragaDetailModal,
} from "@/app/components/dashboard/admin/kegiatan/olahraga";
import type { OlahragaStudent } from "@/app/components/dashboard/admin/kegiatan/olahraga/types";
import {
  extractMonthKeys,
  filterEntriesByMonth,
  formatMonthLabel,
  formatDisplayDate,
  loadPoppinsFont,
  renderPDFHeader,
} from "@/app/components/dashboard/admin/kegiatan/utils";

export default function AdminOlahragaPage() {
  const [students, setStudents] = useState<OlahragaStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  void _error;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<OlahragaStudent | null>(null);
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

        const response = await fetch("/api/admin/kegiatan/olahraga", {
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

        const result: OlahragaStudent[] = await response.json();
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

  const handleOpenModal = (student: OlahragaStudent) => {
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

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const tableTop = 95;

    const dateColWidth = 40;
    const jenisColWidth = 50;
    const descColWidth = 50;
    const timeColWidth = 30;
    const tableWidth =
      dateColWidth + jenisColWidth + descColWidth + timeColWidth;

    renderPDFHeader(
      doc,
      "Olahraga",
      selectedStudent.nama,
      selectedStudent.kelas,
      modalMonthLabel,
    );

    const renderHeader = (y: number) => {
      doc.setFillColor(240, 240, 240);
      doc.rect(marginX, y, tableWidth, 10, "F");
      doc.setFont("Poppins", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      doc.text("Hari/Tanggal", marginX + 5, y + 7);
      doc.text("Jenis Olahraga", marginX + dateColWidth + 5, y + 7);
      doc.text("Deskripsi", marginX + dateColWidth + jenisColWidth + 5, y + 7);
      doc.text(
        "Waktu",
        marginX + dateColWidth + jenisColWidth + descColWidth + 5,
        y + 7,
      );

      return y + 10;
    };

    let currentY = tableTop;
    currentY = renderHeader(currentY);
    doc.setFont("Poppins", "normal");

    filteredEntries.forEach((entry) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        currentY = renderHeader(currentY);
        doc.setFont("Poppins", "normal");
      }

      doc.text(formatDisplayDate(entry.tanggal), marginX + 5, currentY + 8);
      doc.text(
        entry.jenisOlahraga || "-",
        marginX + dateColWidth + 5,
        currentY + 8,
        { maxWidth: jenisColWidth - 5 },
      );
      doc.text(
        entry.deskripsi || "-",
        marginX + dateColWidth + jenisColWidth + 5,
        currentY + 8,
        { maxWidth: descColWidth - 5 },
      );
      doc.text(
        entry.waktu ? `${entry.waktu} Menit` : "-",
        marginX + dateColWidth + jenisColWidth + descColWidth + 5,
        currentY + 8,
      );

      doc.setDrawColor(230, 230, 230);
      doc.line(marginX, currentY + 12, pageWidth - marginX, currentY + 12);
      currentY += 12;
    });

    const safeFileName = selectedStudent.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-olahraga-${safeFileName}.pdf`);
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
              <p className="text-gray-500">Memuat data olahraga...</p>
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
            <OlahragaStudentList
              students={students}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectStudent={handleOpenModal}
            />
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <OlahragaDetailModal
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
