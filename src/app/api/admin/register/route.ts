import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection } from "@/app/lib/db";
import { Admin, AdminRegisterInput } from "@/app/types/admin";
import { verifyToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    // Authorization: only a specific admin can add other admins
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
    const body: AdminRegisterInput = await request.json();
    const { nama, email, password } = body;

    // Check if admin already exists
    const existingAdmin = await adminCollection.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin document
    const newAdmin: Admin = {
      id: crypto.randomUUID(),
      nama,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert into collection
    await adminCollection.insertOne(newAdmin);

    return NextResponse.json(
      { message: "Admin berhasil didaftarkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
