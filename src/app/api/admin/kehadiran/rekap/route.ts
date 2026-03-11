import { NextRequest, NextResponse } from "next/server";
import { kehadiranCollection } from "@/app/lib/db";
import { resolveAdminStudents, HttpError } from "../../kegiatan/helpers";

// Helper: Count weekdays in a month
function countWeekdays(year: number, month: number): number {
  let count = 0;
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
    date.setDate(date.getDate() + 1);
  }
  return count;
}

// GET: Monthly rekap for a semester or custom range
// Query params:
//   semester - "ganjil" (Jul-Dec) or "genap" (Jan-Jun)
//   tahun    - year (YYYY), defaults to current year
//   kelas    - filter by class (optional)
//   nisn     - filter by specific student (optional)
export async function GET(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    const { searchParams } = new URL(request.url);
    const semester = searchParams.get("semester");
    const tahunStr = searchParams.get("tahun");
    const kelas = searchParams.get("kelas");
    const nisn = searchParams.get("nisn");

    const tahun = tahunStr ? parseInt(tahunStr) : new Date().getFullYear();

    let months: number[];
    if (semester === "ganjil") {
      months = [7, 8, 9, 10, 11, 12]; // Jul - Dec
    } else if (semester === "genap") {
      months = [1, 2, 3, 4, 5, 6]; // Jan - Jun
    } else {
      return NextResponse.json(
        { error: "Parameter semester harus 'ganjil' atau 'genap'" },
        { status: 400 },
      );
    }

    const startMonth = String(months[0]).padStart(2, "0");
    const endMonth = String(months[months.length - 1]).padStart(2, "0");
    const lastDay = new Date(tahun, months[months.length - 1], 0).getDate();

    const startDate = `${tahun}-${startMonth}-01`;
    const endDate = `${tahun}-${endMonth}-${String(lastDay).padStart(2, "0")}`;

    let filteredStudents = kelas
      ? students.filter((s) => s.kelas === kelas)
      : students;

    if (nisn) {
      filteredStudents = filteredStudents.filter((s) => s.nisn === nisn);
    }

    const allowedNisns = filteredStudents.map((s) => s.nisn);

    const filter: Record<string, unknown> = {
      tanggal: { $gte: startDate, $lte: endDate },
      nisn: { $in: allowedNisns },
    };

    const records = await kehadiranCollection.find(filter).toArray();

    // Group records by student and month
    const studentMonthMap = new Map<
      string,
      Map<number, { hadir: number; tidakHadir: number }>
    >();

    for (const s of filteredStudents) {
      const monthMap = new Map<number, { hadir: number; tidakHadir: number }>();
      for (const m of months) {
        monthMap.set(m, { hadir: 0, tidakHadir: 0 });
      }
      studentMonthMap.set(s.nisn, monthMap);
    }

    for (const r of records) {
      const recordMonth = parseInt((r.tanggal as string).split("-")[1]);
      const monthMap = studentMonthMap.get(r.nisn as string);
      if (monthMap) {
        const entry = monthMap.get(recordMonth);
        if (entry) {
          if (r.status === "hadir") entry.hadir++;
          else if (r.status === "tidak_hadir") entry.tidakHadir++;
        }
      }
    }

    // Build per-month weekday counts
    const monthWeekdays: Record<number, number> = {};
    for (const m of months) {
      monthWeekdays[m] = countWeekdays(tahun, m);
    }

    const namaBulan: Record<number, string> = {
      1: "Januari",
      2: "Februari",
      3: "Maret",
      4: "April",
      5: "Mei",
      6: "Juni",
      7: "Juli",
      8: "Agustus",
      9: "September",
      10: "Oktober",
      11: "November",
      12: "Desember",
    };

    // Build the rekap data
    const data = filteredStudents.map((s) => {
      const monthMap = studentMonthMap.get(s.nisn)!;
      let totalHadir = 0;
      let totalTidakHadir = 0;
      let totalHariEfektif = 0;

      const bulanan = months.map((m) => {
        const stats = monthMap.get(m)!;
        const hariEfektif = monthWeekdays[m];
        totalHadir += stats.hadir;
        totalTidakHadir += stats.tidakHadir;
        totalHariEfektif += hariEfektif;

        return {
          bulan: m,
          namaBulan: namaBulan[m],
          hariEfektif,
          hadir: stats.hadir,
          tidakHadir: stats.tidakHadir,
          belum: Math.max(0, hariEfektif - stats.hadir - stats.tidakHadir),
          persentase:
            hariEfektif > 0 ? Math.round((stats.hadir / hariEfektif) * 100) : 0,
        };
      });

      return {
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelas,
        bulanan,
        total: {
          hariEfektif: totalHariEfektif,
          hadir: totalHadir,
          tidakHadir: totalTidakHadir,
          belum: Math.max(0, totalHariEfektif - totalHadir - totalTidakHadir),
          persentase:
            totalHariEfektif > 0
              ? Math.round((totalHadir / totalHariEfektif) * 100)
              : 0,
        },
      };
    });

    data.sort((a, b) => {
      const kelasCompare = a.kelas.localeCompare(b.kelas);
      return kelasCompare !== 0 ? kelasCompare : a.nama.localeCompare(b.nama);
    });

    return NextResponse.json({
      semester,
      tahun,
      totalSiswa: filteredStudents.length,
      bulanList: months.map((m) => ({
        bulan: m,
        namaBulan: namaBulan[m],
        hariEfektif: monthWeekdays[m],
      })),
      data,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Admin kehadiran rekap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
