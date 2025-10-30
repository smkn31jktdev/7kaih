import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { studentCollection } from "@/app/lib/db";
import { Student } from "@/app/types/student";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nisn, nama, kelas, walas, password } = body;

    // Validate required fields
    if (!nisn || !nama || !kelas || !walas || !password) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // Check if student with NISN already exists
    const existingStudent = await studentCollection.findOne({ nisn });
    if (existingStudent) {
      return NextResponse.json(
        { error: "NISN sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student document
    const newStudent: Student = {
      id: crypto.randomUUID(),
      nisn,
      nama,
      kelas,
      walas,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into collection
    await studentCollection.insertOne(newStudent);

    return NextResponse.json(
      { message: "Siswa berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Tambah siswa error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
