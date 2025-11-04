import { NextRequest, NextResponse } from "next/server";
import { studentCollection, adminCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer'
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch admin from DB using id from token
    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    // Get students based on admin permissions
    let studentsQuery = {};
    // Super admin check
    if (admin.email !== "smkn31jktdev@gmail.com") {
      studentsQuery = { walas: admin.nama };
    }
    // If super admin, get all students (empty query)

    const students = await studentCollection.find(studentsQuery).toArray();

    // Transform data to include only necessary fields
    const studentList = students.map((student) => ({
      id: student.id,
      nama: student.nama,
      kelas: student.kelas,
      nisn: student.nisn,
      walas: student.walas,
      isOnline: student.isOnline || false,
    }));

    const count = students.length;

    return NextResponse.json({
      count,
      students: studentList,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data siswa" },
      { status: 500 }
    );
  }
}
