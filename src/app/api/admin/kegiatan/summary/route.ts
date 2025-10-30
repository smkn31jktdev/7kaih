import { NextRequest, NextResponse } from "next/server";
import {
  kegiatanCollection,
  adminCollection,
  studentCollection,
} from "@/app/lib/db";
import { verifyToken } from "@/app/utils/jwt";
import { Admin } from "@/app/types/admin";
import { Kebiasaan } from "@/app/types/kebiasaan";

interface IndicatorSummary {
  id: string;
  label: string;
  rating: number;
  note: string;
}

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

type RatioThreshold = {
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
};

const DEFAULT_RATIO_THRESHOLD: RatioThreshold = {
  rating5: 0.9,
  rating4: 0.75,
  rating3: 0.5,
  rating2: 0.25,
};

const INDICATOR_DEFINITIONS: Array<{
  id: IndicatorSummary["id"];
  label: IndicatorSummary["label"];
}> = [
  {
    id: "bangunPagi",
    label: "Bangun Pagi : Siswa biasa bangun pagi sebelum jam 04.30",
  },
  {
    id: "beribadah",
    label: "Beribadah : Siswa biasa beribadah",
  },
  {
    id: "olahraga",
    label: "Berolah raga : Siswa melakukan kebiasaan berolahraga",
  },
  {
    id: "makanSehat",
    label: "Makan sehat bergizi : Siswa memiliki kebiasaan makan sehat bergizi",
  },
  {
    id: "belajar",
    label: "Gemar belajar : Siswa memiliki kebiasaan belajar",
  },
  {
    id: "bermasyarakat",
    label: "Baik di masyarakat : Siswa memiliki perilaku di masyarakat",
  },
  {
    id: "tidur",
    label: "Tidur lebih cepat : Siswa biasa tidur / istirahat malam jam 22.00",
  },
];

function safeParseDate(raw: string): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const normalized = raw.replace(/\//g, "-");
    const fallback = new Date(normalized);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return parsed;
}

function monthKeyFromDate(date: Date): { key: string; monthStart: Date } {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const key = `${monthStart.getFullYear()}-${String(
    monthStart.getMonth() + 1
  ).padStart(2, "0")}`;
  return { key, monthStart };
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function ratioToRating(
  ratio: number,
  thresholds: RatioThreshold = DEFAULT_RATIO_THRESHOLD
): number {
  if (ratio >= thresholds.rating5) return 5;
  if (ratio >= thresholds.rating4) return 4;
  if (ratio >= thresholds.rating3) return 3;
  if (ratio >= thresholds.rating2) return 2;
  return 1;
}

function evaluateBangun(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.bangunPagi);
  const totalDays = relevant.length;

  let countBefore0430AndDoa = 0;
  let countBefore0500AndDoa = 0;
  let countAt0500AndDoa = 0;
  let countBefore0530NoDoa = 0;

  relevant.forEach((entry) => {
    const jam = entry.bangunPagi?.jam?.trim();
    if (!jam) return;
    const time = parseTimeToMinutes(jam);
    if (time === null) return;
    const doa = entry.bangunPagi?.membacaDanBangunTidur || false;

    if (time < 4.5 * 60 && doa) {
      // sebelum 04:30
      countBefore0430AndDoa++;
    }
    if (time < 5 * 60 && doa) {
      // sebelum 05:00
      countBefore0500AndDoa++;
    }
    if (time === 5 * 60 && doa) {
      // tepat 05:00
      countAt0500AndDoa++;
    }
    if (time < 5.5 * 60 && !doa) {
      // sebelum 05:30 tanpa doa
      countBefore0530NoDoa++;
    }
  });

  let rating = 1;
  let note = "Belum memenuhi kriteria.";
  if (countBefore0430AndDoa > 24) {
    rating = 5;
    note = "Istimewa: Lebih dari 24 kali bangun sebelum 04.30 dan berdoa.";
  } else if (countBefore0500AndDoa >= 15 && countBefore0500AndDoa <= 24) {
    rating = 4;
    note = `Sangat baik: ${countBefore0500AndDoa} kali bangun sebelum 05.00 dan berdoa.`;
  } else if (countAt0500AndDoa >= 9 && countAt0500AndDoa <= 14) {
    rating = 3;
    note = `Baik: ${countAt0500AndDoa} kali bangun 05.00 dan berdoa.`;
  } else if (countAt0500AndDoa >= 4 && countAt0500AndDoa <= 8) {
    rating = 2;
    note = `Cukup baik: ${countAt0500AndDoa} kali bangun 05.00 dan berdoa.`;
  } else {
    rating = 1;
    if (countBefore0530NoDoa >= 4) {
      // Banyak bangun pagi tapi tidak berdoa
      note = `Kurang baik: ${countBefore0530NoDoa} kali bangun sebelum 05.30 tanpa berdoa.`;
    } else {
      // Sedikit/nyaris tidak ada bangun pagi sebelum 05.30 yang juga tidak berdoa
      note = `Kurang baik: Kurang dari 4 kali bangun sebelum 05.30 dan tidak berdoa.`;
    }
  }

  if (totalDays === 0) {
    // Jika sama sekali tidak ada data bangun pagi
    rating = 1;
    note = "Belum ada data bangun pagi.";
  }

  return {
    id: "bangunPagi",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "bangunPagi")!
      .label,
    rating,
    note,
  };
}

