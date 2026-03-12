import { NextRequest, NextResponse } from "next/server";
import { adminCollection } from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";

// GET: List all admins (super admin only)
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

    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin tidak ada" }, { status: 404 });
    }

    if (admin.email !== "smkn31jktdev@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await adminCollection.find({}).toArray();

    const adminList = admins.map((a) => ({
      id: a.id,
      nama: a.nama,
      email: a.email,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      count: adminList.length,
      admins: adminList,
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data admin" },
      { status: 500 },
    );
  }
}
