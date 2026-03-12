import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";

interface UpdateAdminBody {
  nama: string;
  email: string;
  password?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: adminId } = await params;
    if (!adminId) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const currentAdmin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;

    if (!currentAdmin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    if (currentAdmin.email !== "smkn31jktdev@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as UpdateAdminBody;
    const { nama, email, password } = body;

    if (!nama || !email) {
      return NextResponse.json(
        { error: "Nama dan email wajib diisi" },
        { status: 400 },
      );
    }

    const existingAdmin = (await adminCollection.findOne({
      id: adminId,
    })) as Admin | null;

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan" },
        { status: 404 },
      );
    }

    // Check duplicate email if changed
    if (email !== existingAdmin.email) {
      const duplicateEmail = await adminCollection.findOne({
        email,
        id: { $ne: adminId },
      });

      if (duplicateEmail) {
        return NextResponse.json(
          { error: "Email sudah terdaftar untuk admin lain" },
          { status: 400 },
        );
      }
    }

    const updatePayload: Partial<Admin> = {
      nama,
      email,
      updatedAt: new Date(),
    };

    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatePayload.password = hashedPassword;
    }

    await adminCollection.updateOne({ id: adminId }, { $set: updatePayload });

    return NextResponse.json({
      message: "Admin berhasil diperbarui",
      admin: {
        id: existingAdmin.id,
        nama,
        email,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: adminId } = await params;
    if (!adminId) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const currentAdmin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;

    if (!currentAdmin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    if (currentAdmin.email !== "smkn31jktdev@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingAdmin = (await adminCollection.findOne({
      id: adminId,
    })) as Admin | null;

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan" },
        { status: 404 },
      );
    }

    // Prevent deleting super admin
    if (existingAdmin.email === "smkn31jktdev@gmail.com") {
      return NextResponse.json(
        { error: "Super admin tidak dapat dihapus" },
        { status: 403 },
      );
    }

    const deleteResult = await adminCollection.deleteOne({ id: adminId });
    if (!deleteResult || deleteResult.deletedCount !== 1) {
      return NextResponse.json(
        { error: "Gagal menghapus data admin" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Admin berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
