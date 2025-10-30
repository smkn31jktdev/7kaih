import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { studentCollection } from "@/app/lib/db";
import { StudentLoginInput, Student } from "@/app/types/student";
import { generateToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    const body: StudentLoginInput = await request.json();
    const { nisn, password } = body;

    const student = (await studentCollection.findOne({
      nisn,
    })) as Student | null;
    if (!student) {
      return NextResponse.json(
        { error: "NISN atau password salah" },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "NISN atau password salah" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = generateToken({
      id: student.id,
      email: student.email || "",
      role: "student",
      nisn: student.nisn,
    });

    // Update isOnline status
    await studentCollection.updateOne(
      { id: student.id },
      { $set: { isOnline: true, updatedAt: new Date() } }
    );

    return NextResponse.json({
      token,
      student: { id: student.id, nisn: student.nisn, nama: student.nama },
    });
  } catch (error) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
