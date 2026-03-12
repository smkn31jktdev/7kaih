import { NextRequest, NextResponse } from "next/server";
import { adminCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";
import { writeFile, unlink } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profil");

function getExtension(mimeType: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return map[mimeType] || "jpg";
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("foto") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File foto harus diisi" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File harus berupa gambar JPG, PNG, atau WebP" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 2MB" },
        { status: 400 },
      );
    }

    // Hapus foto lama jika ada
    if (admin.fotoProfil) {
      try {
        const oldPath = path.join(process.cwd(), "public", admin.fotoProfil);
        await unlink(oldPath);
      } catch {}
    }

    // Simpan file ke filesystem
    const ext = getExtension(file.type);
    const fileName = `admin_${payload.id}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const fotoUrl = `/uploads/profil/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Simpan URL path di database (string kecil, aman untuk Astra DB)
    await adminCollection.updateOne(
      { id: payload.id },
      {
        $set: {
          fotoProfil: fotoUrl,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      message: "Foto profil berhasil diperbarui",
      fotoProfil: fotoUrl,
    });
  } catch (error) {
    console.error("Upload profile photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;

    // Hapus file dari filesystem
    if (admin?.fotoProfil) {
      try {
        const oldPath = path.join(process.cwd(), "public", admin.fotoProfil);
        await unlink(oldPath);
      } catch {}
    }

    await adminCollection.updateOne(
      { id: payload.id },
      {
        $set: {
          updatedAt: new Date(),
        },
        $unset: {
          fotoProfil: "",
        },
      },
    );

    return NextResponse.json({
      message: "Foto profil berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete profile photo error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