function evaluateBeribadah(entries: Kebiasaan[]): IndicatorSummary {
  const WAJIB_KEYS = ["sholatFajar", "sholatLimaWaktuBerjamaah"];
  const SUNNAH_KEYS = [
    "sholatDhuha",
    "sholatSunahRawatib",
    "zikirSesudahSholat",
  ];
  const DOA_KEY = "berdoaUntukDiriDanOrtu";
  const SEDEKAH_KEY = "zakatInfaqSedekah";

  let totalScore = 0;
  let totalDays = 0;

  entries.forEach((entry) => {
    if (!entry.beribadah) return;
    totalDays += 1;

    let dailyScore = 0;

    // Wajib: 1 poin jika semua wajib dilakukan
    const wajibCompleted = WAJIB_KEYS.every(
      (key) => entry.beribadah[key as keyof Kebiasaan["beribadah"]]
    );
    if (wajibCompleted) dailyScore += 1;

    // Sunnah: rasio penyelesaian
    const sunnahCompleted = SUNNAH_KEYS.filter(
      (key) => entry.beribadah[key as keyof Kebiasaan["beribadah"]]
    ).length;
    dailyScore += sunnahCompleted / SUNNAH_KEYS.length;

    // Doa: 1 poin jika dilakukan
    if (entry.beribadah[DOA_KEY as keyof Kebiasaan["beribadah"]])
      dailyScore += 1;

    // Sedekah: 1 poin jika ada
    const sedekah =
      entry.beribadah[SEDEKAH_KEY as keyof Kebiasaan["beribadah"]];
    if (sedekah && String(sedekah).trim()) dailyScore += 1;

    totalScore += dailyScore;
  });

  const averageScore = totalDays ? totalScore / totalDays : 0;

  let rating = 1;
  let note = "Belum ada data ibadah.";
  if (totalDays > 0) {
    if (averageScore >= 3.5) {
      rating = 5;
      note = "Selalu melaksanakan ibadah wajib dan sunnah secara konsisten.";
    } else if (averageScore >= 2.5) {
      rating = 4;
      note = "Sering melaksanakan ibadah wajib dan sebagian ibadah sunnah.";
    } else if (averageScore >= 1.5) {
      rating = 3;
      note =
        "Melaksanakan ibadah wajib dengan cukup rutin, namun ibadah sunnah masih belum konsisten.";
    } else if (averageScore >= 0.5) {
      rating = 2;
      note =
        "Melaksanakan sebagian ibadah wajib dan sunnah, namun frekuensinya tidak teratur dan masih perlu ditingkatkan.";
    } else {
      rating = 1;
      note = "Jarang melaksanakan ibadah wajib maupun sunnah.";
    }
  }

  return {
    id: "beribadah",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "beribadah")!.label,
    rating,
    note,
  };
}

