import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { buktiCollection } from "@/app/lib/db";
import db from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await db.createCollection("bukti").catch(() => {});

    // Ambil semua bukti, diurutkan berdasarkan createdAt descending
    const buktiList = await buktiCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(buktiList);
  } catch (error) {
    console.error("Bukti fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
