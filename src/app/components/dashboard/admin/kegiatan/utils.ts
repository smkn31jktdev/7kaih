/**
 * Format a date string to Indonesian long format.
 * e.g. "Senin, 1 Januari 2026"
 */
export function formatDisplayDate(value: string): string {
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
}

/**
 * Extract unique month keys from date entries.
 * Returns sorted array of "YYYY-MM" strings.
 */
export function extractMonthKeys(
  entries: Array<{ tanggal: string }>,
): string[] {
  return [
    ...new Set(
      entries.map((entry) => {
        const date = new Date(entry.tanggal);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}`;
      }),
    ),
  ].sort();
}

/**
 * Format a month key "YYYY-MM" to Indonesian label.
 * e.g. "2026-01" => "Januari 2026"
 */
export function formatMonthLabel(monthKey: string): string {
  if (monthKey === "all") return "Semua Bulan";
  const [year, month] = monthKey.split("-");
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(parseInt(year), parseInt(month) - 1));
}

/**
 * Filter entries by selected month key.
 */
export function filterEntriesByMonth<T extends { tanggal: string }>(
  entries: T[],
  selectedMonth: string,
): T[] {
  if (selectedMonth === "all") return entries;
  return entries.filter((entry) => {
    const date = new Date(entry.tanggal);
    return (
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}` === selectedMonth
    );
  });
}

/**
 * Filter students by search query (nama, nisn, kelas).
 */
export function filterStudentsBySearch<
  T extends { nama: string; nisn: string; kelas: string },
>(students: T[], searchQuery: string): T[] {
  if (!searchQuery) return students;
  const lower = searchQuery.toLowerCase();
  return students.filter(
    (s) =>
      s.nama.toLowerCase().includes(lower) ||
      s.nisn.includes(lower) ||
      s.kelas.toLowerCase().includes(lower),
  );
}

/**
 * Load Poppins font into jsPDF document.
 */
export async function loadPoppinsFont(
  doc: import("jspdf").jsPDF,
): Promise<void> {
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
    const boldBase64 = btoa(String.fromCharCode(...new Uint8Array(boldBuffer)));

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
}

/**
 * Render common PDF header (school name, title, subtitle).
 */
export function renderPDFHeader(
  doc: import("jspdf").jsPDF,
  subtitle: string,
  studentName: string,
  studentKelas: string,
  periodeLabel: string,
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 20;

  doc.setFont("Poppins", "bold");
  doc.setFontSize(14);
  doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(24);
  doc.text("JURNAL KEBIASAAN BAIK", pageWidth / 2, 35, { align: "center" });

  doc.setFont("Poppins", "normal");
  doc.setFontSize(16);
  doc.text(subtitle, pageWidth / 2, 45, { align: "center" });

  // Info Box
  doc.setFillColor(250, 250, 250);
  doc.rect(marginX, 60, pageWidth - 2 * marginX, 25, "F");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);

  doc.text(`Nama: ${studentName}`, marginX + 5, 70);
  doc.text(`Kelas: ${studentKelas || "-"}`, marginX + 5, 78);
  doc.text(`Periode: ${periodeLabel}`, marginX + 5, 86);
}
