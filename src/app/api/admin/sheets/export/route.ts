import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import {
  kegiatanCollection,
  adminCollection,
  studentCollection,
} from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";
import { Admin } from "@/app/types/admin";
import { Student } from "@/app/types/student";
import {
  evaluateIndicators,
  formatMonthLabel,
  monthKeyFromDate,
  safeParseDate,
} from "@/app/api/admin/kegiatan/summary/evaluators";

type SheetRow = {
  no: number;
  nisn: string;
  nama: string;
  kelas: string;
  periode: string;
  bangunPagi: number;
  beribadahBerdoa: number;
  beribadahSholatFajar: number;
  beribadahSholatLimaWaktu: number;
  beribadahZikir: number;
  beribadahSholatDhuha: number;
  beribadahSholatRawatib: number;
  beribadahZakat: number;
  olahraga: number;
  makanSehat: number;
  belajarKitabSuci: number;
  belajarBukuBacaan: number;
  belajarBukuPelajaran: number;
  belajarTugas: number;
  belajarNilai: number;
  bermasyarakat: number;
  tidurCepat: number;
  nilaiMaks: number;
  nilaiPerolehan: number;
  nilaiAkhir: number;
};

function buildInstructionRows(): string[][] {
  return [[""]];
}

const HEADER_ROW = [
  "NO",
  "NISN",
  "NAMA SISWA",
  "KELAS",
  "PERIODE",
  "1 Bangun Pagi",
  "2a Berdoa",
  "2b Sholat Fajar",
  "2c Sholat 5 Waktu",
  "2d Zikir & Doa",
  "2e Sholat Dhuha",
  "2f Sholat Rawatib",
  "2g Zakat / Infaq / Sedekah",
  "3 Berolahraga",
  "4 Makan Sehat",
  "5a Membaca Kitab Suci",
  "5b Membaca Buku Bacaan",
  "5c Membaca Buku Pelajaran",
  "5d Mengerjakan Tugas / PR",
  "5e Nilai Belajar",
  "6 Bermasyarakat",
  "7 Tidur Cepat",
  "Nilai Maks",
  "Nilai Perolehan",
  "Nilai Akhir (%)",
];

