import { NextResponse } from "next/server";
import { kegiatanCollection } from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";

interface BeribadahEntry {
  tanggal: string;
  berdoaUntukDiriDanOrtu: boolean;
  sholatFajar: boolean;
  sholatLimaWaktuBerjamaah: boolean;
  zikirSesudahSholat: boolean;
  sholatDhuha: boolean;
  sholatSunahRawatib: boolean;
  zakatInfaqSedekah: string;
}

interface BeribadahStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BeribadahEntry[];
}

export async function GET() {
  try {
    const documents = await kegiatanCollection.find({}).toArray();

    const grouped = new Map<string, BeribadahStudent>();

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

      if (student) {
        student.entries.push({
          tanggal: kebiasaan.tanggal,
          berdoaUntukDiriDanOrtu: Boolean(
            kebiasaan.beribadah?.berdoaUntukDiriDanOrtu
          ),
          sholatFajar: Boolean(kebiasaan.beribadah?.sholatFajar),
          sholatLimaWaktuBerjamaah: Boolean(
            kebiasaan.beribadah?.sholatLimaWaktuBerjamaah
          ),
          zikirSesudahSholat: Boolean(kebiasaan.beribadah?.zikirSesudahSholat),
          sholatDhuha: Boolean(kebiasaan.beribadah?.sholatDhuha),
          sholatSunahRawatib: Boolean(kebiasaan.beribadah?.sholatSunahRawatib),
          zakatInfaqSedekah: kebiasaan.beribadah?.zakatInfaqSedekah
            ? String(kebiasaan.beribadah.zakatInfaqSedekah)
            : "",
        });
      }
    });

    const data: BeribadahStudent[] = Array.from(grouped.values()).map(
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
    console.error("Error fetching beribadah data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
