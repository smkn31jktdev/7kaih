import { NextRequest, NextResponse } from "next/server";
import { kegiatanCollection } from "@/app/lib/db";
import { Kebiasaan } from "@/app/types/kebiasaan";
import { resolveAdminStudents, HttpError } from "../helpers";
import calendarData from "@/app/server/data/calendar.json";

interface RamadhanEntry {
  tanggal: string;
  sholatTarawihWitir: boolean;
  berpuasa: boolean;
  ramadhanDay: number | null; // Hari ke-berapa di Ramadhan
}

interface RamadhanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  hijriYear: number;
  entries: RamadhanEntry[];
  summary: {
    totalTarawihWitir: number;
    totalPuasa: number;
    totalRamadhanDays: number;
    tarawihWitirRating: number;
    puasaRating: number;
    tarawihWitirNote: string;
    puasaNote: string;
  };
}

// Helper function to get Ramadhan period for a year
function getRamadhanPeriodForYear(year: number) {
  const ramadhanData = calendarData.ramadan.find(
    (r) => r.gregorian_year === year,
  );

  if (!ramadhanData) {
    return null;
  }

  return {
    hijri_year: ramadhanData.hijri_year,
    gregorian_year: ramadhanData.gregorian_year,
    start_date: new Date(ramadhanData.start_date),
    end_date: new Date(ramadhanData.end_date),
    eid_date: new Date(ramadhanData.eid_date),
  };
}

