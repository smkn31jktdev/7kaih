import { NextRequest, NextResponse } from "next/server";
import { kehadiranCollection } from "@/app/lib/db";
import { resolveAdminStudents, HttpError } from "../kegiatan/helpers";

// Helper: Check if a date falls on Saturday or Sunday
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Helper: Get day name in Indonesian
function getHariName(dateStr: string): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const date = new Date(dateStr + "T00:00:00");
  return days[date.getDay()];
}

// GET: Fetch kehadiran data with filters
// Query params:
//   tanggal  - single date (YYYY-MM-DD)
//   dari     - start date for range (YYYY-MM-DD)
//   sampai   - end date for range (YYYY-MM-DD)
//   kelas    - filter by class
//   nisn     - filter by specific student
//   status   - filter by status (hadir | tidak_hadir | belum)
export async function GET(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get("tanggal");
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");
    const kelas = searchParams.get("kelas");
    const nisn = searchParams.get("nisn");
    const status = searchParams.get("status");

    // Build the kehadiran query filter
    const filter: Record<string, unknown> = {};

    // Date filter
    if (tanggal) {
      filter.tanggal = tanggal;
    } else if (dari && sampai) {
      filter.tanggal = { $gte: dari, $lte: sampai };
    } else {
      return NextResponse.json(
        { error: "Parameter tanggal atau dari/sampai harus diisi" },
        { status: 400 },
      );
    }

    // Scope to admin's students (walas filter)
    const allowedNisns = students.map((s) => s.nisn);
    filter.nisn = nisn
      ? allowedNisns.includes(nisn)
        ? nisn
        : "__none__"
      : { $in: allowedNisns };

    if (kelas) {
      filter.kelas = kelas;
    }

    if (status && status !== "belum") {
      filter.status = status;
    }

    // Fetch kehadiran records
    const records = await kehadiranCollection.find(filter).toArray();

    // Build kehadiran map by nisn+tanggal
    const kehadiranMap = new Map<string, Record<string, unknown>>();
    for (const r of records) {
      const key = `${r.nisn}_${r.tanggal}`;
      kehadiranMap.set(key, r);
    }

    // If single date, include students with "belum" status
    if (tanggal) {
      const filteredStudents = kelas
        ? students.filter((s) => s.kelas === kelas)
        : students;

      const result = filteredStudents.map((s) => {
        const key = `${s.nisn}_${tanggal}`;
        const kh = kehadiranMap.get(key);
        return {
          nisn: s.nisn,
          nama: s.nama,
          kelas: s.kelas,
          tanggal,
          hari: getHariName(tanggal),
          status: kh ? (kh.status as string) : "belum",
          waktuAbsen: kh ? (kh.waktuAbsen as string) : null,
          alasanTidakHadir: kh ? (kh.alasanTidakHadir as string) : null,
          koordinat: kh ? kh.koordinat : null,
          jarak: kh ? kh.jarak : null,
          akurasi: kh ? kh.akurasi : null,
          verifiedAt: kh ? kh.verifiedAt : null,
        };
      });

      // Apply status filter for "belum"
      const finalResult =
        status === "belum"
          ? result.filter((r) => r.status === "belum")
          : status
            ? result.filter((r) => r.status === status)
            : result;

      // Sort by kelas then nama
      finalResult.sort((a, b) => {
        const kelasCompare = a.kelas.localeCompare(b.kelas);
        return kelasCompare !== 0 ? kelasCompare : a.nama.localeCompare(b.nama);
      });

      return NextResponse.json({
        data: finalResult,
        total: finalResult.length,
        summary: {
          hadir: finalResult.filter((r) => r.status === "hadir").length,
          tidakHadir: finalResult.filter((r) => r.status === "tidak_hadir")
            .length,
          belum: finalResult.filter((r) => r.status === "belum").length,
        },
      });
    }

    // Range mode: return raw records sorted
    const sortedRecords = records.sort((a, b) => {
      const dateCompare = (a.tanggal as string).localeCompare(
        b.tanggal as string,
      );
      if (dateCompare !== 0) return dateCompare;
      const kelasCompare = (a.kelas as string).localeCompare(b.kelas as string);
      return kelasCompare !== 0
        ? kelasCompare
        : (a.nama as string).localeCompare(b.nama as string);
    });

    return NextResponse.json({
      data: sortedRecords,
      total: sortedRecords.length,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Admin kehadiran GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT: Admin update/correct kehadiran record
// Body: { nisn, tanggal, status, alasanTidakHadir? }
export async function PUT(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    const body = await request.json();
    const { nisn, tanggal, status, alasanTidakHadir } = body;

    if (!nisn || !tanggal || !status) {
      return NextResponse.json(
        { error: "nisn, tanggal, dan status harus diisi" },
        { status: 400 },
      );
    }

    if (isWeekend(tanggal)) {
      return NextResponse.json(
        { error: "Kehadiran hanya dapat dicatat pada hari Senin hingga Jumat" },
        { status: 400 },
      );
    }

    const validStatuses = ["hadir", "tidak_hadir"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status harus 'hadir' atau 'tidak_hadir'" },
        { status: 400 },
      );
    }

    // Verify the student is within admin scope
    const student = students.find((s) => s.nisn === nisn);
    if (!student) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan atau di luar wewenang Anda" },
        { status: 403 },
      );
    }

    const now = new Date();
    const hari = getHariName(tanggal);

    const existing = await kehadiranCollection.findOne({ nisn, tanggal });

    if (existing) {
      await kehadiranCollection.updateOne(
        { nisn, tanggal },
        {
          $set: {
            status,
            hari,
            alasanTidakHadir: alasanTidakHadir || "",
            updatedAt: now,
            updatedBy: "admin",
          },
        },
      );

      return NextResponse.json({
        message: `Kehadiran ${student.nama} pada ${tanggal} berhasil diperbarui`,
      });
    } else {
      // Create new record by admin
      await kehadiranCollection.insertOne({
        nisn: student.nisn,
        nama: student.nama,
        kelas: student.kelas,
        tanggal,
        hari,
        status,
        waktuAbsen: "",
        alasanTidakHadir: alasanTidakHadir || "",
        koordinat: null,
        jarak: null,
        akurasi: null,
        verifiedAt: "",
        createdAt: now,
        updatedAt: now,
        updatedBy: "admin",
      });

      return NextResponse.json({
        message: `Kehadiran ${student.nama} pada ${tanggal} berhasil ditambahkan`,
      });
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Admin kehadiran PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE: Admin delete kehadiran record
// Query params: nisn, tanggal
export async function DELETE(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    const { searchParams } = new URL(request.url);
    const nisn = searchParams.get("nisn");
    const tanggal = searchParams.get("tanggal");

    if (!nisn || !tanggal) {
      return NextResponse.json(
        { error: "Parameter nisn dan tanggal harus diisi" },
        { status: 400 },
      );
    }

    // Verify the student is within admin scope
    const student = students.find((s) => s.nisn === nisn);
    if (!student) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan atau di luar wewenang Anda" },
        { status: 403 },
      );
    }

    const result = await kehadiranCollection.deleteOne({ nisn, tanggal });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Data kehadiran tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: `Kehadiran ${student.nama} pada ${tanggal} berhasil dihapus`,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Admin kehadiran DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
