import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { adminCollection } from "@/app/lib/db";
import { Admin } from "@/app/types/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find admin by email
    const admin = (await adminCollection.findOne({ email })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        username: admin.nama,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Get admin settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, newEmail, currentPassword, newPassword } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find admin by email
    const admin = (await adminCollection.findOne({ email })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        admin.password
      );
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateData: Partial<Admin> = {
      updatedAt: new Date(),
    };

    if (name) {
      updateData.nama = name;
    }

    if (newEmail && newEmail !== email) {
      // Check if new email is already taken
      const existingAdmin = await adminCollection.findOne({ email: newEmail });
      if (existingAdmin) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }
      updateData.email = newEmail;
    }

    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update admin
    await adminCollection.updateOne({ email }, { $set: updateData });

    return NextResponse.json({
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Update admin settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
