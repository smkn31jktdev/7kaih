import { NextRequest, NextResponse } from "next/server";
import { studentCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    // Update isOnline status to false
    await studentCollection.updateOne(
      { id: decoded.id },
      { $set: { isOnline: false, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: "Logout berhasil" });
  } catch (error) {
    console.error("Student logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
