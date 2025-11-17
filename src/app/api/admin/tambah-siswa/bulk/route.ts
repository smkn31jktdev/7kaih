import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { studentCollection } from "@/app/lib/db";
import { Student } from "@/app/types/student";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const students = body?.students;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "No students provided" },
        { status: 400 }
      );
    }

    const inserted: string[] = [];
    const skipped: { nisn: string; reason: string }[] = [];

    const toInsert: Student[] = [];

    for (const s of students) {
      const nisn = s.nisn?.toString?.().trim?.() || "";
      const nama = s.nama?.toString?.().trim?.() || "";
      const kelas = s.kelas?.toString?.().trim?.() || "";
      const walas = s.walas?.toString?.().trim?.() || "";
      const password = s.password?.toString?.().trim?.() || "";

      if (!nisn || !nama || !kelas || !walas || !password) {
        skipped.push({ nisn, reason: "Missing required field(s)" });
        continue;
      }

      const existing = await studentCollection.findOne({ nisn });
      if (existing) {
        skipped.push({ nisn, reason: "NISN already exists" });
        continue;
      }

      const hashed = await bcrypt.hash(password, 10);

      const newStudent: Student = {
        id: crypto.randomUUID(),
        nisn,
        nama,
        kelas,
        walas,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toInsert.push(newStudent);
      inserted.push(nisn);
    }

    if (toInsert.length > 0) {
      await studentCollection.insertMany(toInsert);
    }

    return NextResponse.json(
      {
        message: "Import selesai",
        insertedCount: toInsert.length,
        inserted,
        skipped,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
