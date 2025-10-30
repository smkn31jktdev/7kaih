"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import {
  ArrowDownToLine,
  Check,
  HandCoins,
  MoveRight,
  User,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import Skeleton from "react-loading-skeleton";

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
    label: "Berdoa untuk diri sendiri dan orang tua",
    pdfLabel: "Doa",
    type: "boolean",
    width: 1,
  },
  {
    key: "sholatFajar",
    label: "Sholat Fajar / Qoblal Subuh",
    pdfLabel: "Fajar",
    type: "boolean",
    width: 1,
  },
  {
    key: "sholatLimaWaktuBerjamaah",
    label: "Sholat 5 waktu berjamaah",
    pdfLabel: "5 Waktu",
    type: "boolean",
    width: 1.1,
  },
  {
    key: "zikirSesudahSholat",
    label: "Zikir dan doa sehabis sholat fardlu",
    pdfLabel: "Zikir Fardlu",
    type: "boolean",
    width: 1.1,
  },
  {
    key: "sholatDhuha",
    label: "Sholat Dhuha",
    pdfLabel: "Dhuha",
    type: "boolean",
    width: 1,
  },
  {
    key: "sholatSunahRawatib",
    label: "Sholat sunah rawatib",
    pdfLabel: "Rawatib",
    type: "boolean",
    width: 1.1,
  },
  {
    key: "zakatInfaqSedekah",
    label: "Zakat, infaq dan sedekah (Rp)",
    pdfLabel: "ZIS (Rp)",
    type: "currency",
    width: 1.4,
  },
];

const BOOLEAN_COLUMNS = PRAYER_COLUMNS.filter(
  (column): column is BooleanColumn => column.type === "boolean"
);

