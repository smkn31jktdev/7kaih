import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { buktiCollection, studentCollection } from "@/app/lib/db";
import db from "@/app/lib/db";
import { Bukti } from "@/app/types/bukti";
import { v4 as uuidv4 } from "uuid";

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

    const formData = await request.formData();
    const fotoFile = formData.get("foto") as File;
    const linkYouTube = formData.get("linkYouTube") as string;

    // Validasi data
    if (!fotoFile || !linkYouTube) {
      return NextResponse.json(
        { error: "Foto dan link YouTube harus diisi" },
        { status: 400 }
      );
    }

    // Validasi file type
    if (
      !fotoFile.type.startsWith("image/") ||
      (fotoFile.type !== "image/png" && fotoFile.type !== "image/jpeg")
    ) {
      return NextResponse.json(
        { error: "File harus berupa gambar PNG atau JPG" },
        { status: 400 }
      );
    }

    // Validasi file size (5MB)
    if (fotoFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    // Validasi URL YouTube
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[a-zA-Z0-9_-]{11}/;
    if (!youtubeRegex.test(linkYouTube)) {
      return NextResponse.json(
        { error: "Link YouTube tidak valid" },
        { status: 400 }
      );
    }

    await db.createCollection("bukti").catch(() => {});

    // Dapatkan bulan saat ini
    const now = new Date();
    const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    // Cek apakah sudah ada bukti untuk bulan ini
    const existingBukti = await buktiCollection.findOne({
      nisn: payload.nisn,
      bulan: bulan,
    });

    if (existingBukti) {
      return NextResponse.json(
        { error: "Bukti untuk bulan ini sudah dikumpulkan" },
        { status: 400 }
      );
    }

    // Convert file to Base64 untuk disimpan di database
    const bytes = await fotoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString("base64");
    const imageMimeType = fotoFile.type;
    const imageId = uuidv4();

    // Generate URL path (untuk kompatibilitas)
    const fileExtension = fotoFile.name.split(".").pop();
    const fileName = `bukti_${payload.nisn}_${Date.now()}.${fileExtension}`;
    const fotoUrl = `/uploads/bukti/${fileName}`;

    const buktiData: Bukti = {
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      bulan: bulan,
      foto: fotoUrl, // Legacy path untuk kompatibilitas
      linkYouTube: linkYouTube,
      // Field baru untuk deployment
      imageId: imageId,
      imageData: base64Data, // Simpan Base64 data di database
      imageMimeType: imageMimeType,
      imageUrl: `data:${imageMimeType};base64,${base64Data}`, // Data URL untuk langsung ditampilkan
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert data baru
    await buktiCollection.insertOne(buktiData);

    return NextResponse.json({
      message: "Bukti berhasil disimpan",
    });
  } catch (error) {
    console.error("Bukti save error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Ambil data bukti berdasarkan bulan
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
    const bulan = searchParams.get("bulan");

    if (!bulan) {
      return NextResponse.json({ error: "Bulan harus diisi" }, { status: 400 });
    }

    await db.createCollection("bukti").catch(() => {});

    const bukti = await buktiCollection.findOne({
      nisn: payload.nisn,
      bulan,
    });

    return NextResponse.json({ bukti });
  } catch (error) {
    console.error("Bukti fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
