import { NextRequest, NextResponse } from "next/server";
import { studentCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Student } from "@/app/types/student";

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

    const student = (await studentCollection.findOne({
      id: payload.id,
    })) as Student | null;

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      student: {
        id: student.id,
        nama: student.nama,
        nisn: student.nisn,
        kelas: student.kelas,
        email: student.email ?? null,
      },
    });
  } catch (error) {
    console.error("Student me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
