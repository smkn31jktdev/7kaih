import { NextRequest, NextResponse } from "next/server";
import { kegiatanCollection } from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";
import { resolveAdminStudents, HttpError } from "../helpers";

interface MakanEntry {
  tanggal: string;
  jenisMakanan: string;
  jenisLaukSayur: string;
  makanSayurAtauBuah: boolean;
  minumSuplemen: boolean;
}

interface MakanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: MakanEntry[];
}

export async function GET(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    if (students.length === 0) {
      return NextResponse.json([]);
    }

    const allowedNisns = students.map((student) => student.nisn);
    const studentMap = new Map(
      students.map((student) => [student.nisn, student])
    );

    const documents = await kegiatanCollection
      .find({ nisn: { $in: allowedNisns } })
      .toArray();

    const grouped = new Map<string, MakanStudent>();

    documents.forEach((doc) => {
      const kebiasaan = doc as unknown as Kebiasaan;
      const studentInfo = studentMap.get(kebiasaan.nisn);
      if (!studentInfo) {
        return;
      }

      if (!grouped.has(kebiasaan.nisn)) {
        grouped.set(kebiasaan.nisn, {
          nisn: kebiasaan.nisn,
          nama: studentInfo.nama || kebiasaan.nama,
          kelas: studentInfo.kelas || kebiasaan.kelas,
          entries: [],
        });
      }

      const student = grouped.get(kebiasaan.nisn);

      if (student && kebiasaan.makanSehat) {
        student.entries.push({
          tanggal: kebiasaan.tanggal,
          jenisMakanan: kebiasaan.makanSehat.jenisMakanan || "",
          jenisLaukSayur: kebiasaan.makanSehat.jenisLaukSayur || "",
          makanSayurAtauBuah: kebiasaan.makanSehat.makanSayurAtauBuah || false,
          minumSuplemen: kebiasaan.makanSehat.minumSuplemen || false,
        });
      }
    });

    const data: MakanStudent[] = Array.from(grouped.values()).map(
      (student) => ({
        ...student,
        entries: student.entries.sort((a, b) => {
          const dateA = new Date(a.tanggal).getTime();
          const dateB = new Date(b.tanggal).getTime();

          if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
            return a.tanggal.localeCompare(b.tanggal);
          }

          return dateA - dateB;
        }),
      })
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Error fetching makan data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