export default function AdminBeribadahPage() {
  const [students, setStudents] = useState<BeribadahStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<BeribadahStudent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/kegiatan/beribadah");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result: BeribadahStudent[] = await response.json();
        setStudents(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
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

  const handleOpenModal = (student: BeribadahStudent) => {
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
    // Increased header height to allow wrapped, centered labels and avoid overlap
    const headerHeight = 28;
    const rowHeight = 12;
    const dateColWidth = 60;
    const prayerAreaWidth = tableWidth - dateColWidth;
    const totalWidthUnits = PRAYER_COLUMNS.reduce(
      (sum, column) => sum + column.width,
      0
    );
    const columnWidths = PRAYER_COLUMNS.map(
      (column) => (column.width / totalWidthUnits) * prayerAreaWidth
    );
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
      doc.text("Beribadah", pageCenterX, 45, { align: "center" });

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
      doc.setLineWidth(0.3);

      doc.setFillColor(238, 238, 238);
      doc.rect(startX, startY, tableWidth, headerHeight, "F");
      doc.rect(startX, startY, tableWidth, headerHeight);

      // Vertical lines
      doc.line(
        startX + dateColWidth,
        startY,
        startX + dateColWidth,
        startY + headerHeight
      );

      let separatorX = startX + dateColWidth;
      PRAYER_COLUMNS.forEach((_, index) => {
        separatorX += columnWidths[index];
        doc.line(separatorX, startY, separatorX, startY + headerHeight);
      });
      doc.setFont("Poppins", "bold");
      doc.setTextColor(45, 45, 45);
      const headerFontSize = 9;
      doc.setFontSize(headerFontSize);

      const drawHeaderLabel = (
        text: string,
        centerX: number,
        cellLeft: number,
        cellTop: number,
        cellWidth: number,
        cellHeight: number,
        preferredFontSize?: number
      ) => {
        const padding = 4;
        const maxWidth = Math.max(8, cellWidth - padding * 2);

        let fs = preferredFontSize ?? headerFontSize;
        const minFontSize = 8;
        doc.setFont("Poppins", "bold");

        const longestWordFits = (fontSize: number) => {
          doc.setFontSize(fontSize);
          const words = text.split(/\s+/);
          for (const w of words) {
            if (doc.getTextWidth(w) > maxWidth) return false;
          }
          return true;
        };

        while (fs > minFontSize && !longestWordFits(fs)) {
          fs -= 0.5;
        }

        // Use final font size
        doc.setFontSize(fs);

        // Wrap by words without splitting a word across lines
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let current = "";
        for (const w of words) {
          const candidate = current ? current + " " + w : w;
          if (doc.getTextWidth(candidate) <= maxWidth) {
            current = candidate;
          } else {
            if (current) lines.push(current);
            current = w;
          }
        }
        if (current) lines.push(current);

        // Compute vertical start to center the block
        const lineHeight = fs * 0.35 + 2; // approximate mm height per line
        let startY =
          cellTop + cellHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
        startY += 1; // small visual nudge

        for (const ln of lines) {
          doc.text(ln, centerX, startY, { align: "center" });
          startY += lineHeight;
        }

        // restore header font size
        doc.setFontSize(headerFontSize);
      };

      // Date column (prefer single-line; fallback to rotated if too narrow)
      drawHeaderLabel(
        "Hari/Tanggal",
        startX + dateColWidth / 2,
        startX,
        startY,
        dateColWidth,
        headerHeight
      );

      // Prayer columns: draw all prayer headers rotated to the side for consistency
      let labelX = startX + dateColWidth;
      PRAYER_COLUMNS.forEach((column, index) => {
        const colWidth = columnWidths[index];
        const centerX = labelX + colWidth / 2;
        // forceRotate = true so all prayer columns render side labels
        // Make 'Sunah Rawatib' slightly larger for readability
        if (column.key === "sholatSunahRawatib") {
          // Make 'Sunah Rawatib' a bit larger for readability in the PDF header
          drawHeaderLabel(
            column.pdfLabel,
            centerX,
            labelX,
            startY,
            colWidth,
            headerHeight,
            headerFontSize + 2
          );
        } else {
          drawHeaderLabel(
            column.pdfLabel,
            centerX,
            labelX,
            startY,
            colWidth,
            headerHeight
          );
        }
        labelX += colWidth;
      });

      return startY + headerHeight;
    };

    const drawCheckMark = (centerX: number, centerY: number) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.6);
      doc.line(centerX - 3, centerY, centerX - 1, centerY + 2.5);
      doc.line(centerX - 1, centerY + 2.5, centerX + 3, centerY - 2);
      doc.setLineWidth(0.3);
    };

    renderBaseLayout();
    let currentY = renderTableHeader();
    doc.setFont("Poppins", "normal");
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 45);
    doc.setLineWidth(0.3);

    for (let index = 0; index < rowsToRender; index += 1) {
      if (currentY + rowHeight > pageHeight - marginX) {
        doc.addPage();
        renderBaseLayout();
        currentY = renderTableHeader();
        doc.setFont("Poppins", "normal");
        doc.setFontSize(10);
        doc.setTextColor(45, 45, 45);
        doc.setLineWidth(0.3);
      }

      const entry = selectedStudent.entries[index];
      const rowTop = currentY;

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(marginX, rowTop, tableWidth, rowHeight, "F");
      }

      // Draw cells
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(marginX, rowTop, dateColWidth, rowHeight);
      let cellX = marginX + dateColWidth;
      PRAYER_COLUMNS.forEach((_, idx) => {
        const colWidth = columnWidths[idx];
        doc.rect(cellX, rowTop, colWidth, rowHeight);
        cellX += colWidth;
      });

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

        let prayerCellX = marginX + dateColWidth;
        PRAYER_COLUMNS.forEach((column, index) => {
          const value = entry[column.key];
          const centerY = rowTop + rowHeight / 2;
          const colWidth = columnWidths[index];

          if (column.type === "boolean") {
            if (value) {
              drawCheckMark(prayerCellX + colWidth / 2, centerY);
            }
          } else {
            const display = formatCurrencyValue(String(value || ""));
            doc.text(display, prayerCellX + colWidth - 3, centerY + 1, {
              align: "right",
              maxWidth: colWidth - 6,
            });
          }
          prayerCellX += colWidth;
        });
      }

      currentY += rowHeight;
    }

    const safeFileName = selectedStudent.nama
      ? selectedStudent.nama.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()
      : "siswa";
    doc.save(`jurnal-beribadah-${safeFileName}.pdf`);
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

  const formatCurrencyValue = (rawValue: string) => {
    if (!rawValue) {
      return "-";
    }

    const sanitized = rawValue.replace(/[^0-9-]/g, "");
    const numeric = Number.parseInt(sanitized, 10);

    if (Number.isNaN(numeric)) {
      return rawValue;
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(numeric);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculatePrayerSummary = (student: BeribadahStudent) => {
    const totalDays = student.entries.length;
    const totalTrue = student.entries.reduce((sum, entry) => {
      return (
        sum +
        BOOLEAN_COLUMNS.reduce((inner, column) => {
          return inner + (entry[column.key] ? 1 : 0);
        }, 0)
      );
    }, 0);

    const totalPossible = totalDays * BOOLEAN_COLUMNS.length;
    const percentage = totalPossible
      ? Math.round((totalTrue / totalPossible) * 100)
      : 0;

    return { totalDays, totalTrue, totalPossible, percentage };
  };

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
                      {/* Data Beribadah Container */}
                      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl p-5 border border-indigo-100">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                                  <HandCoins className="w-6 h-6 text-green-600" />
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
                                      className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-green-50 px-4 py-4"
                                    >
                                      <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
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
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <HandCoins className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Data Beribadah Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pantau dan unduh jurnal ibadah siswa setiap hari.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="flex flex-col gap-6 xl:flex-row">
                  <div className="flex-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl p-5 border border-gray-200">
                            <div className="flex items-start gap-3 mb-4">
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ backgroundColor: "var(--secondary)" }}
                              >
                                <HandCoins className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  Daftar Siswa Beribadah
                                </h3>
                                <p className="text-sm text-slate-500">
                                  Pilih siswa untuk melihat jurnal ibadah dan
                                  unduh dalam bentuk PDF.
                                </p>
                              </div>
                            </div>

                            {students.length === 0 ? (
                              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                                Belum ada data beribadah.
                              </div>
                            ) : (
                              <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                                <div className="space-y-3">
                                  {students.map((student) => {
                                    return (
                                      <div
                                        key={student.nisn}
                                        className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-emerald-50 px-4 py-4 hover:bg-emerald-50/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-4 min-w-0">
                                          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                            <User className="w-6 h-6 text-emerald-600" />
                                          </div>
                                          <div className="space-y-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                              {student.nama}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                              NISN {student.nisn} | Kelas{" "}
                                              {student.kelas || "-"}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleOpenModal(student)
                                          }
                                          className="flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                                        >
                                          Detail
                                          <MoveRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                    );
                                  })}
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
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div
              className="flex items-center justify-between gap-4 rounded-t-3xl px-6 py-5"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Jurnal Beribadah
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
                  className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
                        Tanggal
                      </th>
                      {PRAYER_COLUMNS.map((column) => (
                        <th
                          key={column.key}
                          className="border-r border-slate-200 px-4 py-3 text-center last:border-r-0"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-700">
                    {selectedStudent.entries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={1 + PRAYER_COLUMNS.length}
                          className="px-4 py-6 text-center text-slate-500"
                        >
                          Belum ada catatan ibadah.
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
                          {PRAYER_COLUMNS.map((column) => {
                            const value = entry[column.key];
                            if (column.type === "boolean") {
                              return (
                                <td
                                  key={column.key}
                                  className="border-t border-slate-200 px-4 py-3 text-center align-top"
                                >
                                  {value ? (
                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={column.key}
                                className="border-t border-slate-200 px-4 py-3 text-right align-top"
                              >
                                <span className="text-sm font-medium text-slate-700">
                                  {formatCurrencyValue(String(value || ""))}
                                </span>
                              </td>
                            );
                          })}
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
