import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { kegiatanCollection, studentCollection } from "@/app/lib/db";
import db from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";

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
    const { section, ...data } = body;

    // Validasi data
    if (!data.tanggal) {
      return NextResponse.json(
        { error: "Tanggal harus diisi" },
        { status: 400 }
      );
    }

    await db.createCollection("kebiasaan_hebat").catch(() => {});

    const existingData = await kegiatanCollection.findOne({
      nisn: payload.nisn,
      tanggal: data.tanggal,
    });

    let updateData: Partial<Kebiasaan> & {
      nisn: string;
      nama: string;
      kelas: string;
      tanggal: string;
      updatedAt: Date;
      [key: string]: unknown;
    } = {
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      tanggal: data.tanggal,
      updatedAt: new Date(),
    };

    if (section) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any)[section] = (data as any)[section];
    } else {
      updateData = {
        ...updateData,
        ...data,
      };
    }

    delete (updateData as { [key: string]: unknown })["_id"];

    const upd = updateData as Record<string, unknown>;
    if (upd.olahraga && typeof upd.olahraga === "object") {
      const o = upd.olahraga as Record<string, unknown>;
      // Keep jenisOlahraga
      updateData = {
        ...(updateData as object),
        olahraga: o,
      } as typeof updateData;
    }

    if (existingData) {
      // Update data existing
      await kegiatanCollection.updateOne(
        { nisn: payload.nisn, tanggal: data.tanggal },
        {
          $set: updateData,
        }
      );

      return NextResponse.json({
        message: section
          ? `Data ${section} berhasil diperbarui`
          : "Data kegiatan berhasil diperbarui",
      });
    } else {
      // Insert data baru
      updateData.createdAt = new Date();
      await kegiatanCollection.insertOne(updateData);

      return NextResponse.json({
        message: section
          ? `Data ${section} berhasil disimpan`
          : "Data kegiatan berhasil disimpan",
      });
    }
  } catch (error) {
    console.error("Kegiatan save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Ambil data kegiatan berdasarkan tanggal
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

    if (!tanggal) {
      return NextResponse.json(
        { error: "Tanggal harus diisi" },
        { status: 400 }
      );
    }

    await db.createCollection("kebiasaan_hebat").catch(() => {});

    const kegiatan = await kegiatanCollection.findOne({
      nisn: payload.nisn,
      tanggal,
    });

    return NextResponse.json({ kegiatan });
  } catch (error) {
    console.error("Kegiatan fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
