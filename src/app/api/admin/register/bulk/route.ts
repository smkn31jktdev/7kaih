import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection } from "@/app/lib/db";
import { Admin } from "@/app/types/admin";
import { verifyToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    // Authorization: only the super admin can bulk-add admins
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (
      !payload ||
      payload.role !== "admin" ||
      payload.email !== "smkn31jktdev@gmail.com"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const admins = body?.admins;

    if (!Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json(
        { error: "No admins provided" },
        { status: 400 },
      );
    }

    const inserted: string[] = [];
    const skipped: { email: string; reason: string }[] = [];
    const toInsert: Admin[] = [];

    for (const a of admins) {
      const nama = a.nama?.toString?.().trim?.() || "";
      const email = a.email?.toString?.().trim?.() || "";
      const password = a.password?.toString?.().trim?.() || "";

      if (!nama || !email || !password) {
        skipped.push({ email, reason: "Field wajib tidak lengkap" });
        continue;
      }

      const existing = await adminCollection.findOne({ email });
      if (existing) {
        skipped.push({ email, reason: "Email sudah terdaftar" });
        continue;
      }

      const hashed = await bcrypt.hash(password, 10);

      const newAdmin: Admin = {
        id: crypto.randomUUID(),
        nama,
        email,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      toInsert.push(newAdmin);
      inserted.push(email);
    }

    if (toInsert.length > 0) {
      await adminCollection.insertMany(toInsert);
    }

    return NextResponse.json(
      {
        message: "Import selesai",
        insertedCount: toInsert.length,
        inserted,
        skipped,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Bulk admin import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
