import jsPDF from "jspdf";
import type { StudentSemesterSummary } from "./types";
import { RATING_HEADERS } from "./types";

export function downloadSemesterPDF(summary: StudentSemesterSummary): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 15;

  const summaryYear = summary.tahunAjaran || "";

  // Title Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    "LAPORAN PROSES 7 KEBIASAAN BAIK ANAK INDONESIA HEBAT",
    pageWidth / 2,
    cursorY,
    { align: "center" },
  );
  cursorY += 6;
  doc.setFontSize(9);
  doc.text("SMK NEGERI 31 JAKARTA", pageWidth / 2, cursorY, {
    align: "center",
  });
  cursorY += 5;
  doc.text(
    `${summary.semesterLabel} — TAHUN AJARAN ${summaryYear}`,
    pageWidth / 2,
    cursorY,
    { align: "center" },
  );

  // Student Info
  cursorY += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const infoX = 15;
  doc.text(`Nama Siswa : ${summary.nama}`, infoX, cursorY);
  doc.text(`Wali Kelas  : ${summary.walas || "-"}`, pageWidth / 2, cursorY);
  cursorY += 5;
  doc.text(`NIS / NISN : ${summary.nisn || "-"}`, infoX, cursorY);
  doc.text(`Kelas        : ${summary.kelas || "-"}`, pageWidth / 2, cursorY);

  // Table
  cursorY += 8;
  const marginX = 10;
  const noWidth = 10;
  const indikatorWidth = 80;
  const monthColWidth = 20;
  const avgWidth = 20;
  const noteWidth =
    pageWidth -
    marginX * 2 -
    noWidth -
    indikatorWidth -
    monthColWidth * summary.months.length -
    avgWidth;

  const headerRowHeight = 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  const tableTop = cursorY;

  const drawTableHeader = (startY: number) => {
    const headerY = startY;

    // NO column
    doc.rect(marginX, headerY, noWidth, headerRowHeight);
    doc.text("NO", marginX + noWidth / 2, headerY + 5, { align: "center" });

    // INDIKATOR column
    let colX = marginX + noWidth;
    doc.rect(colX, headerY, indikatorWidth, headerRowHeight);
    doc.text("INDIKATOR", colX + indikatorWidth / 2, headerY + 5, {
      align: "center",
    });

    // Month columns
    colX += indikatorWidth;
    summary.months.forEach((month) => {
      doc.rect(colX, headerY, monthColWidth, headerRowHeight);
      const shortLabel = month.label.split(" ")[0]?.substring(0, 3) ?? "";
      doc.text(
        shortLabel.toUpperCase(),
        colX + monthColWidth / 2,
        headerY + 5,
        {
          align: "center",
        },
      );
      colX += monthColWidth;
    });

    // AVG column
    doc.rect(colX, headerY, avgWidth, headerRowHeight);
    doc.text("RATA²", colX + avgWidth / 2, headerY + 5, { align: "center" });

    // KETERANGAN column
    colX += avgWidth;
    doc.rect(colX, headerY, noteWidth, headerRowHeight);
    doc.text("KETERANGAN", colX + noteWidth / 2, headerY + 5, {
      align: "center",
    });

    return headerY + headerRowHeight;
  };

  let currentY = drawTableHeader(tableTop);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const lineHeight = 4;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  summary.indicators.forEach((indicator, index) => {
    const indicatorLines = doc.splitTextToSize(
      indicator.label,
      indikatorWidth - 4,
    ) as string[];

    // Collect the latest note
    const latestNote =
      summary.months
        .map((m) => indicator.notes[m.key])
        .filter(Boolean)
        .pop() || "-";

    const noteLines = doc.splitTextToSize(
      latestNote,
      noteWidth - 4,
    ) as string[];

    const maxLines = Math.max(indicatorLines.length, noteLines.length, 1);
    const rowHeight = maxLines * lineHeight + 4;

    // Page break
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 15;
      currentY = drawTableHeader(currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }

    let cellX = marginX;

    // NO
    doc.rect(cellX, currentY, noWidth, rowHeight);
    doc.text(
      String(index + 1),
      cellX + noWidth / 2,
      currentY + rowHeight / 2 + 1,
      { align: "center" },
    );
    cellX += noWidth;

    // INDIKATOR
    doc.rect(cellX, currentY, indikatorWidth, rowHeight);
    indicatorLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, cellX + 2, currentY + 4 + lineIndex * lineHeight);
    });
    cellX += indikatorWidth;

    // Monthly ratings
    summary.months.forEach((month) => {
      doc.rect(cellX, currentY, monthColWidth, rowHeight);
      const rating = indicator.ratings[month.key];
      if (rating) {
        doc.setFont("helvetica", "bold");
        doc.text(
          String(rating),
          cellX + monthColWidth / 2,
          currentY + rowHeight / 2 + 1,
          { align: "center" },
        );
        doc.setFont("helvetica", "normal");
      } else {
        doc.text("-", cellX + monthColWidth / 2, currentY + rowHeight / 2 + 1, {
          align: "center",
        });
      }
      cellX += monthColWidth;
    });

    // AVG
    doc.rect(cellX, currentY, avgWidth, rowHeight);
    doc.setFont("helvetica", "bold");
    doc.text(
      indicator.averageRating > 0 ? String(indicator.averageRating) : "-",
      cellX + avgWidth / 2,
      currentY + rowHeight / 2 + 1,
      { align: "center" },
    );
    doc.setFont("helvetica", "normal");
    cellX += avgWidth;

    // KETERANGAN
    doc.rect(cellX, currentY, noteWidth, rowHeight);
    noteLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, cellX + 2, currentY + 4 + lineIndex * lineHeight);
    });

    currentY += rowHeight;
  });

  // Rating Legend
  currentY += 8;
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("Keterangan Penilaian:", marginX, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  RATING_HEADERS.forEach((header) => {
    doc.text(`${header.value} = ${header.label}`, marginX, currentY);
    currentY += 3.5;
  });

  // Signature Section
  currentY += 8;
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = 15;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Jakarta, ${summary.semesterLabel}`, pageWidth - 70, currentY);

  currentY += 15;
  const sectionY = currentY;
  doc.text("Guru Wali", marginX, sectionY);
  doc.text("Orang Tua", pageWidth / 2 - 15, sectionY);
  doc.text("Siswa", pageWidth - 40, sectionY);

  currentY += 15;
  doc.setFont("helvetica", "bold");
  doc.text(summary.walas, marginX, currentY);
  doc.text("__________________", pageWidth / 2 - 15, currentY);
  doc.text(summary.nama, pageWidth - 40, currentY);

  doc.save(
    `laporan-semester-${summary.nama.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${summary.semesterKey}.pdf`,
  );
}