function formatMonthKeyToLabel(monthKey: string): string {
  const [yearString, monthString] = monthKey.split("-");
  const year = Number.parseInt(yearString ?? "", 10);
  const month = Number.parseInt(monthString ?? "", 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return monthKey;
  }
  const monthStart = new Date(year, month - 1, 1);
  return formatMonthLabel(monthStart);
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  const needsWrap = /[",\n\r]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const admin = await adminCollection.findOne({ id: payload.id });
    if (!admin)
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // Determine target month from query param `month=YYYY-MM`. Default: latest month present
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");

    const allStudents = (await studentCollection
      .find({})
      .toArray()) as unknown as Student[];
    const adminData = admin as unknown as Admin;
    const allowedNisns =
      adminData.email === "smkn31jktdev@gmail.com"
        ? allStudents.map((s) => s.nisn)
        : allStudents
            .filter((s) => s.walas === adminData.nama)
            .map((s) => s.nisn);

    const documents = await kegiatanCollection
      .find({ nisn: { $in: allowedNisns } })
      .toArray();

    const perStudent = new Map<
      string,
      { student: Student; entries: Kebiasaan[] }
    >();

    for (const doc of documents) {
      const keb = doc as unknown as Kebiasaan;
      const parsedDate = safeParseDate(keb.tanggal);
      if (!parsedDate) continue;
      const existing = perStudent.get(keb.nisn);
      if (!existing) {
        const studentData = allStudents.find((s) => s.nisn === keb.nisn);
        if (!studentData) continue;
        perStudent.set(keb.nisn, { student: studentData, entries: [keb] });
      } else {
        existing.entries.push(keb);
      }
    }

    const sheetRows: SheetRow[] = [];
    const sortedRecords = Array.from(perStudent.entries()).sort((a, b) => {
      const studentA = a[1].student.nama.toLocaleLowerCase("id-ID");
      const studentB = b[1].student.nama.toLocaleLowerCase("id-ID");
      return studentA.localeCompare(studentB, "id-ID");
    });

    let counter = 1;

    for (const [nisn, data] of sortedRecords) {
      let targetMonth = monthParam ?? null;
      if (!targetMonth) {
        const months = data.entries
          .map((entry) => {
            const parsed = safeParseDate(entry.tanggal);
            return parsed ? monthKeyFromDate(parsed).key : null;
          })
          .filter(Boolean) as string[];
        months.sort();
        targetMonth = months.at(-1) ?? null;
      }

      if (!targetMonth) {
        continue;
      }

      const entriesForMonth = data.entries.filter((entry) => {
        const parsed = safeParseDate(entry.tanggal);
        if (!parsed) return false;
        return monthKeyFromDate(parsed).key === targetMonth;
      });

      if (entriesForMonth.length === 0) {
        continue;
      }

      const bundle = evaluateIndicators(entriesForMonth);
      const beribadahMap = new Map(
        bundle.beribadah.components.map((component) => [
          component.key,
          component,
        ])
      );
      const belajarMap = new Map(
        bundle.belajar.components.map((component) => [component.key, component])
      );

      const row: SheetRow = {
        no: counter,
        nisn,
        nama: data.student.nama,
        kelas: data.student.kelas,
        periode: formatMonthKeyToLabel(targetMonth),
        bangunPagi: bundle.bangunPagi.rating,
        beribadahBerdoa:
          beribadahMap.get("berdoaUntukDiriDanOrtu")?.rating ?? 1,
        beribadahSholatFajar: beribadahMap.get("sholatFajar")?.rating ?? 1,
        beribadahSholatLimaWaktu:
          beribadahMap.get("sholatLimaWaktuBerjamaah")?.rating ?? 1,
        beribadahZikir: beribadahMap.get("zikirSesudahSholat")?.rating ?? 1,
        beribadahSholatDhuha: beribadahMap.get("sholatDhuha")?.rating ?? 1,
        beribadahSholatRawatib:
          beribadahMap.get("sholatSunahRawatib")?.rating ?? 1,
        beribadahZakat: beribadahMap.get("zakatInfaqSedekah")?.rating ?? 1,
        olahraga: bundle.olahraga.rating,
        makanSehat: bundle.makanSehat.rating,
        belajarKitabSuci: belajarMap.get("membaca-kitab-suci")?.rating ?? 1,
        belajarBukuBacaan: belajarMap.get("membaca-buku-bacaan")?.rating ?? 1,
        belajarBukuPelajaran:
          belajarMap.get("membaca-buku-pelajaran")?.rating ?? 1,
        belajarTugas: belajarMap.get("mengerjakan-tugas")?.rating ?? 1,
        belajarNilai: bundle.belajar.rating,
        bermasyarakat: bundle.bermasyarakat.rating,
        tidurCepat: bundle.tidur.rating,
        nilaiMaks: 90,
        nilaiPerolehan: 0,
        nilaiAkhir: 0,
      };

      const nilaiPerolehanTotal =
        row.bangunPagi +
        row.beribadahBerdoa +
        row.beribadahSholatFajar +
        row.beribadahSholatLimaWaktu +
        row.beribadahZikir +
        row.beribadahSholatDhuha +
        row.beribadahSholatRawatib +
        row.beribadahZakat +
        row.olahraga +
        row.makanSehat +
        row.belajarKitabSuci +
        row.belajarBukuBacaan +
        row.belajarBukuPelajaran +
        row.belajarTugas +
        row.bermasyarakat +
        row.tidurCepat;

      row.nilaiPerolehan = nilaiPerolehanTotal;
      row.nilaiAkhir = Math.round((row.nilaiPerolehan / row.nilaiMaks) * 100);

      sheetRows.push(row);
      counter += 1;
    }

    const csvMatrix: string[][] = [];
    const instructionRows = buildInstructionRows().map((row) =>
      row.map(escapeCsvValue)
    );
    csvMatrix.push(...instructionRows);
    csvMatrix.push(HEADER_ROW.map(escapeCsvValue));

    for (const row of sheetRows) {
      csvMatrix.push(
        [
          row.no,
          row.nisn,
          row.nama,
          row.kelas,
          row.periode,
          row.bangunPagi,
          row.beribadahBerdoa,
          row.beribadahSholatFajar,
          row.beribadahSholatLimaWaktu,
          row.beribadahZikir,
          row.beribadahSholatDhuha,
          row.beribadahSholatRawatib,
          row.beribadahZakat,
          row.olahraga,
          row.makanSehat,
          row.belajarKitabSuci,
          row.belajarBukuBacaan,
          row.belajarBukuPelajaran,
          row.belajarTugas,
          row.belajarNilai,
          row.bermasyarakat,
          row.tidurCepat,
          row.nilaiMaks,
          row.nilaiPerolehan,
          row.nilaiAkhir,
        ].map(escapeCsvValue)
      );
    }

    const csv = csvMatrix
      .map((row) => (Array.isArray(row) ? row.join(",") : String(row)))
      .join("\r\n");
    const buffer = Buffer.from(csv, "utf8");

    const filename = `penilaian_akhir_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}
