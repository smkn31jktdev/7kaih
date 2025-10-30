import { NextResponse } from "next/server";
import { kegiatanCollection } from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";

interface OlahragaEntry {
  tanggal: string;
  jenisOlahraga: string;
  deskripsi: string;
  waktu: string;
}

interface OlahragaStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: OlahragaEntry[];
}

export async function GET() {
  try {
    const documents = await kegiatanCollection.find({}).toArray();

    const grouped = new Map<string, OlahragaStudent>();

    documents.forEach((doc) => {
      const kebiasaan = doc as unknown as Kebiasaan;

      if (!grouped.has(kebiasaan.nisn)) {
        grouped.set(kebiasaan.nisn, {
          nisn: kebiasaan.nisn,
          nama: kebiasaan.nama,
          kelas: kebiasaan.kelas,
          entries: [],
        });
      }

      const student = grouped.get(kebiasaan.nisn);

      if (student && kebiasaan.olahraga) {
        student.entries.push({
          tanggal: kebiasaan.tanggal,
          jenisOlahraga: kebiasaan.olahraga.jenisOlahraga || "",
          deskripsi: kebiasaan.olahraga.deskripsi || "",
          waktu: kebiasaan.olahraga.waktu || "",
        });
      }
    });

    const data: OlahragaStudent[] = Array.from(grouped.values()).map(
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
    console.error("Error fetching olahraga data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
