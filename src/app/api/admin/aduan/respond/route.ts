import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { adminCollection } from "@/app/lib/db";
import clientPromise from "@/app/lib/mongodb";
import { Admin } from "@/app/types/admin";
import { randomUUID } from "crypto";

const SUPER_ADMIN_EMAIL = "smkn31jktdev@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
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

    const body = await request.json();
    const { ticketId, message } = body;

    if (!ticketId || !message?.trim()) {
      return NextResponse.json(
        { error: "ticketId dan message wajib diisi" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("smkn31jkt");
    const collection = db.collection("aduan_siswa");

    const aduan = await collection.findOne({ ticketId });
    if (!aduan) {
      return NextResponse.json(
        { error: "Aduan tidak ditemukan" },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();
    const adminRole =
      admin.email === SUPER_ADMIN_EMAIL
        ? "super_admin"
        : admin.nama === aduan.walas
          ? "guru_wali"
          : "guru_bk";

    const newMessage = {
      id: randomUUID(),
      from: admin.nama,
      role: adminRole,
      message: message.trim(),
      timestamp: now,
    };

    await collection.updateOne(
      { ticketId },
      {
        $push: { messages: newMessage as never },
        $set: { updatedAt: now },
      },
    );

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Admin respond error:", errMsg);
    return NextResponse.json(
      { error: "Gagal merespons aduan", detail: errMsg },
      { status: 500 },
    );
  }
}
