import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection, studentCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";
import { Student } from "@/app/types/student";

interface UpdateStudentBody {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  password?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    if (!studentId) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    const body = (await request.json()) as UpdateStudentBody;
    const { nisn, nama, kelas, walas, password } = body;

    if (!nisn || !nama || !kelas || !walas) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const existingStudent = (await studentCollection.findOne({
      id: studentId,
    })) as Student | null;

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    const isSuperAdmin = admin.email === "smkn31jktdev@gmail.com";
    if (!isSuperAdmin && existingStudent.walas !== admin.nama) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengubah siswa ini" },
        { status: 403 }
      );
    }

    if (nisn !== existingStudent.nisn) {
      const duplicateNisn = await studentCollection.findOne({
        nisn,
        id: { $ne: studentId },
      });

      if (duplicateNisn) {
        return NextResponse.json(
          { error: "NISN sudah terdaftar untuk siswa lain" },
          { status: 400 }
        );
      }
    }

    const updatePayload: Partial<Student> = {
      nisn,
      nama,
      kelas,
      walas,
      updatedAt: new Date(),
    };

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatePayload.password = hashedPassword;
    }

    await studentCollection.updateOne(
      { id: studentId },
      { $set: updatePayload }
    );

    return NextResponse.json({
      message: "Siswa berhasil diperbarui",
      student: {
        id: existingStudent.id,
        nisn,
        nama,
        kelas,
        walas,
      },
    });
  } catch (error) {
    console.error("Update siswa error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;
    if (!studentId) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;

    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    const existingStudent = (await studentCollection.findOne({
      id: studentId,
    })) as Student | null;

    if (!existingStudent) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    const isSuperAdmin = admin.email === "smkn31jktdev@gmail.com";
    if (!isSuperAdmin && existingStudent.walas !== admin.nama) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk menghapus siswa ini" },
        { status: 403 }
      );
    }

    const deleteResult = await studentCollection.deleteOne({ id: studentId });
    if (!deleteResult || deleteResult.deletedCount !== 1) {
      return NextResponse.json(
        { error: "Gagal menghapus data siswa" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Siswa berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete siswa error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
