import { NextRequest } from "next/server";
import { verifyToken } from "@/app/utils/jwt";
import { adminCollection, studentCollection } from "@/app/lib/db";
import { Admin } from "@/app/types/admin";
import { Student } from "@/app/types/student";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function resolveAdminStudents(request: NextRequest): Promise<{
  admin: Admin;
  students: Student[];
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    throw new HttpError(401, "Invalid token");
  }

  const admin = (await adminCollection.findOne({
    id: payload.id,
  })) as Admin | null;

  if (!admin) {
    throw new HttpError(404, "Admin tidak ditemukan");
  }

  const query =
    admin.email === "smkn31jktdev@gmail.com" ? {} : { walas: admin.nama };

  const students = (await studentCollection
    .find(query)
    .toArray()) as unknown as Student[];

  return { admin, students };
}
