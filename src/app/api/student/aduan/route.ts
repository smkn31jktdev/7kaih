import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { studentCollection } from "@/app/lib/db";
import clientPromise from "@/app/lib/mongodb";
import { Student } from "@/app/types/student";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = (await studentCollection.findOne({
      nisn: payload.nisn,
    })) as Student | null;
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const body = await request.json();
    const { message, ticketId } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("smkn31jkt");
    const collection = db.collection("aduan_siswa");

    const now = new Date().toISOString();

    if (ticketId) {
      // Add message to existing aduan
      const existing = await collection.findOne({
        ticketId,
        nisn: student.nisn,
      });
      if (!existing) {
        return NextResponse.json(
          { error: "Aduan tidak ditemukan" },
          { status: 404 },
        );
      }

      const newMessage = {
        id: randomUUID(),
        from: student.nama,
        role: "student" as const,
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
    } else {
      // Create new aduan with sequential ticket ID
      const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const todayCount = await collection.countDocuments({
        ticketId: { $regex: `^ADU-${today}` },
      });
      const newTicketId = `ADU-${today}-${String(todayCount + 1).padStart(3, "0")}`;

      const aduan = {
        ticketId: newTicketId,
        nisn: student.nisn,
        namaSiswa: student.nama,
        kelas: student.kelas,
        walas: student.walas,
        messages: [
          {
            id: randomUUID(),
            from: student.nama,
            role: "student" as const,
            message: message.trim(),
            timestamp: now,
          },
        ],
        status: "pending",
        statusHistory: [
          {
            status: "pending",
            updatedBy: student.nama,
            role: "student",
            updatedAt: now,
          },
        ],
        diteruskanKe: null,
        createdAt: now,
        updatedAt: now,
      };

      await collection.insertOne(aduan);
      return NextResponse.json({ success: true, aduan }, { status: 201 });
    }
  } catch (error) {
    console.error("Student aduan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (!payload || payload.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("smkn31jkt");
    const collection = db.collection("aduan_siswa");

    const aduan = await collection
      .find({ nisn: payload.nisn })
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({ aduan });
  } catch (error) {
    console.error("Get aduan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
