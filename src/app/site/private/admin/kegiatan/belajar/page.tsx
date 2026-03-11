"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import jsPDF from "jspdf";
import {
  BelajarStudentList,
  BelajarDetailModal,
} from "@/app/components/dashboard/admin/kegiatan/belajar";
import type { BelajarStudent } from "@/app/components/dashboard/admin/kegiatan/belajar/types";
import { BELAJAR_DESKRIPSI_MAP } from "@/app/components/dashboard/admin/kegiatan/belajar/types";
import {
  extractMonthKeys,
  filterEntriesByMonth,
  formatMonthLabel,
  formatDisplayDate,
  loadPoppinsFont,
  renderPDFHeader,
} from "@/app/components/dashboard/admin/kegiatan/utils";

export default function AdminBelajarPage() {
  const [students, setStudents] = useState<BelajarStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<BelajarStudent | null>(
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

  const modalMonthLabel = useMemo(
    () => formatMonthLabel(selectedMonth),
    [selectedMonth],
  );

  const filteredEntries = useMemo(() => {
    if (!selectedStudent) return [];
    return filterEntriesByMonth(selectedStudent.entries, selectedMonth);
  }, [selectedStudent, selectedMonth]);

  const handleOpenModal = (student: BelajarStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setAvailableMonths(extractMonthKeys(student.entries));
    setSelectedMonth("all");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const getDeskripsiLabel = (key: string) => {
    return BELAJAR_DESKRIPSI_MAP[key] || key;
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
    const rowHeight = 12;

    const dateColWidth = 40;
    const statusColWidth = 30;
    const descColWidth = 100;
    const tableWidth = dateColWidth + statusColWidth + descColWidth;

    renderPDFHeader(
      doc,
      "Belajar Mandiri",
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
      doc.text("Dilakukan?", marginX + dateColWidth + 5, y + 7);
      doc.text(
        "Jenis Kegiatan Belajar",
        marginX + dateColWidth + statusColWidth + 5,
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

      const descText = getDeskripsiLabel(entry.deskripsi) || "-";
      const splitDesc = doc.splitTextToSize(descText, descColWidth - 5);
      const splitHeight = splitDesc.length * 5;
      const dynamicRowHeight = Math.max(rowHeight, splitHeight + 6);

      doc.text(formatDisplayDate(entry.tanggal), marginX + 5, currentY + 8);
      doc.text(
        entry.yaAtauTidak ? "Ya" : "Tidak",
        marginX + dateColWidth + 5,
        currentY + 8,
      );
      doc.text(
        splitDesc,
        marginX + dateColWidth + statusColWidth + 5,
        currentY + 8,
      );

      doc.setDrawColor(230, 230, 230);
      doc.line(
        marginX,
        currentY + dynamicRowHeight,
        pageWidth - marginX,
        currentY + dynamicRowHeight,
      );
      currentY += dynamicRowHeight;
    });

    const safeFileName = selectedStudent.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-belajar-${safeFileName}.pdf`);
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
              <p className="text-gray-500">Memuat data belajar mandiri...</p>
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
            <BelajarStudentList
              students={students}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectStudent={handleOpenModal}
            />
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <BelajarDetailModal
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
