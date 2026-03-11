"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import jsPDF from "jspdf";
import {
  BeribadahStudentList,
  HarianDetailModal,
  RamadhanDetailModal,
} from "@/app/components/dashboard/admin/kegiatan/beribadah";
import type {
  BeribadahStudent,
  BeribadahEntry,
  RamadhanStudent,
  RamadhanResponse,
  RamadhanPeriod,
  AvailableYear,
  ViewMode,
} from "@/app/components/dashboard/admin/kegiatan/beribadah/types";
import { getRatingLabel } from "@/app/components/dashboard/admin/kegiatan/beribadah/types";
import {
  extractMonthKeys,
  filterEntriesByMonth,
  formatMonthLabel,
  loadPoppinsFont,
} from "@/app/components/dashboard/admin/kegiatan/utils";

export default function AdminBeribadahPage() {
  // ========== Common State ==========
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("harian");

  // ========== Regular Beribadah State ==========
  const [students, setStudents] = useState<BeribadahStudent[]>([]);
  const [loadingRegular, setLoadingRegular] = useState(true);
  const [errorRegular, setErrorRegular] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<BeribadahStudent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // ========== Ramadhan State ==========
  const [ramadhanStudents, setRamadhanStudents] = useState<RamadhanStudent[]>(
    [],
  );
  const [loadingRamadhan, setLoadingRamadhan] = useState(true);
  const [errorRamadhan, setErrorRamadhan] = useState<string | null>(null);
  const [selectedRamadhanStudent, setSelectedRamadhanStudent] =
    useState<RamadhanStudent | null>(null);
  const [isRamadhanModalOpen, setIsRamadhanModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [availableYears, setAvailableYears] = useState<AvailableYear[]>([]);
  const [period, setPeriod] = useState<RamadhanPeriod | null>(null);

  // ========== Fetch Regular Beribadah ==========
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRegular(true);
        setErrorRegular(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error(
            "Token admin tidak ditemukan, silakan login kembali.",
          );
        }

        const response = await fetch("/api/admin/kegiatan/beribadah", {
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

        const result: BeribadahStudent[] = await response.json();
        setStudents(result);
      } catch (err) {
        setErrorRegular(
          err instanceof Error ? err.message : "Terjadi kesalahan",
        );
        setStudents([]);
      } finally {
        setLoadingRegular(false);
      }
    };

    fetchData();
  }, []);

  // ========== Fetch Ramadhan Data ==========
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingRamadhan(true);
        setErrorRamadhan(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error(
            "Token admin tidak ditemukan, silakan login kembali.",
          );
        }

        const response = await fetch(
          `/api/admin/kegiatan/ramadhan?year=${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          throw new Error("Sesi admin berakhir, silakan login kembali.");
        }

        if (!response.ok) {
          throw new Error("Gagal mengambil data");
        }

        const result: RamadhanResponse = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setRamadhanStudents(result.data || []);
        setPeriod(result.period);
        setAvailableYears(result.availableYears || []);
      } catch (err) {
        setErrorRamadhan(
          err instanceof Error ? err.message : "Terjadi kesalahan",
        );
        setRamadhanStudents([]);
      } finally {
        setLoadingRamadhan(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // ========== Computed Values ==========
  const modalMonthLabel = useMemo(
    () => formatMonthLabel(selectedMonth),
    [selectedMonth],
  );

  const filteredEntries = useMemo(() => {
    if (!selectedStudent) return [];
    return filterEntriesByMonth(selectedStudent.entries, selectedMonth);
  }, [selectedStudent, selectedMonth]);

  // ========== Handlers ==========
  const handleOpenModal = (student: BeribadahStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setAvailableMonths(extractMonthKeys(student.entries));
    setSelectedMonth("all");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleOpenRamadhanModal = (student: RamadhanStudent) => {
    setSelectedRamadhanStudent(student);
    setIsRamadhanModalOpen(true);
  };

  const handleCloseRamadhanModal = () => {
    setIsRamadhanModalOpen(false);
    setSelectedRamadhanStudent(null);
  };

  const formatDisplayDate = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(parsed);
    }
    return value;
  };

  // ========== Unified PDF Download ==========
  const handleDownloadUnifiedPDF = async (
    student: BeribadahStudent,
    entries: BeribadahEntry[],
  ) => {
    const ramadhanData = ramadhanStudents.find((r) => r.nisn === student.nisn);

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    await loadPoppinsFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 15;

    // ========== PROFESSIONAL HEADER ==========
    doc.setFillColor(26, 172, 122);
    doc.rect(0, 0, pageWidth, 3, "F");

    doc.setFont("Poppins", "bold");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(22);
    doc.setTextColor(26, 172, 122);
    doc.text("JURNAL KEBIASAAN BAIK", pageWidth / 2, 26, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(marginX + 40, 32, pageWidth - marginX - 40, 32);

    doc.setFont("Poppins", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Beribadah", pageWidth / 2, 38, { align: "center" });

    // ========== STUDENT INFO CARD ==========
    const cardY = 45;
    const cardHeight = 28;
    const contentWidth = pageWidth - 2 * marginX;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, cardY, contentWidth, cardHeight, 4, 4, "F");

    doc.setFillColor(26, 172, 122);
    doc.roundedRect(marginX, cardY, 4, cardHeight, 2, 2, "F");

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont("Poppins", "normal");
    doc.text("Nama Siswa", marginX + 12, cardY + 10);
    doc.text("Kelas", marginX + 12, cardY + 20);
    doc.text("Periode", marginX + 100, cardY + 10);

    doc.setFont("Poppins", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(student.nama, marginX + 45, cardY + 10);
    doc.text(student.kelas || "-", marginX + 45, cardY + 20);
    doc.setFont("Poppins", "normal");
    doc.setTextColor(40, 40, 40);
    doc.text(modalMonthLabel, marginX + 118, cardY + 10);

    // ========== SECTION 1: IBADAH HARIAN TABLE ==========
    let currentY = cardY + cardHeight + 10;
    const tableHeaderHeight = 9;
    const rowHeight = 7;

    doc.setFillColor(30, 64, 175);
    doc.circle(marginX + 4, currentY + 3, 3, "F");
    doc.setFont("Poppins", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text("IBADAH HARIAN", marginX + 10, currentY + 5);

    doc.setFillColor(219, 234, 254);
    doc.roundedRect(marginX + 55, currentY - 1, 25, 8, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text(`${entries.length} hari`, marginX + 57, currentY + 4);

    currentY += 12;

    const colWidths = {
      tanggal: 24,
      berdoa: 22,
      fajar: 22,
      limaWaktu: 24,
      zikir: 22,
      dhuha: 22,
      rawatib: 22,
      zis: 22,
    };

    const harianCols = [
      { label: "Tanggal", width: colWidths.tanggal },
      { label: "Berdoa", width: colWidths.berdoa },
      { label: "Fajar", width: colWidths.fajar },
      { label: "5 Waktu", width: colWidths.limaWaktu },
      { label: "Zikir", width: colWidths.zikir },
      { label: "Dhuha", width: colWidths.dhuha },
      { label: "Rawatib", width: colWidths.rawatib },
      { label: "ZIS", width: colWidths.zis },
    ];

    const tableWidth = harianCols.reduce((sum, col) => sum + col.width, 0);

    const drawHarianHeader = (y: number) => {
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(marginX, y, tableWidth, tableHeaderHeight, 2, 2, "F");
      doc.setFont("Poppins", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);

      let x = marginX;
      harianCols.forEach((col) => {
        doc.text(col.label, x + col.width / 2, y + 6, { align: "center" });
        x += col.width;
      });

      return y + tableHeaderHeight;
    };

    const drawCheck = (
      x: number,
      y: number,
      color: [number, number, number] = [34, 197, 94],
    ) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      doc.line(x - 1.5, y, x - 0.5, y + 1.5);
      doc.line(x - 0.5, y + 1.5, x + 2, y - 2);
    };

    currentY = drawHarianHeader(currentY);

    doc.setFont("Poppins", "normal");
    doc.setFontSize(7);

    entries.forEach((entry, idx) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        doc.setFillColor(26, 172, 122);
        doc.rect(0, 0, pageWidth, 3, "F");
        currentY = marginY + 5;
        currentY = drawHarianHeader(currentY);
        doc.setFont("Poppins", "normal");
        doc.setFontSize(7);
      }

      const rowY = currentY;
      let x = marginX;

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, rowY, tableWidth, rowHeight, "F");
      }

      doc.setTextColor(50, 50, 50);
      doc.text(formatDisplayDate(entry.tanggal), x + 2, rowY + 5);
      x += colWidths.tanggal;

      const boolKeys: (keyof BeribadahEntry)[] = [
        "berdoaUntukDiriDanOrtu",
        "sholatFajar",
        "sholatLimaWaktuBerjamaah",
        "zikirSesudahSholat",
        "sholatDhuha",
        "sholatSunahRawatib",
      ];

      const colWidthsArr = [
        colWidths.berdoa,
        colWidths.fajar,
        colWidths.limaWaktu,
        colWidths.zikir,
        colWidths.dhuha,
        colWidths.rawatib,
      ];

      boolKeys.forEach((key, i) => {
        if (entry[key]) {
          drawCheck(x + colWidthsArr[i] / 2, rowY + 3.5);
        }
        x += colWidthsArr[i];
      });

      const zisValue = entry.zakatInfaqSedekah || "-";
      doc.setTextColor(80, 80, 80);
      doc.text(
        zisValue.length > 8 ? zisValue.substring(0, 8) + ".." : zisValue,
        x + colWidths.zis / 2,
        rowY + 5,
        { align: "center" },
      );

      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(
        marginX,
        rowY + rowHeight,
        marginX + tableWidth,
        rowY + rowHeight,
      );

      currentY += rowHeight;
    });

    // ========== SECTION 2: RAMADHAN (if data exists) ==========
    if (ramadhanData && ramadhanData.entries.length > 0) {
      const ramadhanSpaceNeeded = 80 + ramadhanData.entries.length * rowHeight;
      if (currentY + ramadhanSpaceNeeded > pageHeight - 20) {
        doc.addPage();
        doc.setFillColor(26, 172, 122);
        doc.rect(0, 0, pageWidth, 3, "F");
        currentY = marginY + 5;
      } else {
        currentY += 15;
      }

      doc.setFillColor(22, 163, 74);
      doc.circle(marginX + 4, currentY + 3, 3, "F");
      doc.setFont("Poppins", "bold");
      doc.setFontSize(11);
      doc.setTextColor(22, 163, 74);
      doc.text(
        `IBADAH RAMADHAN ${ramadhanData.hijriYear} H`,
        marginX + 10,
        currentY + 5,
      );

      doc.setFillColor(220, 252, 231);
      doc.roundedRect(marginX + 72, currentY - 1, 25, 8, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(22, 101, 52);
      doc.text(
        `${ramadhanData.entries.length} hari`,
        marginX + 74,
        currentY + 4,
      );

      currentY += 12;

      const ramadhanCols = [
        { label: "Hari", width: 20 },
        { label: "Tanggal", width: 28 },
        { label: "Berpuasa", width: 30 },
        { label: "Tarawih & Witir", width: 35 },
      ];

      const ramadhanTableWidth = ramadhanCols.reduce(
        (sum, col) => sum + col.width,
        0,
      );

      const drawRamadhanHeader = (y: number) => {
        doc.setFillColor(22, 163, 74);
        doc.roundedRect(
          marginX,
          y,
          ramadhanTableWidth,
          tableHeaderHeight,
          2,
          2,
          "F",
        );
        doc.setFont("Poppins", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);

        let x = marginX;
        ramadhanCols.forEach((col) => {
          doc.text(col.label, x + col.width / 2, y + 6, { align: "center" });
          x += col.width;
        });

        return y + tableHeaderHeight;
      };

      currentY = drawRamadhanHeader(currentY);

      doc.setFont("Poppins", "normal");
      doc.setFontSize(7);

      ramadhanData.entries.forEach((entry, idx) => {
        if (currentY > pageHeight - 25) {
          doc.addPage();
          doc.setFillColor(26, 172, 122);
          doc.rect(0, 0, pageWidth, 3, "F");
          currentY = marginY + 5;
          currentY = drawRamadhanHeader(currentY);
          doc.setFont("Poppins", "normal");
          doc.setFontSize(7);
        }

        const rowY = currentY;
        let x = marginX;

        if (idx % 2 === 0) {
          doc.setFillColor(240, 253, 244);
          doc.rect(marginX, rowY, ramadhanTableWidth, rowHeight, "F");
        }

        doc.setTextColor(22, 101, 52);
        doc.setFont("Poppins", "bold");
        doc.text(String(entry.ramadhanDay || "-"), x + 10, rowY + 5, {
          align: "center",
        });
        x += 20;

        doc.setFont("Poppins", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(formatDisplayDate(entry.tanggal), x + 14, rowY + 5, {
          align: "center",
        });
        x += 28;

        if (entry.berpuasa) {
          drawCheck(x + 15, rowY + 3.5, [22, 163, 74]);
        }
        x += 30;

        if (entry.sholatTarawihWitir) {
          drawCheck(x + 17.5, rowY + 3.5, [22, 163, 74]);
        }

        doc.setDrawColor(220, 252, 231);
        doc.setLineWidth(0.1);
        doc.line(
          marginX,
          rowY + rowHeight,
          marginX + ramadhanTableWidth,
          rowY + rowHeight,
        );

        currentY += rowHeight;
      });
    }

    // ========== FOOTER ==========
    const footerY = pageHeight - 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 5, pageWidth - marginX, footerY - 5);

    doc.setFont("Poppins", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      marginX,
      footerY,
    );
    doc.text(
      "Jurnal Kebiasaan Baik - SMK Negeri 31 Jakarta",
      pageWidth - marginX,
      footerY,
      { align: "right" },
    );

    const safeFileName = student.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-ibadah-${safeFileName}.pdf`);
  };

  const handleDownloadPDF = () => {
    if (!selectedStudent) return;
    handleDownloadUnifiedPDF(selectedStudent, filteredEntries);
  };

  const handleDownloadRamadhanPDF = async () => {
    if (!selectedRamadhanStudent) return;

    const regularData = students.find(
      (s) => s.nisn === selectedRamadhanStudent.nisn,
    );

    if (regularData) {
      handleDownloadUnifiedPDF(regularData, regularData.entries);
    } else {
      // Fallback: Create Ramadhan-only PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      await loadPoppinsFont(doc);

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 10;

      doc.setFont("Poppins", "bold");
      doc.setFontSize(14);
      doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(18);
      doc.text("JURNAL IBADAH RAMADHAN", pageWidth / 2, 35, {
        align: "center",
      });

      doc.setFont("Poppins", "normal");
      doc.setFontSize(12);
      doc.text(
        `Ramadhan ${selectedRamadhanStudent.hijriYear} H`,
        pageWidth / 2,
        45,
        { align: "center" },
      );

      doc.setFillColor(250, 250, 250);
      doc.rect(marginX, 55, pageWidth - 2 * marginX, 35, "F");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      doc.text(`Nama: ${selectedRamadhanStudent.nama}`, marginX + 5, 65);
      doc.text(
        `Kelas: ${selectedRamadhanStudent.kelas || "-"}`,
        marginX + 5,
        73,
      );
      doc.text(
        `Berpuasa: ${selectedRamadhanStudent.summary.totalPuasa}/30 (${getRatingLabel(selectedRamadhanStudent.summary.puasaRating)})`,
        marginX + 5,
        81,
      );
      doc.text(
        `Tarawih: ${selectedRamadhanStudent.summary.totalTarawihWitir}/30 (${getRatingLabel(selectedRamadhanStudent.summary.tarawihWitirRating)})`,
        marginX + 5,
        89,
      );

      const tableTop = 100;
      const headerHeight = 10;
      const rowHeight = 8;

      doc.setFont("Poppins", "bold");
      doc.setFontSize(8);
      doc.setFillColor(22, 163, 74);
      doc.setTextColor(255, 255, 255);
      doc.rect(marginX, tableTop, pageWidth - 2 * marginX, headerHeight, "F");

      doc.text("Hari", marginX + 15, tableTop + 7, { align: "center" });
      doc.text("Tanggal", marginX + 50, tableTop + 7, { align: "center" });
      doc.text("Berpuasa", marginX + 100, tableTop + 7, { align: "center" });
      doc.text("Tarawih", marginX + 150, tableTop + 7, { align: "center" });

      doc.setFont("Poppins", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);

      let currentY = tableTop + headerHeight;

      selectedRamadhanStudent.entries.forEach((entry) => {
        if (currentY > 280) {
          doc.addPage();
          currentY = 20;
        }

        doc.text(String(entry.ramadhanDay || "-"), marginX + 15, currentY + 6, {
          align: "center",
        });
        doc.text(formatDisplayDate(entry.tanggal), marginX + 50, currentY + 6, {
          align: "center",
        });
        doc.text(entry.berpuasa ? "✓" : "-", marginX + 100, currentY + 6, {
          align: "center",
        });
        doc.text(
          entry.sholatTarawihWitir ? "✓" : "-",
          marginX + 150,
          currentY + 6,
          { align: "center" },
        );

        doc.setDrawColor(230, 230, 230);
        doc.line(
          marginX,
          currentY + rowHeight,
          pageWidth - marginX,
          currentY + rowHeight,
        );

        currentY += rowHeight;
      });

      const safeFileName = selectedRamadhanStudent.nama
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .toLowerCase();
      doc.save(`jurnal-ramadhan-${safeFileName}.pdf`);
    }
  };

  const loading = viewMode === "harian" ? loadingRegular : loadingRamadhan;
  const error = viewMode === "harian" ? errorRegular : errorRamadhan;

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
              <p className="text-gray-500">
                Memuat data {viewMode === "harian" ? "beribadah" : "Ramadhan"}
                ...
              </p>
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
            <BeribadahStudentList
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              error={error}
              students={students}
              onSelectStudent={handleOpenModal}
              ramadhanStudents={ramadhanStudents}
              onSelectRamadhanStudent={handleOpenRamadhanModal}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              availableYears={availableYears}
              period={period}
            />
          </div>
        </main>
      </div>

      {/* Detail Modal - Regular Beribadah */}
      {isModalOpen && selectedStudent && (
        <HarianDetailModal
          student={selectedStudent}
          filteredEntries={filteredEntries}
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onMonthChange={setSelectedMonth}
          onClose={handleCloseModal}
          onDownloadPDF={handleDownloadPDF}
        />
      )}

      {/* Detail Modal - Ramadhan */}
      {isRamadhanModalOpen && selectedRamadhanStudent && (
        <RamadhanDetailModal
          student={selectedRamadhanStudent}
          onClose={handleCloseRamadhanModal}
          onDownloadPDF={handleDownloadRamadhanPDF}
        />
      )}
    </div>
  );
}
