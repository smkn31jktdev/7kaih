import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection } from "@/app/lib/db";
import { AdminLoginInput, Admin } from "@/app/types/admin";
import { generateToken } from "@/app/utils/jwt";

export async function POST(request: NextRequest) {
  try {
    const body: AdminLoginInput = await request.json();
    const { email, password } = body;

    // Find admin by email
    const admin = (await adminCollection.findOne({ email })) as Admin | null;
    if (!admin) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: "admin",
    });

    return NextResponse.json({
      token,
      admin: { id: admin.id, nama: admin.nama, email: admin.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