function evaluateOlahraga(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.olahraga);
  const totalDays = relevant.length;
  let consistentDays = 0;

  relevant.forEach((entry) => {
    const raw = entry.olahraga?.waktu ?? "0";
    const minutes = Number.parseInt(String(raw), 10);
    if (!Number.isNaN(minutes)) {
      if (minutes >= 30) {
        consistentDays += 1;
      }
    }
  });

  const ratio = totalDays ? consistentDays / totalDays : 0;
  const rating = totalDays
    ? ratioToRating(ratio, {
        rating5: 0.9,
        rating4: 0.7,
        rating3: 0.5,
        rating2: 0.3,
      })
    : 1;

  let note = "Belum ada data olahraga.";
  if (totalDays > 0) {
    const category =
      rating === 5
        ? "Istimewa: Selalu"
        : rating === 4
        ? "Sangat baik: Sering"
        : rating === 3
        ? "Baik: Jarang"
        : rating === 2
        ? "Cukup baik: Kadang-kadang"
        : "Kurang baik: Pernah";
    note = `${category} (Dalam ${consistentDays} hari berolahraga).`;
  }

  return {
    id: "olahraga",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "olahraga")!.label,
    rating,
    note,
  };
}

function evaluateMakan(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.makanSehat);
  const totalDays = relevant.length;
  let healthyDays = 0;

  relevant.forEach((entry) => {
    const data = entry.makanSehat;
    if (!data) return;
    const hasBalancedMeal = Boolean(
      data.jenisMakanan?.trim() || data.jenisLaukSayur?.trim()
    );
    if (hasBalancedMeal || data.minumSuplemen) {
      healthyDays += 1;
    }
  });

  const ratio = totalDays ? healthyDays / totalDays : 0;
  const rating = totalDays ? ratioToRating(ratio) : 1;
  const note = totalDays
    ? `Siswa mengonsumsi makanan sehat dan bergizi.`
    : "Belum ada data makan sehat.";

  return {
    id: "makanSehat",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "makanSehat")!
      .label,
    rating,
    note,
  };
}

function evaluateBelajar(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.belajar);
  const totalDays = relevant.length;
  const completed = relevant.filter(
    (entry) => entry.belajar?.yaAtauTidak
  ).length;

  const ratio = totalDays ? completed / totalDays : 0;
  const rating = totalDays ? ratioToRating(ratio) : 1;
  const note = totalDays
    ? `Siswa gemar belajar mandiri.`
    : "Belum ada data belajar.";

  return {
    id: "belajar",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "belajar")!.label,
    rating,
    note,
  };
}

function evaluateMasyarakat(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.bermasyarakat);
  const totalDays = relevant.length;
  const participated = relevant.filter(
    (entry) => entry.bermasyarakat?.paraf
  ).length;

  let rating = 1;
  let note = "Belum ada data kegiatan masyarakat.";
  if (totalDays > 0) {
    if (participated > 5) {
      rating = 5;
      note = `Istimewa: Selalu (sebulan: melakukan ${participated} kegiatan).`;
    } else if (participated > 4) {
      rating = 4;
      note = `Sangat baik: Sering (sebulan: melakukan ${participated} kegiatan).`;
    } else if (participated > 3) {
      rating = 3;
      note = `Baik: Jarang (sebulan: melakukan ${participated} kegiatan).`;
    } else if (participated > 2) {
      rating = 2;
      note = `Cukup baik: Kadang-kadang (sebulan: melakukan ${participated} kegiatan).`;
    } else {
      rating = 1;
      note = `Kurang baik: Pernah (sebulan: melakukan ${participated} kegiatan).`;
    }
  }

  return {
    id: "bermasyarakat",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "bermasyarakat")!
      .label,
    rating,
    note,
  };
}

