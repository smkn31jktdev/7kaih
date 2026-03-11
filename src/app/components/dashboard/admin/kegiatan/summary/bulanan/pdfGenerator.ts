import jsPDF from "jspdf";
import type { StudentSummary } from "./types";
import { RATING_HEADERS } from "./types";

export function downloadSummaryPDF(summary: StudentSummary): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let cursorY = 20;

  const summaryYear = summary.monthKey.split("-")[0] || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
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
  cursorY += 6;
  doc.text(`TAHUN ${summaryYear}`, pageWidth / 2, cursorY, {
    align: "center",
  });

  cursorY += 12;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const infoX = 20;
  doc.text(`Nama Siswa : ${summary.nama}`, infoX, cursorY);
  cursorY += 6;
  doc.text(`NIS / NISN : ${summary.nisn || "-"}`, infoX, cursorY);
  cursorY += 6;
  doc.text(`Kelas : ${summary.kelas || "-"}`, infoX, cursorY);

  const marginX = 15;
  const columnWidths = [12, 60, 16, 16, 16, 16, 16, 28];
  const headerRowHeight = 10;
  const subHeaderHeight = 7;
  cursorY += 10;
  const tableTop = cursorY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const drawTableHeader = (startY: number) => {
    const headerY = startY;
    doc.rect(
      marginX,
      headerY,
      columnWidths[0],
      headerRowHeight + subHeaderHeight,
    );
    doc.text("NO", marginX + columnWidths[0] / 2, headerY + headerRowHeight, {
      align: "center",
    });

    const indikatorX = marginX + columnWidths[0];
    doc.rect(
      indikatorX,
      headerY,
      columnWidths[1],
      headerRowHeight + subHeaderHeight,
    );
    doc.text(
      "INDIKATOR",
      indikatorX + columnWidths[1] / 2,
      headerY + headerRowHeight,
      { align: "center" },
    );

    let runningX = indikatorX + columnWidths[1];
    RATING_HEADERS.forEach((header) => {
      const width = columnWidths[header.value + 1];
      doc.rect(runningX, headerY, width, headerRowHeight);
      const labelLines = doc.splitTextToSize(
        header.label,
        width - 2,
      ) as string[];
      doc.setFontSize(8);
      labelLines.forEach((line: string, lineIndex: number) => {
        const lineY = headerY + 3 + lineIndex * 2.5;
        doc.text(line, runningX + width / 2, lineY, { align: "center" });
      });
      doc.setFontSize(8);
      doc.rect(runningX, headerY + headerRowHeight, width, subHeaderHeight);
      doc.text(
        String(header.value),
        runningX + width / 2,
        headerY + headerRowHeight + 3.5,
        { align: "center" },
      );
      doc.setFontSize(8);
      runningX += width;
    });

    doc.rect(
      runningX,
      headerY,
      columnWidths[columnWidths.length - 1],
      headerRowHeight + subHeaderHeight,
    );
    doc.text(
      "KETERANGAN",
      runningX + columnWidths[columnWidths.length - 1] / 2,
      headerY + headerRowHeight,
      { align: "center" },
    );
    return headerY + headerRowHeight + subHeaderHeight;
  };

  // Draw initial header
  let currentY = drawTableHeader(tableTop);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const lineHeight = 5;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 20;

  summary.indicators.forEach((indicator, index) => {
    const indicatorLines = doc.splitTextToSize(
      indicator.label,
      columnWidths[1] - 4,
    ) as string[];
    const noteLines = doc.splitTextToSize(
      indicator.note || "-",
      columnWidths[columnWidths.length - 1] - 4,
    ) as string[];
    const maxLines = Math.max(indicatorLines.length, noteLines.length, 1);
    const rowHeight = maxLines * lineHeight + 4;

    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 20;
      currentY = drawTableHeader(currentY);
    }

    let cellX = marginX;

    doc.rect(cellX, currentY, columnWidths[0], rowHeight);
    doc.text(
      String(index + 1),
      cellX + columnWidths[0] / 2,
      currentY + rowHeight / 2 + 1,
      { align: "center" },
    );
    cellX += columnWidths[0];

    doc.rect(cellX, currentY, columnWidths[1], rowHeight);
    indicatorLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, cellX + 2, currentY + 5 + lineIndex * lineHeight);
    });
    cellX += columnWidths[1];

    RATING_HEADERS.forEach((header) => {
      const width = columnWidths[header.value + 1];
      doc.rect(cellX, currentY, width, rowHeight);
      if (indicator.rating === header.value) {
        doc.setFont("helvetica", "bold");
        doc.text("V", cellX + width / 2, currentY + rowHeight / 2 + 1, {
          align: "center",
        });
        doc.setFont("helvetica", "normal");
      }
      cellX += width;
    });

    const noteWidth = columnWidths[columnWidths.length - 1];
    doc.rect(cellX, currentY, noteWidth, rowHeight);
    noteLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, cellX + 2, currentY + 5 + lineIndex * lineHeight);
    });

    currentY += rowHeight;
  });

  currentY += 12;
  doc.setFont("helvetica", "normal");
  doc.text(`Jakarta, ${summary.monthLabel}`, pageWidth - 70, currentY);

  currentY += 20;
  const sectionY = currentY;
  doc.text("Guru Wali", marginX, sectionY);
  doc.text("Orang Tua", pageWidth / 2 - 15, sectionY);
  doc.text("Siswa", pageWidth - 40, sectionY);

  currentY += 20;
  doc.setFont("helvetica", "bold");
  doc.text(summary.walas, marginX, currentY);
  doc.text("__________________", pageWidth / 2 - 15, currentY);
  doc.text(summary.nama, pageWidth - 40, currentY);

  doc.save(
    `laporan-kebiasaan-${summary.nama
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.pdf`,
  );
}
