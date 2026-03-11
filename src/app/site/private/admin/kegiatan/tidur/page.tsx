"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import jsPDF from "jspdf";
import {
  TidurStudentList,
  TidurDetailModal,
} from "@/app/components/dashboard/admin/kegiatan/tidur";
import type { TidurStudent } from "@/app/components/dashboard/admin/kegiatan/tidur/types";
import {
  extractMonthKeys,
  filterEntriesByMonth,
  formatMonthLabel,
  formatDisplayDate,
  loadPoppinsFont,
  renderPDFHeader,
} from "@/app/components/dashboard/admin/kegiatan/utils";

export default function AdminTidurPage() {
  const [students, setStudents] = useState<TidurStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<TidurStudent | null>(
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

        const response = await fetch("/api/admin/kegiatan/tidur", {
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

        const result: TidurStudent[] = await response.json();
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

  const handleOpenModal = (student: TidurStudent) => {
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
    const dateColWidth = 60;
    const timeColWidth = 55;

    renderPDFHeader(
      doc,
      "Tidur Malam",
      selectedStudent.nama,
      selectedStudent.kelas,
      modalMonthLabel,
    );

    const renderHeader = (y: number) => {
      const tableWidth = pageWidth - 2 * marginX;
      doc.setFillColor(240, 240, 240);
      doc.rect(marginX, y, tableWidth, 10, "F");
      doc.setFont("Poppins", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      doc.text("Tanggal", marginX + 5, y + 7);
      doc.text("Jam Tidur", marginX + dateColWidth + 5, y + 7);
      doc.text("Berdoa", marginX + dateColWidth + timeColWidth + 5, y + 7);

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
      doc.text(entry.jamTidur || "-", marginX + dateColWidth + 5, currentY + 8);
      doc.text(
        entry.berdoa ? "Ya" : "Tidak",
        marginX + dateColWidth + timeColWidth + 5,
        currentY + 8,
      );

      doc.setDrawColor(230, 230, 230);
      doc.line(marginX, currentY + 12, pageWidth - marginX, currentY + 12);
      currentY += 12;
    });

    const safeFileName = selectedStudent.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-tidur-${safeFileName}.pdf`);
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
              <p className="text-gray-500">Memuat data tidur malam...</p>
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
            <TidurStudentList
              students={students}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectStudent={handleOpenModal}
            />
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <TidurDetailModal
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
