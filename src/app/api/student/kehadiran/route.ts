import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { studentCollection, kehadiranCollection } from "@/app/lib/db";
import db from "@/app/lib/db";

// Helper: Check if a date string (YYYY-MM-DD) falls on Saturday (6) or Sunday (0)
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

// Helper: Get day name in Indonesian
function getHariName(dateStr: string): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const date = new Date(dateStr + "T00:00:00");
  return days[date.getDay()];
}

// POST: Save/update kehadiran data
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch student data from database
    const student = await studentCollection.findOne({ nisn: payload.nisn });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await request.json();
    const { tanggal, kehadiran } = body;

    // Validate tanggal
    if (!tanggal) {
      return NextResponse.json(
        { error: "Tanggal harus diisi" },
        { status: 400 },
      );
    }

    // Validate: attendance cannot be recorded on weekends
    if (isWeekend(tanggal)) {
      return NextResponse.json(
        {
          error: "Kehadiran tidak dapat dicatat pada hari Sabtu dan Minggu",
        },
        { status: 400 },
      );
    }

    if (!kehadiran || !kehadiran.status) {
      return NextResponse.json(
        { error: "Data kehadiran tidak valid" },
        { status: 400 },
      );
    }

    // Ensure collection exists
    await db.createCollection("kehadiran").catch(() => {});

    // Build precise timestamp with jam:menit:detik
    const now = new Date();
    const waktuPrecise = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });

    const hari = getHariName(tanggal);

    // Build the kehadiran document
    const kehadiranDoc = {
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      tanggal,
      hari,
      status: kehadiran.status, // "hadir" | "tidak_hadir"
      waktuAbsen: waktuPrecise, // "HH:mm:ss" format
      alasanTidakHadir: kehadiran.alasanTidakHadir || "",
      koordinat: kehadiran.koordinat || null,
      jarak: kehadiran.jarak !== undefined ? kehadiran.jarak : null,
      akurasi: kehadiran.akurasi !== undefined ? kehadiran.akurasi : null,
      verifiedAt: kehadiran.verifiedAt || now.toISOString(),
      updatedAt: now,
    };

    // Check if record already exists for this student on this date
    const existing = await kehadiranCollection.findOne({
      nisn: student.nisn,
      tanggal,
    });

    if (existing) {
      // Update existing record
      await kehadiranCollection.updateOne(
        { nisn: student.nisn, tanggal },
        { $set: kehadiranDoc },
      );

      return NextResponse.json({
        message: "Data kehadiran berhasil diperbarui",
        data: kehadiranDoc,
      });
    } else {
      // Insert new record
      await kehadiranCollection.insertOne({
        ...kehadiranDoc,
        createdAt: now,
      });

      return NextResponse.json({
        message: "Data kehadiran berhasil disimpan",
        data: kehadiranDoc,
      });
    }
  } catch (error) {
    console.error("Kehadiran save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET: Fetch kehadiran data by date or date range
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get("tanggal");
    const bulan = searchParams.get("bulan"); // Format: YYYY-MM (for monthly summary)

    // Ensure collection exists
    await db.createCollection("kehadiran").catch(() => {});

    if (tanggal) {
      // Get single day kehadiran
      const kehadiran = await kehadiranCollection.findOne({
        nisn: payload.nisn,
        tanggal,
      });

      return NextResponse.json({ kehadiran });
    }

    if (bulan) {
      // Get monthly summary - find all records for the month
      // bulan format: "YYYY-MM"
      const startDate = `${bulan}-01`;
      const [year, month] = bulan.split("-").map(Number);
      const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

      const records = await kehadiranCollection
        .find({
          nisn: payload.nisn,
          tanggal: { $gte: startDate, $lte: endDate },
        })
        .toArray();

      // Calculate summary
      const hadirCount = records.filter(
        (r: Record<string, unknown>) => r.status === "hadir",
      ).length;
      const tidakHadirCount = records.filter(
        (r: Record<string, unknown>) => r.status === "tidak_hadir",
      ).length;

      // Count weekdays in the month (excluding Sat & Sun)
      let totalWeekdays = 0;
      const monthDate = new Date(year, month - 1, 1);
      while (monthDate.getMonth() === month - 1) {
        const dayOfWeek = monthDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          totalWeekdays++;
        }
        monthDate.setDate(monthDate.getDate() + 1);
      }

      return NextResponse.json({
        records,
        summary: {
          totalWeekdays,
          hadir: hadirCount,
          tidakHadir: tidakHadirCount,
          belumAbsen: totalWeekdays - hadirCount - tidakHadirCount,
        },
      });
    }

    return NextResponse.json(
      { error: "Parameter tanggal atau bulan harus diisi" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Kehadiran fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
