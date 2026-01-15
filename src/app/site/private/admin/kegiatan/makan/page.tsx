"use client";

import { useState, useEffect, useMemo } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import {
  Check,
  MoveRight,
  Utensils,
  User,
  X,
  ArrowDownToLine,
  Search,
  Filter,
} from "lucide-react";
import jsPDF from "jspdf";
import Select from "@/app/components/Select";

interface MakanEntry {
  tanggal: string;
  jenisMakanan: string;
  jenisLaukSayur: string;
  makanSayurAtauBuah: boolean;
  minumSuplemen: boolean;
}

interface MakanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: MakanEntry[];
}

export default function AdminMakanPage() {
  const [students, setStudents] = useState<MakanStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MakanStudent | null>(
    null
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
            "Token admin tidak ditemukan, silakan login kembali."
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
              "0"
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
        s.kelas.toLowerCase().includes(lower)
    );
  }, [students, searchQuery]);

  const handleOpenModal = (student: MakanStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    const months = [
      ...new Set(
        student.entries.map((entry) => {
          const date = new Date(entry.tanggal);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        })
      ),
    ].sort();
    setAvailableMonths(months);
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

    // Header
    doc.setFont("Poppins", "bold");
    doc.setFontSize(14);
    doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(24);
    doc.text("JURNAL KEBIASAAN BAIK", pageWidth / 2, 35, { align: "center" });

    doc.setFont("Poppins", "normal");
    doc.setFontSize(16);
    doc.text("Makan Sehat", pageWidth / 2, 45, { align: "center" });

    // Info Box
    doc.setFillColor(250, 250, 250);
    doc.rect(marginX, 60, pageWidth - 2 * marginX, 25, "F");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);

    doc.text(`Nama: ${selectedStudent.nama}`, marginX + 5, 70);
    doc.text(`Kelas: ${selectedStudent.kelas || "-"}`, marginX + 5, 78);
    doc.text(`Periode: ${modalMonthLabel}`, marginX + 5, 86);

    // Table Header
    let currentY = tableTop;

    const renderHeader = (y: number) => {
      // Main header bg
      doc.setFillColor(230, 236, 247);
      doc.rect(marginX, y, tableWidth, headerMainHeight, "F");
      // Sub header bg
      doc.setFillColor(244, 247, 255);
      doc.rect(marginX, y + headerMainHeight, tableWidth, headerSubHeight, "F");

      // Box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.1);
      doc.rect(marginX, y, tableWidth, headerMainHeight + headerSubHeight);

      doc.setFont("Poppins", "bold");
      doc.setFontSize(9);
      doc.setTextColor(45, 45, 45);

      // Main Text
      const centerY = y + (headerMainHeight + headerSubHeight) / 2 + 1;

      doc.text("Hari/Tanggal", marginX + dateColWidth / 2, centerY, {
        align: "center",
      });
      doc.text(
        "Jenis Makanan",
        marginX + dateColWidth + jenisMakananColWidth / 2,
        centerY,
        { align: "center" }
      );
      doc.text(
        "Makan Lauk",
        marginX + dateColWidth + jenisMakananColWidth + laukColWidth / 2,
        centerY,
        { align: "center" }
      );
      doc.text(
        "Sayur/Buah",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth / 2,
        centerY,
        { align: "center" }
      );

      // Suplemen (Split header)
      doc.text(
        "Minum Suplemen?",
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth +
          suplemenColWidth / 2,
        y + 4,
        { align: "center" }
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
        { align: "center" }
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
        { align: "center" }
      );

      // Vertical lines
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
        lineYBottom
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
        currentY = marginX; // reset margin
        // Re-draw basics? Usually simpler to just header
        currentY = renderHeader(currentY);
        doc.setFont("Poppins", "normal");
      }

      const rowTop = currentY;

      // Borders
      doc.rect(marginX, rowTop, dateColWidth, rowHeight);
      doc.rect(marginX + dateColWidth, rowTop, jenisMakananColWidth, rowHeight);
      doc.rect(
        marginX + dateColWidth + jenisMakananColWidth,
        rowTop,
        laukColWidth,
        rowHeight
      );
      doc.rect(
        marginX + dateColWidth + jenisMakananColWidth + laukColWidth,
        rowTop,
        sayurBuahColWidth,
        rowHeight
      );
      doc.rect(
        marginX +
          dateColWidth +
          jenisMakananColWidth +
          laukColWidth +
          sayurBuahColWidth,
        rowTop,
        suplemenColWidth / 2,
        rowHeight
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
        rowHeight
      );

      // Text
      doc.text(formatDisplayDate(entry.tanggal), marginX + 3, rowTop + 8, {
        maxWidth: dateColWidth - 6,
      });
      doc.text(
        entry.jenisMakanan || "-",
        marginX + dateColWidth + 3,
        rowTop + 8,
        { maxWidth: jenisMakananColWidth - 6 }
      );
      doc.text(
        entry.jenisLaukSayur || "-",
        marginX + dateColWidth + jenisMakananColWidth + 3,
        rowTop + 8,
        { maxWidth: laukColWidth - 6 }
      );

      if (entry.makanSayurAtauBuah) {
        drawCheck(
          marginX +
            dateColWidth +
            jenisMakananColWidth +
            laukColWidth +
            sayurBuahColWidth / 2,
          rowTop + 6
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
          rowTop + 6
        );
      } else {
        drawCheck(
          marginX +
            dateColWidth +
            jenisMakananColWidth +
            laukColWidth +
            sayurBuahColWidth +
            (3 * suplemenColWidth) / 4,
          rowTop + 6
        );
      }

      currentY += rowHeight;
    });

    const safeFileName = selectedStudent.nama
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .toLowerCase();
    doc.save(`jurnal-makan-${safeFileName}.pdf`);
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
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
                  <Utensils className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    Makan Sehat
                  </h1>
                  <p className="text-gray-500">
                    Rekapitulasi pola makan dan nutrisi siswa.
                  </p>
                </div>
              </div>
            </div>

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
                    Total: <strong>{filteredStudents.length}</strong> Siswa
                  </span>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Utensils className="w-16 h-16 mb-4 opacity-20" />
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
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
                  <Utensils className="w-6 h-6" />
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
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 min-w-[150px]">
                          Hari/Tanggal
                        </th>
                        <th className="px-6 py-4 min-w-[150px]">
                          Jenis Makanan
                        </th>
                        <th className="px-6 py-4 min-w-[150px]">Lauk/Sayur</th>
                        <th className="px-6 py-4 text-center">Sayur/Buah</th>
                        <th className="px-6 py-4 text-center">Suplemen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
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
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {formatDisplayDate(entry.tanggal)}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {entry.jenisMakanan || "-"}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {entry.jenisLaukSayur || "-"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {entry.makanSayurAtauBuah ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                  <Check className="w-3.5 h-3.5" /> Ya
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                  Tidak
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {entry.minumSuplemen ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs font-bold">
                                  <Check className="w-3.5 h-3.5" /> Ya
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                  Tidak
                                </span>
                              )}
                            </td>
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
    </div>
  );
}
