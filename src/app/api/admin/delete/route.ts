import { NextRequest, NextResponse } from "next/server";
import {
  kegiatanCollection,
  adminCollection,
  studentCollection,
} from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";
import { Student } from "@/app/types/student";

type AuthResult =
  | { admin: Admin; isSuperAdmin: boolean }
  | { error: NextResponse };

const MONTH_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

function safeParseDate(raw: unknown): Date | null {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return null;
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const normalized = raw.replace(/\//g, "-");
  const fallback = new Date(normalized);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function monthKeyFromDate(date: Date): { key: string; monthStart: Date } {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const key = `${monthStart.getFullYear()}-${String(
    monthStart.getMonth() + 1
  ).padStart(2, "0")}`;
  return { key, monthStart };
}

function formatMonthLabel(date: Date): string {
  return MONTH_FORMATTER.format(date);
}

async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || payload.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    };
  }

  const adminDoc = await adminCollection.findOne({ id: payload.id });
  if (!adminDoc) {
    return {
      error: NextResponse.json({ error: "Admin not found" }, { status: 404 }),
    };
  }

  const admin = adminDoc as unknown as Admin;
  const isSuperAdmin = admin.email === "smkn31jktdev@gmail.com";
  return { admin, isSuperAdmin };
}

async function ensureStudentAccess(
  nisn: string,
  admin: Admin,
  isSuperAdmin: boolean
): Promise<Student | { error: NextResponse }> {
  const studentDoc = await studentCollection.findOne({ nisn });
  if (!studentDoc) {
    return {
      error: NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
      ),
    };
  }

  const student = studentDoc as unknown as Student;
  if (!isSuperAdmin && student.walas !== admin.nama) {
    return {
      error: NextResponse.json(
        { error: "Anda tidak memiliki akses ke siswa ini" },
        { status: 403 }
      ),
    };
  }

  return student;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if ("error" in auth) {
      return auth.error;
    }

    const url = new URL(request.url);
    const nisnParam = url.searchParams.get("nisn");

    if (!nisnParam || nisnParam.trim().length === 0) {
      return NextResponse.json(
        { error: "Parameter nisn harus diisi" },
        { status: 400 }
      );
    }

    const studentResult = await ensureStudentAccess(
      nisnParam,
      auth.admin,
      auth.isSuperAdmin
    );
    if ("error" in studentResult) {
      return studentResult.error;
    }

    const documents = await kegiatanCollection
      .find({ nisn: nisnParam })
      .toArray();

    const monthAggregates = new Map<
      string,
      { count: number; monthStart: Date }
    >();

    for (const doc of documents) {
      const tanggalRaw = (doc as Record<string, unknown>).tanggal;
      const parsedDate = safeParseDate(tanggalRaw);
      if (!parsedDate) {
        continue;
      }

      const { key, monthStart } = monthKeyFromDate(parsedDate);
      const existing = monthAggregates.get(key);
      if (!existing) {
        monthAggregates.set(key, { count: 1, monthStart });
      } else {
        existing.count += 1;
      }
    }

    const months = Array.from(monthAggregates.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({
        key,
        label: formatMonthLabel(value.monthStart),
        entryCount: value.count,
      }));

    return NextResponse.json({
      student: {
        nisn: studentResult.nisn,
        nama: studentResult.nama,
        kelas: studentResult.kelas,
      },
      months,
      totalEntries: documents.length,
    });
  } catch (error) {
    console.error("Error fetching months for deletion:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data bulan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateAdmin(request);
    if ("error" in auth) {
      return auth.error;
    }

    const body = await request.json();
    const nisn = typeof body?.nisn === "string" ? body.nisn.trim() : "";
    const month = typeof body?.month === "string" ? body.month.trim() : "";

    if (!nisn || !month) {
      return NextResponse.json(
        { error: "Parameter nisn dan month harus diisi" },
        { status: 400 }
      );
    }

    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!monthPattern.test(month)) {
      return NextResponse.json(
        { error: "Format bulan tidak valid. Gunakan YYYY-MM" },
        { status: 400 }
      );
    }

    const studentResult = await ensureStudentAccess(
      nisn,
      auth.admin,
      auth.isSuperAdmin
    );
    if ("error" in studentResult) {
      return studentResult.error;
    }

    const documents = await kegiatanCollection.find({ nisn }).toArray();

    const entriesToDelete = documents.filter((doc) => {
      const tanggalRaw = (doc as Record<string, unknown>).tanggal;
      const parsedDate = safeParseDate(tanggalRaw);
      if (!parsedDate) {
        return false;
      }
      return monthKeyFromDate(parsedDate).key === month;
    });

    if (entriesToDelete.length === 0) {
      return NextResponse.json(
        { error: "Data kegiatan tidak ditemukan untuk bulan tersebut" },
        { status: 404 }
      );
    }

    const idsToDelete = entriesToDelete
      .map((doc) => (doc as { _id?: string })._id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (idsToDelete.length === 0) {
      return NextResponse.json(
        { error: "Data yang dipilih tidak memiliki identifier yang valid" },
        { status: 500 }
      );
    }

    const deleteResult = (await kegiatanCollection.deleteMany({
      _id: { $in: idsToDelete },
    })) as { deletedCount?: number };

    const deletedCount = deleteResult.deletedCount ?? 0;

    const [yearString, monthString] = month.split("-");
    const monthDate = new Date(
      Number.parseInt(yearString ?? "0", 10),
      Number.parseInt(monthString ?? "1", 10) - 1,
      1
    );

    return NextResponse.json({
      message: `Berhasil menghapus ${deletedCount} catatan kegiatan ${
        studentResult.nama
      } untuk bulan ${formatMonthLabel(monthDate)}.`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data kegiatan" },
      { status: 500 }
    );
  }
}
