import { NextResponse } from "next/server";
import { kegiatanCollection } from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";

interface BelajarEntry {
  tanggal: string;
  yaAtauTidak: boolean;
  deskripsi: string;
}

interface BelajarStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BelajarEntry[];
}

export async function GET() {
  try {
    const documents = await kegiatanCollection.find({}).toArray();

    const grouped = new Map<string, BelajarStudent>();

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

      if (student && kebiasaan.belajar) {
        student.entries.push({
          tanggal: kebiasaan.tanggal,
          yaAtauTidak: kebiasaan.belajar.yaAtauTidak,
          deskripsi: kebiasaan.belajar.deskripsi || "",
        });
      }
    });

    const data: BelajarStudent[] = Array.from(grouped.values()).map(
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
    console.error("Error fetching belajar data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
