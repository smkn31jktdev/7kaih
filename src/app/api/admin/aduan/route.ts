import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { adminCollection, studentCollection } from "@/app/lib/db";
import clientPromise from "@/app/lib/mongodb";
import { Admin } from "@/app/types/admin";

const SUPER_ADMIN_EMAIL = "smkn31jktdev@gmail.com";

function getAdminRole(
  admin: Admin,
  aduanWalas?: string,
): "super_admin" | "guru_wali" | "guru_bk" {
  if (admin.email === SUPER_ADMIN_EMAIL) return "super_admin";
  if (aduanWalas && admin.nama?.toLowerCase() === aduanWalas?.toLowerCase())
    return "guru_wali";
  return "guru_bk";
}

export async function GET(request: NextRequest) {
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

    const client = await clientPromise;
    const db = client.db("smkn31jkt");
    const collection = db.collection("aduan_siswa");

    let query: Record<string, unknown> = {};
    let isGuruWali = false;

    if (admin.email === SUPER_ADMIN_EMAIL) {
      // Super admin hanya melihat aduan yang sudah diteruskan oleh guru wali ke super admin
      query = { diteruskanKe: "super_admin" };
    } else {
      // Check if this admin is a wali kelas (has students assigned)
      const matchingStudent = await studentCollection.findOne({
        walas: admin.nama,
      });
      isGuruWali = !!matchingStudent;

      if (isGuruWali) {
        // Guru wali melihat aduan siswa bimbingannya (MongoDB supports $regex)
        query = {
          walas: {
            $regex: `^${admin.nama.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            $options: "i",
          },
        };
      } else {
        // Guru BK melihat aduan yang sudah diteruskan ke BK
        query = { diteruskanKe: "guru_bk" };
      }
    }

    const aduan = await collection
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      aduan,
      adminNama: admin.nama,
      isSuperAdmin: admin.email === SUPER_ADMIN_EMAIL,
      isGuruWali,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Admin get aduan error:", errMsg);
    return NextResponse.json(
      { error: "Gagal memuat aduan", detail: errMsg },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const { ticketId, action, note } = body;

    if (!ticketId || !action) {
      return NextResponse.json(
        { error: "ticketId dan action wajib diisi" },
        { status: 400 },
      );
    }

    const validActions = [
      "teruskan_bk",
      "teruskan_superadmin",
      "tindaklanjuti",
      "selesai",
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Action tidak valid" },
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
    const adminRole = getAdminRole(admin, aduan.walas);

    const updateFields: Record<string, unknown> = { updatedAt: now };
    let newStatus: string;
    let statusNote: string;

    switch (action) {
      case "teruskan_bk":
        newStatus = "diteruskan";
        updateFields.status = newStatus;
        updateFields.diteruskanKe = "guru_bk";
        statusNote = note || "Diteruskan ke Guru BK";
        break;
      case "teruskan_superadmin":
        newStatus = "diteruskan";
        updateFields.status = newStatus;
        updateFields.diteruskanKe = "super_admin";
        statusNote = note || "Diteruskan ke Super Admin";
        break;
      case "tindaklanjuti":
        newStatus = "ditindaklanjuti";
        updateFields.status = newStatus;
        statusNote = note || "Laporan sedang ditindaklanjuti";
        break;
      case "selesai":
        newStatus = "selesai";
        updateFields.status = newStatus;
        statusNote = note || "Laporan selesai ditangani";
        break;
      default:
        return NextResponse.json(
          { error: "Action tidak valid" },
          { status: 400 },
        );
    }

    const statusEntry = {
      status: newStatus,
      updatedBy: admin.nama,
      role: adminRole,
      updatedAt: now,
      note: statusNote,
    };

    await collection.updateOne(
      { ticketId },
      {
        $set: updateFields,
        $push: { statusHistory: statusEntry as never },
      },
    );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Admin update aduan error:", errMsg);
    return NextResponse.json(
      { error: "Gagal update aduan", detail: errMsg },
      { status: 500 },
    );
  }
}
