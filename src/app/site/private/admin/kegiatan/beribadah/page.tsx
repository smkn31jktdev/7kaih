"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import {
  Check,
  MoveRight,
  HandCoins,
  X,
  ArrowDownToLine,
  Search,
  Filter,
  Moon,
  Star,
  Calendar,
} from "lucide-react";
import jsPDF from "jspdf";
import Select from "@/app/components/Select";

// ========== Types for Regular Beribadah ==========
interface BeribadahEntry {
  tanggal: string;
  berdoaUntukDiriDanOrtu: boolean;
  sholatFajar: boolean;
  sholatLimaWaktuBerjamaah: boolean;
  zikirSesudahSholat: boolean;
  sholatDhuha: boolean;
  sholatSunahRawatib: boolean;
  zakatInfaqSedekah: string;
}

interface BeribadahStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BeribadahEntry[];
}

// ========== Types for Ramadhan ==========
interface RamadhanEntry {
  tanggal: string;
  sholatTarawihWitir: boolean;
  berpuasa: boolean;
  ramadhanDay: number | null;
}

interface RamadhanStudentSummary {
  totalTarawihWitir: number;
  totalPuasa: number;
  totalRamadhanDays: number;
  tarawihWitirRating: number;
  puasaRating: number;
  tarawihWitirNote: string;
  puasaNote: string;
}

interface RamadhanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  hijriYear: number;
  entries: RamadhanEntry[];
  summary: RamadhanStudentSummary;
}

interface RamadhanPeriod {
  hijriYear: number;
  gregorianYear: number;
  startDate: string;
  endDate: string;
}

interface AvailableYear {
  hijriYear: number;
  gregorianYear: number;
}

interface RamadhanResponse {
  data: RamadhanStudent[];
  period: RamadhanPeriod;
  availableYears: AvailableYear[];
  error?: string;
}

type BooleanColumnKey = Exclude<keyof BeribadahEntry, "zakatInfaqSedekah">;

type BooleanColumn = {
  key: BooleanColumnKey;
  label: string;
  pdfLabel: string;
  type: "boolean";
  width: number;
};

type CurrencyColumn = {
  key: "zakatInfaqSedekah";
  label: string;
  pdfLabel: string;
  type: "currency";
  width: number;
};

const PRAYER_COLUMNS: Array<BooleanColumn | CurrencyColumn> = [
  {
    key: "berdoaUntukDiriDanOrtu",
    label: "Berdoa",
    pdfLabel: "Doa",
    type: "boolean",
    width: 25,
  },
  {
    key: "sholatFajar",
    label: "Fajar",
    pdfLabel: "Fajar",
    type: "boolean",
    width: 20,
  },
  {
    key: "sholatLimaWaktuBerjamaah",
    label: "5 Waktu",
    pdfLabel: "5 Waktu",
    type: "boolean",
    width: 25,
  },
  {
    key: "zikirSesudahSholat",
    label: "Zikir",
    pdfLabel: "Zikir",
    type: "boolean",
    width: 25,
  },
  {
    key: "sholatDhuha",
    label: "Dhuha",
    pdfLabel: "Dhuha",
    type: "boolean",
    width: 20,
  },
  {
    key: "sholatSunahRawatib",
    label: "Rawatib",
    pdfLabel: "Rawatib",
    type: "boolean",
    width: 20,
  },
  {
    key: "zakatInfaqSedekah",
    label: "Zakat/Infaq",
    pdfLabel: "ZIS (Rp)",
    type: "currency",
    width: 30,
  },
];

const RAMADHAN_COLOR = "#1AAC7A";

type ViewMode = "harian" | "ramadhan";

function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5:
      return "Istimewa";
    case 4:
      return "Sangat Baik";
    case 3:
      return "Baik";
    case 2:
      return "Cukup Baik";
    default:
      return "Kurang Baik";
  }
}