function parseTimeToMinutes(value: string | undefined | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/\./g, ":").trim();
  const [hourPart, minutePart] = normalized.split(":");
  const hours = Number.parseInt(hourPart ?? "", 10);
  const minutes = Number.parseInt(minutePart ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function evaluateTidur(entries: Kebiasaan[]): IndicatorSummary {
  const relevant = entries.filter((entry) => entry.tidur);
  const totalDays = relevant.length;

  let countBefore2200AndDoa = 0;

  relevant.forEach((entry) => {
    const jam = entry.tidur?.jam?.trim();
    if (!jam) return;
    const time = parseTimeToMinutes(jam);
    if (time === null) return;
    const doa = entry.tidur?.membacaDanMasTidur || false;

    if (time <= 22 * 60 && doa) {
      // tidur sebelum atau tepat 22:00 dan berdoa
      countBefore2200AndDoa++;
    }
  });

  let rating = 1;
  let note = "Belum memenuhi kriteria.";
  if (countBefore2200AndDoa > 24) {
    rating = 5;
    note = "Istimewa: Lebih dari 24 kali tidur sebelum jam 22.00 dan berdoa.";
  } else if (countBefore2200AndDoa >= 15 && countBefore2200AndDoa <= 24) {
    rating = 4;
    note = `Sangat baik: ${countBefore2200AndDoa} kali tidur sebelum jam 22.00 dan berdoa.`;
  } else if (countBefore2200AndDoa >= 9 && countBefore2200AndDoa <= 14) {
    rating = 3;
    note = `Baik: ${countBefore2200AndDoa} kali tidur sebelum jam 22.00 dan berdoa.`;
  } else if (countBefore2200AndDoa >= 4 && countBefore2200AndDoa <= 8) {
    rating = 2;
    note = `Cukup baik: ${countBefore2200AndDoa} kali tidur sebelum jam 22.00 dan berdoa.`;
  } else {
    rating = 1;
    note = `Kurang baik: Kurang dari 4 kali tidur sebelum jam 22.00 dan berdoa.`;
  }

  if (totalDays === 0) {
    // Jika sama sekali tidak ada data tidur
    rating = 1;
    note = "Belum ada data tidur.";
  }

  return {
    id: "tidur",
    label: INDICATOR_DEFINITIONS.find((item) => item.id === "tidur")!.label,
    rating,
    note,
  };
}

function computeIndicators(entries: Kebiasaan[]): IndicatorSummary[] {
  return [
    evaluateBangun(entries),
    evaluateBeribadah(entries),
    evaluateOlahraga(entries),
    evaluateMakan(entries),
    evaluateBelajar(entries),
    evaluateMasyarakat(entries),
    evaluateTidur(entries),
  ];
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

    // Fetch admin from DB using id from token
    const admin = (await adminCollection.findOne({
      id: payload.id,
    })) as Admin | null;
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Get allowed student NISNs based on admin permissions
    let allowedNisns: string[] = [];
    if (admin.email === "smkn31jktdev@gmail.com") {
      // Super admin can see all students
      const allStudents = await studentCollection.find({}).toArray();
      allowedNisns = allStudents.map((s) => s.nisn);
    } else {
      // Regular admin can only see students where walas matches their nama
      const allowedStudents = await studentCollection
        .find({ walas: admin.nama })
        .toArray();
      allowedNisns = allowedStudents.map((s) => s.nisn);
    }

    // Fetch all allowed students data
    const allowedStudents = await studentCollection
      .find({ nisn: { $in: allowedNisns } })
      .toArray();
    const studentMap = new Map(allowedStudents.map((s) => [s.nisn, s]));

    const documents = await kegiatanCollection.find({}).toArray();

    const perStudent = new Map<string, StudentAggregate>();

    documents.forEach((doc) => {
      const kebiasaan = doc as unknown as Kebiasaan;
      // Only process if student is allowed
      if (!allowedNisns.includes(kebiasaan.nisn)) {
        return;
      }
      const parsedDate = safeParseDate(kebiasaan.tanggal);
      if (!parsedDate) {
        return;
      }

      const { key: monthKey, monthStart } = monthKeyFromDate(parsedDate);
      const existing = perStudent.get(kebiasaan.nisn);

      if (!existing) {
        const studentData = studentMap.get(kebiasaan.nisn);
        if (!studentData) return;
        perStudent.set(kebiasaan.nisn, {
          student: {
            nisn: kebiasaan.nisn,
            nama: studentData.nama,
            kelas: studentData.kelas,
            walas: studentData.walas,
            monthLabel: formatMonthLabel(monthStart),
            monthKey,
            indicators: [],
          },
          entries: [kebiasaan],
        });
        return;
      }

      existing.entries.push(kebiasaan);
      const currentMonthDate = safeParseDate(`${existing.student.monthKey}-01`);

      if (currentMonthDate) {
        if (monthStart.getTime() > currentMonthDate.getTime()) {
          existing.student.monthKey = monthKey;
          existing.student.monthLabel = formatMonthLabel(monthStart);
        }
      }
    });

    const result: StudentSummary[] = Array.from(perStudent.values()).map(
      ({ student, entries }) => {
        const filteredEntries = entries.filter((entry) => {
          const parsed = safeParseDate(entry.tanggal);
          if (!parsed) return false;
          const key = monthKeyFromDate(parsed).key;
          return key === student.monthKey;
        });

        const indicators = computeIndicators(filteredEntries);
        return {
          ...student,
          indicators,
        };
      }
    );

    result.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