// Get Ramadhan day number for a specific date
function getRamadhanDay(dateStr: string): number | null {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const period = getRamadhanPeriodForYear(year);

  if (!period) return null;

  const normalizedCheck = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const normalizedStart = new Date(
    period.start_date.getFullYear(),
    period.start_date.getMonth(),
    period.start_date.getDate(),
  );
  const normalizedEnd = new Date(
    period.end_date.getFullYear(),
    period.end_date.getMonth(),
    period.end_date.getDate(),
  );

  if (normalizedCheck < normalizedStart || normalizedCheck > normalizedEnd) {
    return null;
  }

  const diffTime = normalizedCheck.getTime() - normalizedStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// Calculate Tarawih & Witir rating based on total rokaat
// Setiap malam = 11 rokaat (Tarawih 8 + Witir 3), 30 hari = 330 rokaat max
function calculateTarawihWitirRating(
  totalDays: number,
  totalRamadhanDays: number,
): { rating: number; note: string } {
  // Konversi jumlah hari ke rokaat (asumsi 11 rokaat per malam)
  const totalRokaat = totalDays * 11;
  const bolong = totalRamadhanDays - totalDays;

  if (totalRokaat > 330 || bolong === 0) {
    return {
      rating: 5,
      note: `Istimewa: Selalu (${totalDays} malam, ${totalRokaat} rokaat)`,
    };
  } else if (totalRokaat >= 308) {
    // Bolong 1-3 kali
    return {
      rating: 4,
      note: `Sangat baik: Sering (${totalDays} malam, ${totalRokaat} rokaat, bolong ${bolong} kali)`,
    };
  } else if (totalRokaat >= 275) {
    // Bolong 4-5 kali
    return {
      rating: 3,
      note: `Baik: Jarang (${totalDays} malam, ${totalRokaat} rokaat, bolong ${bolong} kali)`,
    };
  } else if (totalRokaat >= 231) {
    // Bolong 6-7 kali
    return {
      rating: 2,
      note: `Cukup baik: Kadang-kadang (${totalDays} malam, ${totalRokaat} rokaat, bolong ${bolong} kali)`,
    };
  } else {
    // Bolong lebih dari 7 hari
    return {
      rating: 1,
      note: `Kurang baik: Pernah (${totalDays} malam, ${totalRokaat} rokaat, bolong ${bolong} kali)`,
    };
  }
}

// Calculate Puasa rating
function calculatePuasaRating(
  totalDays: number,
  totalRamadhanDays: number,
): { rating: number; note: string } {
  const tidakPuasa = totalRamadhanDays - totalDays;

  if (tidakPuasa === 0) {
    return {
      rating: 5,
      note: `Istimewa: Selalu (${totalDays} hari penuh)`,
    };
  } else if (tidakPuasa === 0 && totalDays === totalRamadhanDays) {
    return {
      rating: 4,
      note: `Sangat baik: Sering (${totalDays} hari)`,
    };
  } else if (tidakPuasa >= 1 && tidakPuasa <= 2) {
    return {
      rating: 3,
      note: `Baik: Jarang (${totalDays} hari, tidak puasa ${tidakPuasa} hari)`,
    };
  } else if (tidakPuasa >= 3 && tidakPuasa <= 4) {
    return {
      rating: 2,
      note: `Cukup baik: Kadang-kadang (${totalDays} hari, tidak puasa ${tidakPuasa} hari)`,
    };
  } else {
    return {
      rating: 1,
      note: `Kurang baik: Pernah (${totalDays} hari, tidak puasa ${tidakPuasa} hari)`,
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { students } = await resolveAdminStudents(request);

    if (students.length === 0) {
      return NextResponse.json([]);
    }

    // Get year from query params, default to current year
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const targetYear = yearParam
      ? Number.parseInt(yearParam, 10)
      : new Date().getFullYear();

    // Get Ramadhan period for target year
    const ramadhanPeriod = getRamadhanPeriodForYear(targetYear);
    if (!ramadhanPeriod) {
      return NextResponse.json({
        error: `Tidak ada data Ramadhan untuk tahun ${targetYear}`,
        availableYears: calendarData.ramadan.map((r) => r.gregorian_year),
      });
    }

    const allowedNisns = students.map((student) => student.nisn);
    const studentMap = new Map(
      students.map((student) => [student.nisn, student]),
    );

    // Get all entries within Ramadhan period
    const documents = await kegiatanCollection
      .find({
        nisn: { $in: allowedNisns },
        tanggal: {
          $gte: ramadhanPeriod.start_date.toISOString().split("T")[0],
          $lte: ramadhanPeriod.end_date.toISOString().split("T")[0],
        },
      })
      .toArray();

    const grouped = new Map<string, RamadhanStudent>();

    documents.forEach((doc) => {
      const kebiasaan = doc as unknown as Kebiasaan;
      const studentInfo = studentMap.get(kebiasaan.nisn);
      if (!studentInfo) {
        return;
      }

      // Check if this entry has Ramadhan data
      if (!kebiasaan.ramadhan) {
        return;
      }

      if (!grouped.has(kebiasaan.nisn)) {
        grouped.set(kebiasaan.nisn, {
          nisn: kebiasaan.nisn,
          nama: studentInfo.nama || kebiasaan.nama,
          kelas: studentInfo.kelas || kebiasaan.kelas,
          hijriYear: ramadhanPeriod.hijri_year,
          entries: [],
          summary: {
            totalTarawihWitir: 0,
            totalPuasa: 0,
            totalRamadhanDays: 30,
            tarawihWitirRating: 1,
            puasaRating: 1,
            tarawihWitirNote: "",
            puasaNote: "",
          },
        });
      }

      const student = grouped.get(kebiasaan.nisn);

      if (student) {
        const ramadhanDay = getRamadhanDay(kebiasaan.tanggal);

        student.entries.push({
          tanggal: kebiasaan.tanggal,
          sholatTarawihWitir: Boolean(kebiasaan.ramadhan?.sholatTarawihWitir),
          berpuasa: Boolean(kebiasaan.ramadhan?.berpuasa),
          ramadhanDay,
        });
      }
    });

    // Calculate summaries for each student
    const data: RamadhanStudent[] = Array.from(grouped.values()).map(
      (student) => {
        const totalTarawihWitir = student.entries.filter(
          (e) => e.sholatTarawihWitir,
        ).length;
        const totalPuasa = student.entries.filter((e) => e.berpuasa).length;
        const totalRamadhanDays = 30; // Ramadhan is always 29 or 30 days

        const tarawihRating = calculateTarawihWitirRating(
          totalTarawihWitir,
          totalRamadhanDays,
        );
        const puasaRating = calculatePuasaRating(totalPuasa, totalRamadhanDays);

        return {
          ...student,
          entries: student.entries.sort((a, b) => {
            const dateA = new Date(a.tanggal).getTime();
            const dateB = new Date(b.tanggal).getTime();

            if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
              return a.tanggal.localeCompare(b.tanggal);
            }

            return dateA - dateB;
          }),
          summary: {
            totalTarawihWitir,
            totalPuasa,
            totalRamadhanDays,
            tarawihWitirRating: tarawihRating.rating,
            puasaRating: puasaRating.rating,
            tarawihWitirNote: tarawihRating.note,
            puasaNote: puasaRating.note,
          },
        };
      },
    );

    // Sort by name
    data.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));

    return NextResponse.json({
      data,
      period: {
        hijriYear: ramadhanPeriod.hijri_year,
        gregorianYear: ramadhanPeriod.gregorian_year,
        startDate: ramadhanPeriod.start_date.toISOString().split("T")[0],
        endDate: ramadhanPeriod.end_date.toISOString().split("T")[0],
      },
      availableYears: calendarData.ramadan.map((r) => ({
        hijriYear: r.hijri_year,
        gregorianYear: r.gregorian_year,
      })),
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Error fetching ramadhan data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