function getRatingColor(rating: number): string {
  switch (rating) {
    case 5:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case 4:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case 3:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case 2:
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-red-100 text-red-700 border-red-200";
  }
}

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
  const modalMonthLabel = useMemo(() => {
    if (selectedMonth === "all") return "Semua Bulan";
    const [year, month] = selectedMonth.split("-");
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(new Date(parseInt(year), parseInt(month) - 1));
  }, [selectedMonth]);

  const filteredEntries = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedMonth === "all"
      ? selectedStudent.entries
      : selectedStudent.entries.filter((entry) => {
          const date = new Date(entry.tanggal);
          return (
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0",
            )}` === selectedMonth
          );
        });
  }, [selectedStudent, selectedMonth]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const lower = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(lower) ||
        s.nisn.includes(lower) ||
        s.kelas.toLowerCase().includes(lower),
    );
  }, [students, searchQuery]);

  const filteredRamadhanStudents = useMemo(() => {
    if (!searchQuery) return ramadhanStudents;
    const lower = searchQuery.toLowerCase();
    return ramadhanStudents.filter(
      (s) =>
        s.nama.toLowerCase().includes(lower) ||
        s.nisn.includes(lower) ||
        s.kelas.toLowerCase().includes(lower),
    );
  }, [ramadhanStudents, searchQuery]);

  // ========== Handlers ==========
  const handleOpenModal = (student: BeribadahStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    const months = [
      ...new Set(
        student.entries.map((entry) => {
          const date = new Date(entry.tanggal);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
        }),
      ),
    ].sort();
    setAvailableMonths(months);
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

  // ========== Unified PDF Download - Combined Ibadah Harian + Ramadhan ==========
  const handleDownloadUnifiedPDF = async (
    student: BeribadahStudent,
    entries: BeribadahEntry[],
  ) => {
    // Find matching Ramadhan data for this student
    const ramadhanData = ramadhanStudents.find((r) => r.nisn === student.nisn);

    const doc = new jsPDF({
      orientation: "portrait", // A4 Portrait
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
        String.fromCharCode(...new Uint8Array(regularBuffer)),
      );
      const boldBase64 = btoa(
        String.fromCharCode(...new Uint8Array(boldBuffer)),
      );

      doc.addFileToVFS("Poppins-Regular.ttf", regularBase64);
      doc.addFileToVFS("Poppins-Bold.ttf", boldBase64);

      doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
      doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
    } catch (error) {
      console.error(
        "Failed to load Poppins font, using default Helvetica",
        error,
      );
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 15;
    const contentWidth = pageWidth - 2 * marginX;

    // ========== PROFESSIONAL HEADER ==========
    // Header accent line
    doc.setFillColor(26, 172, 122); // Primary color
    doc.rect(0, 0, pageWidth, 3, "F");

    // School name
    doc.setFont("Poppins", "bold");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, 15, { align: "center" });

    // Main title
    doc.setFontSize(22);
    doc.setTextColor(26, 172, 122);
    doc.text("JURNAL KEBIASAAN BAIK", pageWidth / 2, 26, { align: "center" });

    // Subtitle with decorative line
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

    // Card background with subtle gradient effect (using two rectangles)
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, cardY, contentWidth, cardHeight, 4, 4, "F");

    // Left accent bar
    doc.setFillColor(26, 172, 122);
    doc.roundedRect(marginX, cardY, 4, cardHeight, 2, 2, "F");

    // Student info
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

    // Section header with icon-like element
    doc.setFillColor(30, 64, 175);
    doc.circle(marginX + 4, currentY + 3, 3, "F");
    doc.setFont("Poppins", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text("IBADAH HARIAN", marginX + 10, currentY + 5);

    // Entry count badge
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(marginX + 55, currentY - 1, 25, 8, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(30, 64, 175);
    doc.text(`${entries.length} hari`, marginX + 57, currentY + 4);

    currentY += 12;

    // Table columns - optimized for A4
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

    // Draw table header
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

    // Checkmark function
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

    // Draw rows
    doc.setFont("Poppins", "normal");
    doc.setFontSize(7);

    entries.forEach((entry, idx) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        // Re-add accent line
        doc.setFillColor(26, 172, 122);
        doc.rect(0, 0, pageWidth, 3, "F");
        currentY = marginY + 5;
        currentY = drawHarianHeader(currentY);
        doc.setFont("Poppins", "normal");
        doc.setFontSize(7);
      }

      const rowY = currentY;
      let x = marginX;

      // Zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, rowY, tableWidth, rowHeight, "F");
      }

      // Date
      doc.setTextColor(50, 50, 50);
      doc.text(formatDisplayDate(entry.tanggal), x + 2, rowY + 5);
      x += colWidths.tanggal;

      // Boolean columns
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

      // ZIS
      const zisValue = entry.zakatInfaqSedekah || "-";
      doc.setTextColor(80, 80, 80);
      doc.text(
        zisValue.length > 8 ? zisValue.substring(0, 8) + ".." : zisValue,
        x + colWidths.zis / 2,
        rowY + 5,
        {
          align: "center",
        },
      );

      // Bottom border
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
      // Check if need new page
      const ramadhanSpaceNeeded = 80 + ramadhanData.entries.length * rowHeight;
      if (currentY + ramadhanSpaceNeeded > pageHeight - 20) {
        doc.addPage();
        doc.setFillColor(26, 172, 122);
        doc.rect(0, 0, pageWidth, 3, "F");
        currentY = marginY + 5;
      } else {
        currentY += 15;
      }

      // Section header
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

      // Entry count badge
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

      // Ramadhan table columns
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

      // Draw Ramadhan header
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

      // Ramadhan rows
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

        // Zebra striping with green tint
        if (idx % 2 === 0) {
          doc.setFillColor(240, 253, 244);
          doc.rect(marginX, rowY, ramadhanTableWidth, rowHeight, "F");
        }

        // Hari Ke-
        doc.setTextColor(22, 101, 52);
        doc.setFont("Poppins", "bold");
        doc.text(String(entry.ramadhanDay || "-"), x + 10, rowY + 5, {
          align: "center",
        });
        x += 20;

        // Tanggal
        doc.setFont("Poppins", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(formatDisplayDate(entry.tanggal), x + 14, rowY + 5, {
          align: "center",
        });
        x += 28;

        // Berpuasa
        if (entry.berpuasa) {
          drawCheck(x + 15, rowY + 3.5, [22, 163, 74]);
        }
        x += 30;

        // Tarawih & Witir
        if (entry.sholatTarawihWitir) {
          drawCheck(x + 17.5, rowY + 3.5, [22, 163, 74]);
        }

        // Bottom border
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

    // Save
    const safeFileName = student.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-ibadah-${safeFileName}.pdf`);
  };

  // Wrapper function for modal download button
  const handleDownloadPDF = () => {
    if (!selectedStudent) return;
    handleDownloadUnifiedPDF(selectedStudent, filteredEntries);
  };

  // For Ramadhan modal - also use unified PDF
  const handleDownloadRamadhanPDF = async () => {
    if (!selectedRamadhanStudent) return;

    // Find matching regular beribadah data
    const regularData = students.find(
      (s) => s.nisn === selectedRamadhanStudent.nisn,
    );

    if (regularData) {
      // Use unified PDF with all data
      handleDownloadUnifiedPDF(regularData, regularData.entries);
    } else {
      // Fallback: Create Ramadhan-only PDF
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
          String.fromCharCode(...new Uint8Array(regularBuffer)),
        );
        const boldBase64 = btoa(
          String.fromCharCode(...new Uint8Array(boldBuffer)),
        );

        doc.addFileToVFS("Poppins-Regular.ttf", regularBase64);
        doc.addFileToVFS("Poppins-Bold.ttf", boldBase64);

        doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
        doc.addFont("Poppins-Bold.ttf", "Poppins", "bold");
      } catch (err) {
        console.error("Failed to load Poppins font", err);
      }

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
            {/* Header Card with Tabs */}
            <div
              className={`rounded-3xl p-6 shadow-sm border overflow-hidden relative transition-all duration-300 ${
                viewMode === "ramadhan"
                  ? "text-white"
                  : "bg-white text-gray-800"
              }`}
              style={
                viewMode === "ramadhan"
                  ? {
                      background: `linear-gradient(135deg, ${RAMADHAN_COLOR} 0%, #15936A 50%, #0F7A57 100%)`,
                    }
                  : {}
              }
            >
              {viewMode === "ramadhan" && (
                <>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                  <div className="absolute top-4 right-6 opacity-20">
                    <Moon
                      className="w-16 h-16 text-yellow-200"
                      fill="currentColor"
                    />
                  </div>
                </>
              )}

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      viewMode === "ramadhan"
                        ? "bg-white/20 backdrop-blur-sm border border-white/25"
                        : "bg-[var(--secondary)]/10 text-[var(--secondary)]"
                    }`}
                  >
                    {viewMode === "ramadhan" ? (
                      <Moon className="w-8 h-8 text-yellow-300" />
                    ) : (
                      <HandCoins className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      {viewMode === "ramadhan"
                        ? "Ibadah Ramadhan"
                        : "Beribadah"}
                    </h1>
                    <p
                      className={
                        viewMode === "ramadhan"
                          ? "text-white/80"
                          : "text-gray-500"
                      }
                    >
                      {viewMode === "ramadhan"
                        ? period
                          ? `Ramadhan ${period.hijriYear} H (${period.startDate} s/d ${period.endDate})`
                          : "Rekapitulasi ibadah Ramadhan siswa"
                        : "Rekapitulasi aktivitas ibadah harian siswa."}
                    </p>
                  </div>
                </div>

                {/* Tab Switcher & Year Selector */}
                <div className="flex items-center gap-4">
                  <div
                    className={`flex rounded-xl p-1 ${
                      viewMode === "ramadhan"
                        ? "bg-white/15 backdrop-blur-sm border border-white/15"
                        : "bg-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => setViewMode("harian")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === "harian"
                          ? "bg-white text-[var(--secondary)] shadow-sm"
                          : viewMode === "ramadhan"
                            ? "text-white/70 hover:text-white"
                            : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <span className="hidden sm:inline">Ibadah </span>Harian
                    </button>
                    <button
                      onClick={() => setViewMode("ramadhan")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        viewMode === "ramadhan"
                          ? "bg-white text-[#1AAC7A] shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Ramadhan
                    </button>
                  </div>

                  {/* Year Selector for Ramadhan */}
                  {viewMode === "ramadhan" && availableYears.length > 0 && (
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/15">
                      <Select
                        value={String(selectedYear)}
                        onChange={(val) => setSelectedYear(Number(val))}
                        options={availableYears.map((y) => ({
                          value: String(y.gregorianYear),
                          label: `${y.hijriYear} H / ${y.gregorianYear} M`,
                        }))}
                        placeholder="Pilih Tahun"
                        className="min-w-[180px] text-sm !bg-transparent !text-white !border-white/30"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
                {error}
              </div>
            )}

            {/* Content */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa berdasarkan nama atau NISN..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  <span>
                    Total:{" "}
                    <strong>
                      {viewMode === "harian"
                        ? filteredStudents.length
                        : filteredRamadhanStudents.length}
                    </strong>{" "}
                    Siswa
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[600px] overflow-y-auto">
                {viewMode === "harian" ? (
                  // ========== Regular Beribadah List ==========
                  filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <HandCoins className="w-16 h-16 mb-4 opacity-20" />
                      <p>Tidak ada data siswa ditemukan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.nisn}
                          className={`group flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-all cursor-pointer border-b border-gray-100 last:border-0`}
                          onClick={() => handleOpenModal(student)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg group-hover:bg-[var(--secondary)] group-hover:text-white transition-colors">
                              {student.nama.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 group-hover:text-[var(--secondary)] transition-colors">
                                {student.nama}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                  {student.kelas || "Tanpa Kelas"}
                                </span>
                                <span>•</span>
                                <span>{student.nisn}</span>
                                <span>•</span>
                                <span>{student.entries.length} Catatan</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[var(--secondary)] hover:border-[var(--secondary)] hover:bg-[var(--secondary)]/5 transition-all">
                              <MoveRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : // ========== Ramadhan List ==========
                filteredRamadhanStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Moon className="w-16 h-16 mb-4 opacity-20" />
                    <p>Belum ada data ibadah Ramadhan untuk periode ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1">
                    {filteredRamadhanStudents.map((student) => (
                      <div
                        key={student.nisn}
                        className="group flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-all cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => handleOpenRamadhanModal(student)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: RAMADHAN_COLOR }}
                          >
                            {student.nama.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-[#1AAC7A] transition-colors">
                              {student.nama}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                {student.kelas || "Tanpa Kelas"}
                              </span>
                              <span>•</span>
                              <span>{student.nisn}</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary badges */}
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRatingColor(student.summary.tarawihWitirRating)}`}
                            >
                              Tarawih: {student.summary.totalTarawihWitir} malam
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRatingColor(student.summary.puasaRating)}`}
                            >
                              Puasa: {student.summary.totalPuasa} hari
                            </span>
                          </div>
                          <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1AAC7A] hover:border-[#1AAC7A] hover:bg-[#1AAC7A]/5 transition-all">
                            <MoveRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal - Regular Beribadah */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
                  <HandCoins className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Detail Jurnal Siswa
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.nama}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200"
                  title="Download PDF"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCloseModal}
                  className="p-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fixed Stats Section */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                  <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    Kelas
                  </label>
                  <p className="font-bold text-blue-900 text-lg">
                    {selectedStudent.kelas || "-"}
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Total Entri
                  </label>
                  <p className="font-bold text-emerald-900 text-lg">
                    {selectedStudent.entries.length} Hari
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Filter Bulan
                  </label>
                  <Select
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    options={[
                      { value: "all", label: "Semua Bulan" },
                      ...availableMonths.map((m) => ({
                        value: m,
                        label: new Intl.DateTimeFormat("id-ID", {
                          month: "long",
                          year: "numeric",
                        }).format(new Date(m + "-01")),
                      })),
                    ]}
                    placeholder="Pilih Bulan"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Table Content */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 md:p-8">
              {/* Table */}
              <div className="border border-gray-200 rounded-2xl flex-1 overflow-auto relative">
                <div className="min-w-full inline-block align-middle">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-4 min-w-[100px]">Tanggal</th>
                        {PRAYER_COLUMNS.map((col) => (
                          <th
                            key={col.key}
                            className="px-3 py-4 min-w-[80px] text-center"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={PRAYER_COLUMNS.length + 1}
                            className="px-6 py-12 text-center text-gray-400"
                          >
                            Tidak ada data untuk periode ini.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {formatDisplayDate(entry.tanggal)}
                            </td>
                            {PRAYER_COLUMNS.map((col) => (
                              <td
                                key={col.key}
                                className="px-3 py-3 text-center"
                              >
                                {col.type === "boolean" ? (
                                  entry[col.key] ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 mx-auto" />
                                  )
                                ) : (
                                  <span className="font-mono text-gray-600">
                                    {entry.zakatInfaqSedekah || "-"}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Ramadhan */}
      {isRamadhanModalOpen && selectedRamadhanStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className="p-6 text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${RAMADHAN_COLOR} 0%, #15936A 100%)`,
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25">
                    <Moon className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedRamadhanStudent.nama}
                    </h2>
                    <p className="text-white/80 text-sm">
                      Ramadhan {selectedRamadhanStudent.hijriYear} H
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadRamadhanPDF}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-all"
                    title="Download PDF"
                  >
                    <ArrowDownToLine className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCloseRamadhanModal}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-red-500 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-bold text-gray-900">
                      Sholat Tarawih & Witir
                    </h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {selectedRamadhanStudent.summary.totalTarawihWitir}
                        <span className="text-lg font-normal text-gray-500">
                          {" "}
                          / 30 malam
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedRamadhanStudent.summary.tarawihWitirNote}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl font-bold text-sm border ${getRatingColor(selectedRamadhanStudent.summary.tarawihWitirRating)}`}
                    >
                      {selectedRamadhanStudent.summary.tarawihWitirRating}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-gray-900">Berpuasa</h4>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {selectedRamadhanStudent.summary.totalPuasa}
                        <span className="text-lg font-normal text-gray-500">
                          {" "}
                          / 30 hari
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedRamadhanStudent.summary.puasaNote}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl font-bold text-sm border ${getRatingColor(selectedRamadhanStudent.summary.puasaRating)}`}
                    >
                      {selectedRamadhanStudent.summary.puasaRating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              <div className="border border-gray-200 rounded-2xl flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead
                    className="text-white font-semibold sticky top-0 z-10"
                    style={{ backgroundColor: RAMADHAN_COLOR }}
                  >
                    <tr>
                      <th className="px-4 py-4 text-center">Hari Ke-</th>
                      <th className="px-4 py-4">Tanggal</th>
                      <th className="px-4 py-4 text-center">Tarawih & Witir</th>
                      <th className="px-4 py-4 text-center">Berpuasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedRamadhanStudent.entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-400"
                        >
                          Belum ada data untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      selectedRamadhanStudent.entries.map((entry, i) => (
                        <tr
                          key={i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-center font-bold text-[#1AAC7A]">
                            {entry.ramadhanDay || "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatDisplayDate(entry.tanggal)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.sholatTarawihWitir ? (
                              <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.berpuasa ? (
                              <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                            ) : (
                              <div className="w-5 h-5 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={handleCloseRamadhanModal}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors text-sm shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
