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

// Helper: Count weekdays in a date range
function countWeekdaysInRange(startDate: string, endDate: string): number {
  let count = 0;
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// GET: Attendance summary statistics
// Query params:
//   bulan   - month (YYYY-MM) for monthly summary
//   dari    - start date (YYYY-MM-DD) for custom range
//   sampai  - end date (YYYY-MM-DD) for custom range
//   kelas   - filter by class (optional)
//   mode    - "kelas" for per-class breakdown, "siswa" for per-student breakdown (default: kelas)
export async function GET(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    const kelas = searchParams.get("kelas");
    const mode = searchParams.get("mode") || "kelas";

    let startDate: string;
    let endDate: string;
    let totalWeekdays: number;

    if (bulan) {
      const [year, month] = bulan.split("-").map(Number);
      startDate = `${bulan}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${bulan}-${String(lastDay).padStart(2, "0")}`;
      totalWeekdays = countWeekdays(year, month);
    } else if (dari && sampai) {
      startDate = dari;
      endDate = sampai;
      totalWeekdays = countWeekdaysInRange(dari, sampai);
    } else {
      return NextResponse.json(
        { error: "Parameter bulan atau dari/sampai harus diisi" },
        { status: 400 },
      );
    }

    const allowedNisns = students.map((s) => s.nisn);

    // Build filter
    const filter: Record<string, unknown> = {
      tanggal: { $gte: startDate, $lte: endDate },
      nisn: { $in: allowedNisns },
    };
    if (kelas) filter.kelas = kelas;

    const records = await kehadiranCollection.find(filter).toArray();

    const filteredStudents = kelas
      ? students.filter((s) => s.kelas === kelas)
      : students;

    if (mode === "siswa") {
      // Per-student breakdown
      const studentMap = new Map<
        string,
        { hadir: number; tidakHadir: number }
      >();
      for (const s of filteredStudents) {
        studentMap.set(s.nisn, { hadir: 0, tidakHadir: 0 });
      }

      for (const r of records) {
        const entry = studentMap.get(r.nisn as string);
        if (entry) {
          if (r.status === "hadir") entry.hadir++;
          else if (r.status === "tidak_hadir") entry.tidakHadir++;
        }
      }

      const data = filteredStudents.map((s) => {
        const stats = studentMap.get(s.nisn) || { hadir: 0, tidakHadir: 0 };
        const belum = totalWeekdays - stats.hadir - stats.tidakHadir;
        const persentase =
          totalWeekdays > 0
            ? Math.round((stats.hadir / totalWeekdays) * 100)
            : 0;

        return {
          nisn: s.nisn,
          nama: s.nama,
          kelas: s.kelas,
          hadir: stats.hadir,
          tidakHadir: stats.tidakHadir,
          belum: Math.max(0, belum),
          totalHariEfektif: totalWeekdays,
          persentaseKehadiran: persentase,
        };
      });

      data.sort((a, b) => {
        const kelasCompare = a.kelas.localeCompare(b.kelas);
        return kelasCompare !== 0
          ? kelasCompare
          : b.persentaseKehadiran - a.persentaseKehadiran;
      });

      const totalHadir = data.reduce((sum, d) => sum + d.hadir, 0);
      const totalTidakHadir = data.reduce((sum, d) => sum + d.tidakHadir, 0);
      const totalExpected = filteredStudents.length * totalWeekdays;

      return NextResponse.json({
        mode: "siswa",
        periode: bulan || `${dari} s/d ${sampai}`,
        totalHariEfektif: totalWeekdays,
        totalSiswa: filteredStudents.length,
        ringkasan: {
          hadir: totalHadir,
          tidakHadir: totalTidakHadir,
          belum: Math.max(0, totalExpected - totalHadir - totalTidakHadir),
          persentaseKehadiran:
            totalExpected > 0
              ? Math.round((totalHadir / totalExpected) * 100)
              : 0,
        },
        data,
      });
    }

    // Default mode: per-class breakdown
    const classMap = new Map<
      string,
      { totalSiswa: number; hadir: number; tidakHadir: number }
    >();

    for (const s of filteredStudents) {
      if (!classMap.has(s.kelas)) {
        classMap.set(s.kelas, { totalSiswa: 0, hadir: 0, tidakHadir: 0 });
      }
      classMap.get(s.kelas)!.totalSiswa++;
    }

    for (const r of records) {
      const entry = classMap.get(r.kelas as string);
      if (entry) {
        if (r.status === "hadir") entry.hadir++;
        else if (r.status === "tidak_hadir") entry.tidakHadir++;
      }
    }

    const data = Array.from(classMap.entries())
      .map(([kelasName, stats]) => {
        const expected = stats.totalSiswa * totalWeekdays;
        const belum = expected - stats.hadir - stats.tidakHadir;
        return {
          kelas: kelasName,
          totalSiswa: stats.totalSiswa,
          totalHariEfektif: totalWeekdays,
          hadir: stats.hadir,
          tidakHadir: stats.tidakHadir,
          belum: Math.max(0, belum),
          persentaseKehadiran:
            expected > 0 ? Math.round((stats.hadir / expected) * 100) : 0,
        };
      })
      .sort((a, b) => a.kelas.localeCompare(b.kelas));

    const totalHadir = data.reduce((sum, d) => sum + d.hadir, 0);
    const totalTidakHadir = data.reduce((sum, d) => sum + d.tidakHadir, 0);
    const totalExpected = filteredStudents.length * totalWeekdays;

    return NextResponse.json({
      mode: "kelas",
      periode: bulan || `${dari} s/d ${sampai}`,
      totalHariEfektif: totalWeekdays,
      totalSiswa: filteredStudents.length,
      ringkasan: {
        hadir: totalHadir,
        tidakHadir: totalTidakHadir,
        belum: Math.max(0, totalExpected - totalHadir - totalTidakHadir),
        persentaseKehadiran:
          totalExpected > 0
            ? Math.round((totalHadir / totalExpected) * 100)
            : 0,
      },
      data,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Admin kehadiran summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
