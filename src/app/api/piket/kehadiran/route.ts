import { NextRequest, NextResponse } from "next/server";
import { studentCollection, kehadiranCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";

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

// Verify piket auth - returns token payload or throws
function verifyPiketAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    return null;
  }
  return payload;
}

// GET: Fetch all students' kehadiran for a given date
// Query params:
//   tanggal - date (YYYY-MM-DD)
//   kelas   - filter by class (optional)
export async function GET(request: NextRequest) {
  try {
    const payload = verifyPiketAuth(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get("tanggal");
    const kelas = searchParams.get("kelas");

    if (!tanggal) {
      return NextResponse.json(
        { error: "Tanggal harus diisi" },
        { status: 400 },
      );
    }

    // Fetch students (optionally filtered by class)
    const studentQuery: Record<string, unknown> = {};
    if (kelas) studentQuery.kelas = kelas;
    const students = await studentCollection.find(studentQuery).toArray();

    // Fetch all attendance records for the given date
    const kehadiranFilter: Record<string, unknown> = { tanggal };
    if (kelas) kehadiranFilter.kelas = kelas;
    const kehadiranRecords = await kehadiranCollection
      .find(kehadiranFilter)
      .toArray();

    // Map the attendance records by NISN for quick lookup
    const kehadiranMap = new Map<string, Record<string, unknown>>();
    for (const record of kehadiranRecords) {
      kehadiranMap.set(record.nisn as string, record);
    }

    // Combine student data with their attendance status
    const result = students.map((student) => {
      const kehadiran = kehadiranMap.get(student.nisn as string);
      return {
        id: student.id,
        nisn: student.nisn,
        nama: student.nama,
        kelas: student.kelas,
        status: kehadiran ? kehadiran.status : "belum",
        waktuAbsen: kehadiran ? kehadiran.waktuAbsen : null,
        alasanTidakHadir: kehadiran ? kehadiran.alasanTidakHadir : null,
        koordinat: kehadiran ? kehadiran.koordinat : null,
        jarak: kehadiran ? kehadiran.jarak : null,
      };
    });

    // Sort by kelas then nama
    result.sort((a, b) => {
      const kelasCompare = (a.kelas as string).localeCompare(b.kelas as string);
      return kelasCompare !== 0
        ? kelasCompare
        : (a.nama as string).localeCompare(b.nama as string);
    });

    // Summary counts
    const summary = {
      total: result.length,
      hadir: result.filter((r) => r.status === "hadir").length,
      tidakHadir: result.filter((r) => r.status === "tidak_hadir").length,
      belum: result.filter((r) => r.status === "belum").length,
    };

    return NextResponse.json({ data: result, summary });
  } catch (error) {
    console.error("Error fetching piket kehadiran:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT: Piket manually update a student's kehadiran
// Body: { nisn, tanggal, status, alasanTidakHadir? }
export async function PUT(request: NextRequest) {
  try {
    const piketPayload = verifyPiketAuth(request);
    if (!piketPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Verify student exists
    const student = await studentCollection.findOne({ nisn });
    if (!student) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 },
      );
    }

    const now = new Date();
    const hari = getHariName(tanggal);
    const waktuAbsen = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

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
            updatedBy: "piket",
          },
        },
      );
    } else {
      await kehadiranCollection.insertOne({
        nisn: student.nisn,
        nama: student.nama,
        kelas: student.kelas,
        tanggal,
        hari,
        status,
        waktuAbsen,
        alasanTidakHadir: alasanTidakHadir || "",
        koordinat: null,
        jarak: null,
        akurasi: null,
        verifiedAt: "",
        createdAt: now,
        updatedAt: now,
        updatedBy: "piket",
      });
    }

    return NextResponse.json({
      message: `Kehadiran ${student.nama} berhasil diperbarui menjadi ${status === "hadir" ? "Hadir" : "Tidak Hadir"}`,
    });
  } catch (error) {
    console.error("Error updating piket kehadiran:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST: Piket bulk update kehadiran (mark multiple students at once)
// Body: { tanggal, siswa: [{ nisn, status, alasanTidakHadir? }] }
export async function POST(request: NextRequest) {
  try {
    const piketPayload = verifyPiketAuth(request);
    if (!piketPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tanggal, siswa } = body;

    if (!tanggal) {
      return NextResponse.json(
        { error: "Tanggal harus diisi" },
        { status: 400 },
      );
    }

    if (isWeekend(tanggal)) {
      return NextResponse.json(
        { error: "Kehadiran hanya dapat dicatat pada hari Senin hingga Jumat" },
        { status: 400 },
      );
    }

    if (!Array.isArray(siswa) || siswa.length === 0) {
      return NextResponse.json(
        { error: "Data siswa harus berupa array dan tidak boleh kosong" },
        { status: 400 },
      );
    }

    // Limit bulk operations
    if (siswa.length > 100) {
      return NextResponse.json(
        { error: "Maksimal 100 siswa per batch" },
        { status: 400 },
      );
    }

    const now = new Date();
    const hari = getHariName(tanggal);
    const waktuAbsen = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    let berhasil = 0;
    let gagal = 0;
    const errors: string[] = [];

    for (const item of siswa) {
      const { nisn, status, alasanTidakHadir } = item;

      if (!nisn || !status) {
        gagal++;
        errors.push(`Data tidak lengkap untuk NISN: ${nisn || "kosong"}`);
        continue;
      }

      const validStatuses = ["hadir", "tidak_hadir"];
      if (!validStatuses.includes(status)) {
        gagal++;
        errors.push(`Status tidak valid untuk NISN: ${nisn}`);
        continue;
      }

      const student = await studentCollection.findOne({ nisn });
      if (!student) {
        gagal++;
        errors.push(`Siswa dengan NISN ${nisn} tidak ditemukan`);
        continue;
      }

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
              updatedBy: "piket",
            },
          },
        );
      } else {
        await kehadiranCollection.insertOne({
          nisn: student.nisn,
          nama: student.nama,
          kelas: student.kelas,
          tanggal,
          hari,
          status,
          waktuAbsen,
          alasanTidakHadir: alasanTidakHadir || "",
          koordinat: null,
          jarak: null,
          akurasi: null,
          verifiedAt: "",
          createdAt: now,
          updatedAt: now,
          updatedBy: "piket",
        });
      }

      berhasil++;
    }

    return NextResponse.json({
      message: `${berhasil} siswa berhasil diupdate${gagal > 0 ? `, ${gagal} gagal` : ""}`,
      berhasil,
      gagal,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk updating piket kehadiran:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
