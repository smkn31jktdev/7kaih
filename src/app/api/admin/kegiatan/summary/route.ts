import { NextRequest, NextResponse } from "next/server";
import {
  kegiatanCollection,
  adminCollection,
  studentCollection,
} from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";
import { Kebiasaan } from "@/app/types/kebiasaan";
import {
  formatMonthLabel,
  IndicatorSummary,
  monthKeyFromDate,
  safeParseDate,
  toIndicatorSummaries,
  evaluateIndicators,
} from "./evaluators";

interface StudentSummary {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  monthLabel: string;
  monthKey: string;
  indicators: IndicatorSummary[];
}

interface StudentAggregate {
  student: StudentSummary;
  entries: Kebiasaan[];
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const rawMonth = url.searchParams.get("month");
    let selectedMonth: string | null = null;
    if (rawMonth && rawMonth.trim().length > 0) {
      const normalized = rawMonth.trim();
      const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
      if (!monthRegex.test(normalized)) {
        return NextResponse.json(
          { error: "Format bulan tidak valid. Gunakan YYYY-MM." },
          { status: 400 },
        );
      }
      selectedMonth = normalized;
    }

    // Fetch admin from DB using id from token
    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Get allowed students based on admin permissions
    const allStudents = await studentCollection.find({}).toArray();
    const allowedStudents =
      admin.email === "smkn31jktdev@gmail.com"
        ? allStudents
        : allStudents.filter(
            (s: Record<string, unknown>) =>
              (s.walas as string)?.toLowerCase() === admin.nama?.toLowerCase(),
          );
    const allowedNisns = allowedStudents.map(
      (s: Record<string, unknown>) => s.nisn as string,
    );
    const studentMap = new Map(
      allowedStudents.map((s: Record<string, unknown>) => [
        s.nisn as string,
        s,
      ]),
    );

    // Batch $in queries to avoid Astra DB's 100-value limit
    const BATCH_SIZE = 100;
    const documents: Record<string, unknown>[] = [];
    for (let i = 0; i < allowedNisns.length; i += BATCH_SIZE) {
      const batch = allowedNisns.slice(i, i + BATCH_SIZE);
      const batchDocs = await kegiatanCollection
        .find({ nisn: { $in: batch } })
        .toArray();
      documents.push(...batchDocs);
    }

    const aggregates = new Map<string, StudentAggregate>();
    const latestMonthByStudent = new Map<string, string>();
    const monthSet = new Map<string, string>();

    documents.forEach((doc) => {
      const kebiasaan = doc as unknown as Kebiasaan;

      const parsedDate = safeParseDate(kebiasaan.tanggal);
      if (!parsedDate) {
        return;
      }

      const { key: monthKey, monthStart } = monthKeyFromDate(parsedDate);
      const monthLabel = formatMonthLabel(monthStart);
      monthSet.set(monthKey, monthLabel);

      const studentData = studentMap.get(kebiasaan.nisn);
      if (!studentData) {
        return;
      }

      const aggregateKey = `${kebiasaan.nisn}-${monthKey}`;
      const existing = aggregates.get(aggregateKey);

      if (!existing) {
        aggregates.set(aggregateKey, {
          student: {
            nisn: kebiasaan.nisn,
            nama: (studentData.nama as string) || "",
            kelas: (studentData.kelas as string) || "",
            walas: (studentData.walas as string) || "",
            monthLabel,
            monthKey,
            indicators: [],
          },
          entries: [kebiasaan],
        });
      } else {
        existing.entries.push(kebiasaan);
      }

      const currentLatest = latestMonthByStudent.get(kebiasaan.nisn);
      if (!currentLatest || monthKey > currentLatest) {
        latestMonthByStudent.set(kebiasaan.nisn, monthKey);
      }
    });

    const aggregateValues = Array.from(aggregates.values());
    const totalRecords = aggregateValues.length;

    const relevantAggregates = selectedMonth
      ? aggregateValues.filter(
          (item) => item.student.monthKey === selectedMonth,
        )
      : aggregateValues.filter(
          (item) =>
            item.student.monthKey ===
            latestMonthByStudent.get(item.student.nisn),
        );

    const result: StudentSummary[] = relevantAggregates.map(
      ({ student, entries }) => {
        const bundle = evaluateIndicators(entries);
        const indicators = toIndicatorSummaries(bundle);
        return {
          ...student,
          indicators,
        };
      },
    );

    result.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));

    if (selectedMonth && !monthSet.has(selectedMonth)) {
      const [yearString, monthString] = selectedMonth.split("-");
      const year = Number.parseInt(yearString ?? "", 10);
      const month = Number.parseInt(monthString ?? "", 10);
      if (
        !Number.isNaN(year) &&
        !Number.isNaN(month) &&
        month >= 1 &&
        month <= 12
      ) {
        const inferredDate = new Date(year, month - 1, 1);
        monthSet.set(selectedMonth, formatMonthLabel(inferredDate));
      }
    }

    const sortedMonths = Array.from(monthSet.entries()).sort((a, b) =>
      b[0].localeCompare(a[0]),
    );

    const responsePayload = {
      summaries: result,
      availableMonths: sortedMonths.map(([key, label]) => ({
        key,
        label,
      })),
      selectedMonth: selectedMonth ?? sortedMonths[0]?.[0] ?? null,
      totalRecords,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
