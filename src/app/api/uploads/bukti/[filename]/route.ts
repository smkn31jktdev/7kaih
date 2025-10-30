import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { verifyToken } from "@/app/utils/jwt";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const filename = params.filename;
    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "bukti",
      filename
    );

    try {
      const fileBuffer = await readFile(filePath);
      const uint8Array = new Uint8Array(fileBuffer);

      // Determine content type based on file extension
      const extension = filename.split(".").pop()?.toLowerCase();
      let contentType = "image/jpeg"; // default

      if (extension === "png") {
        contentType = "image/png";
      } else if (extension === "jpg" || extension === "jpeg") {
        contentType = "image/jpeg";
      }

      return new NextResponse(uint8Array, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        },
      });
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Image serve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
