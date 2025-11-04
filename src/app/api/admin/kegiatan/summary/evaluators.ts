import { Kebiasaan } from "@/app/types/kebiasaan";

export interface IndicatorSummary {
  id: string;
  label: string;
  rating: number;
  note: string;
}

export const INDICATOR_DEFINITIONS: Array<{
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

export interface BangunMetrics {
  rating: number;
  note: string;
  totalDays: number;
  countBefore0430AndDoa: number;
  countBefore0500AndDoa: number;
  countAt0500AndDoa: number;
  countBefore0530NoDoa: number;
}

export interface BeribadahComponentScore {
  key:
    | "berdoaUntukDiriDanOrtu"
    | "sholatFajar"
    | "sholatLimaWaktuBerjamaah"
    | "zikirSesudahSholat"
    | "sholatDhuha"
    | "sholatSunahRawatib"
    | "zakatInfaqSedekah";
  label: string;
  count: number;
  rating: number;
}

export interface BeribadahMetrics {
  rating: number;
  note: string;
  totalDays: number;
  averageDailyScore: number;
  components: BeribadahComponentScore[];
  totalZakat: number;
}

export interface OlahragaMetrics {
  rating: number;
  note: string;
  totalDays: number;
  consistentDays: number;
  ratio: number;
}

export interface MakanMetrics {
  rating: number;
  note: string;
  totalDays: number;
  healthyDays: number;
  ratio: number;
}

export interface BelajarComponentScore {
  key:
    | "membaca-kitab-suci"
    | "membaca-buku-bacaan"
    | "membaca-buku-pelajaran"
    | "mengerjakan-tugas"
    | "other";
  label: string;
  count: number;
  rating: number;
}

export interface BelajarMetrics {
  rating: number;
  note: string;
  totalDays: number;
  completed: number;
  ratio: number;
  components: BelajarComponentScore[];
}

export interface BermasyarakatMetrics {
  rating: number;
  note: string;
  totalDays: number;
  participated: number;
}

export interface TidurMetrics {
  rating: number;
  note: string;
  totalDays: number;
  countBefore2200AndDoa: number;
}

export interface IndicatorBundle {
  bangunPagi: BangunMetrics;
  beribadah: BeribadahMetrics;
  olahraga: OlahragaMetrics;
  makanSehat: MakanMetrics;
  belajar: BelajarMetrics;
  bermasyarakat: BermasyarakatMetrics;
  tidur: TidurMetrics;
}

export function safeParseDate(raw: string): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const normalized = raw.replace(/\//g, "-");
    const fallback = new Date(normalized);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return parsed;
}

export function monthKeyFromDate(date: Date): {
  key: string;
  monthStart: Date;
} {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const key = `${monthStart.getFullYear()}-${String(
    monthStart.getMonth() + 1
  ).padStart(2, "0")}`;
  return { key, monthStart };
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
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

interface RatioThreshold {
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
}

const DEFAULT_RATIO_THRESHOLD: RatioThreshold = {
  rating5: 0.9,
  rating4: 0.75,
  rating3: 0.5,
  rating2: 0.25,
};

export function mapBerdoaCountToScore(count: number) {
  if (count > 24) return 5;
  if (count >= 15) return 4;
  if (count >= 9) return 3;
  if (count >= 4) return 2;
  return 1;
}

export function mapSholatFajarCountToScore(count: number) {
  if (count > 15) return 5;
  if (count >= 10) return 4;
  if (count >= 5) return 3;
  if (count >= 3) return 2;
  return 1;
}

export function mapSholat5CountToScore(count: number) {
  if (count >= 28) return 5;
  if (count >= 25) return 4;
  if (count >= 20) return 3;
  if (count >= 15) return 2;
  return 1;
}

export function mapGenericCountToScore(count: number) {
  if (count > 24) return 5;
  if (count >= 15) return 4;
  if (count >= 9) return 3;
  if (count >= 4) return 2;
  return 1;
}

export function mapZakatAmountToScore(amount: number) {
  if (amount > 75000) return 5;
  if (amount > 60000) return 4;
  if (amount > 50000) return 3;
  if (amount > 45000) return 2;
  return 1;
}

export function mapBelajarCountToScore(count: number) {
  if (count >= 24) return 5;
  if (count >= 12) return 4;
  if (count >= 8) return 3;
  if (count >= 4) return 2;
  return 1;
}

export function evaluateBangun(entries: Kebiasaan[]): BangunMetrics {
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
      countBefore0430AndDoa++;
    }
    if (time < 5 * 60 && doa) {
      countBefore0500AndDoa++;
    }
    if (time === 5 * 60 && doa) {
      countAt0500AndDoa++;
    }
    if (time < 5.5 * 60 && !doa) {
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
      note = `Kurang baik: ${countBefore0530NoDoa} kali bangun sebelum 05.30 tanpa berdoa.`;
    } else {
      note =
        "Kurang baik: Kurang dari 4 kali bangun sebelum 05.30 dan tidak berdoa.";
    }
  }

  if (totalDays === 0) {
    rating = 1;
    note = "Belum ada data bangun pagi.";
  }

  return {
    rating,
    note,
    totalDays,
    countBefore0430AndDoa,
    countBefore0500AndDoa,
    countAt0500AndDoa,
    countBefore0530NoDoa,
  };
}

export function evaluateBeribadah(entries: Kebiasaan[]): BeribadahMetrics {
  const WAJIB_KEYS = ["sholatFajar", "sholatLimaWaktuBerjamaah"] as const;
  const SUNNAH_KEYS = [
    "sholatDhuha",
    "sholatSunahRawatib",
    "zikirSesudahSholat",
  ] as const;
  const DOA_KEY = "berdoaUntukDiriDanOrtu" as const;
  const SEDEKAH_KEY = "zakatInfaqSedekah" as const;

  let totalScore = 0;
  let totalDays = 0;

  let berdoaCount = 0;
  let sholatFajarCount = 0;
  let sholatLimaWaktuCount = 0;
  let zikirCount = 0;
  let sholatDhuhaCount = 0;
  let sholatSunahRawatibCount = 0;
  let totalZakat = 0;

  entries.forEach((entry) => {
    if (!entry.beribadah) return;
    totalDays += 1;

    const beribadah = entry.beribadah;

    let dailyScore = 0;

    const wajibCompleted = WAJIB_KEYS.every((key) => beribadah[key] === true);
    if (wajibCompleted) dailyScore += 1;

    const sunnahCompleted = SUNNAH_KEYS.filter((key) => beribadah[key]).length;
    dailyScore += sunnahCompleted / SUNNAH_KEYS.length;

    if (beribadah[DOA_KEY]) dailyScore += 1;

    const sedekah = beribadah[SEDEKAH_KEY];
    if (sedekah && String(sedekah).trim()) dailyScore += 1;

    totalScore += dailyScore;

    if (beribadah.berdoaUntukDiriDanOrtu) berdoaCount++;
    if (beribadah.sholatFajar) sholatFajarCount++;
    if (beribadah.sholatLimaWaktuBerjamaah) sholatLimaWaktuCount++;
    if (beribadah.zikirSesudahSholat) zikirCount++;
    if (beribadah.sholatDhuha) sholatDhuhaCount++;
    if (beribadah.sholatSunahRawatib) sholatSunahRawatibCount++;

    const parsedZakat = Number(
      String(beribadah.zakatInfaqSedekah ?? "0").replace(/[^0-9.-]+/g, "")
    );
    if (!Number.isNaN(parsedZakat)) {
      totalZakat += parsedZakat;
    }
  });

  const averageDailyScore = totalDays ? totalScore / totalDays : 0;

  let rating = 1;
  let note = "Belum ada data ibadah.";
  if (totalDays > 0) {
    if (averageDailyScore >= 3.5) {
      rating = 5;
      note = "Selalu melaksanakan ibadah wajib dan sunnah secara konsisten.";
    } else if (averageDailyScore >= 2.5) {
      rating = 4;
      note = "Sering melaksanakan ibadah wajib dan sebagian ibadah sunnah.";
    } else if (averageDailyScore >= 1.5) {
      rating = 3;
      note =
        "Melaksanakan ibadah wajib dengan cukup rutin, namun ibadah sunnah masih belum konsisten.";
    } else if (averageDailyScore >= 0.5) {
      rating = 2;
      note =
        "Melaksanakan sebagian ibadah wajib dan sunnah, namun frekuensinya tidak teratur dan masih perlu ditingkatkan.";
    } else {
      rating = 1;
      note = "Jarang melaksanakan ibadah wajib maupun sunnah.";
    }
  }

  const components: BeribadahComponentScore[] = [
    {
      key: "berdoaUntukDiriDanOrtu",
      label: "Berdoa untuk diri sendiri dan orang tua",
      count: berdoaCount,
      rating: mapBerdoaCountToScore(berdoaCount),
    },
    {
      key: "sholatFajar",
      label: "Sholat Fajar / Qoblal Subuh",
      count: sholatFajarCount,
      rating: mapSholatFajarCountToScore(sholatFajarCount),
    },
    {
      key: "sholatLimaWaktuBerjamaah",
      label: "Sholat 5 waktu",
      count: sholatLimaWaktuCount,
      rating: mapSholat5CountToScore(sholatLimaWaktuCount),
    },
    {
      key: "zikirSesudahSholat",
      label: "Zikir dan doa sehabis sholat fardlu",
      count: zikirCount,
      rating: mapGenericCountToScore(zikirCount),
    },
    {
      key: "sholatDhuha",
      label: "Sholat Dhuha",
      count: sholatDhuhaCount,
      rating: mapGenericCountToScore(sholatDhuhaCount),
    },
    {
      key: "sholatSunahRawatib",
      label: "Sholat sunah rawatib",
      count: sholatSunahRawatibCount,
      rating: mapGenericCountToScore(sholatSunahRawatibCount),
    },
    {
      key: "zakatInfaqSedekah",
      label: "Membayar zakat, infaq, sodaqoh",
      count: totalZakat,
      rating: mapZakatAmountToScore(totalZakat),
    },
  ];

  return {
    rating,
    note,
    totalDays,
    averageDailyScore,
    components,
    totalZakat,
  };
}

export function evaluateOlahraga(entries: Kebiasaan[]): OlahragaMetrics {
  const relevant = entries.filter((entry) => entry.olahraga);
  const totalDays = relevant.length;
  let consistentDays = 0;

  relevant.forEach((entry) => {
    const raw = entry.olahraga?.waktu ?? "0";
    const minutes = Number.parseInt(String(raw), 10);
    if (!Number.isNaN(minutes) && minutes >= 30) {
      consistentDays += 1;
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

  return { rating, note, totalDays, consistentDays, ratio };
}

export function evaluateMakan(entries: Kebiasaan[]): MakanMetrics {
  const relevant = entries.filter((entry) => entry.makanSehat);
  const totalDays = relevant.length;
  let healthyDays = 0;

  relevant.forEach((entry) => {
    const data = entry.makanSehat;
    if (!data) return;
    const hasBalancedMeal = Boolean(
      data.jenisMakanan?.trim() || data.jenisLaukSayur?.trim()
    );
    if (hasBalancedMeal || data.minumSuplemen || data.makanSayurAtauBuah) {
      healthyDays += 1;
    }
  });

  const ratio = totalDays ? healthyDays / totalDays : 0;
  const rating = totalDays ? ratioToRating(ratio) : 1;
  const note = totalDays
    ? `Siswa mengonsumsi makanan sehat dan bergizi.`
    : "Belum ada data makan sehat.";

  return { rating, note, totalDays, healthyDays, ratio };
}

const BELAJAR_COMPONENT_DEFINITIONS: Array<{
  key: BelajarComponentScore["key"];
  label: string;
}> = [
  {
    key: "membaca-kitab-suci",
    label: "Membaca kitab suci",
  },
  {
    key: "membaca-buku-bacaan",
    label: "Membaca buku bacaan / novel / hobi / sejarah",
  },
  {
    key: "membaca-buku-pelajaran",
    label: "Membaca buku mata pelajaran",
  },
  {
    key: "mengerjakan-tugas",
    label: "Mengerjakan tugas / PR",
  },
];

export function evaluateBelajar(entries: Kebiasaan[]): BelajarMetrics {
  const relevant = entries.filter((entry) => entry.belajar);
  const totalDays = relevant.length;
  const completedEntries = relevant.filter(
    (entry) => entry.belajar?.yaAtauTidak
  );
  const completed = completedEntries.length;

  const ratio = totalDays ? completed / totalDays : 0;
  const rating = totalDays ? ratioToRating(ratio) : 1;
  const note = totalDays
    ? `Siswa gemar belajar mandiri.`
    : "Belum ada data belajar.";

  const counts = new Map<BelajarComponentScore["key"], number>();
  BELAJAR_COMPONENT_DEFINITIONS.forEach(({ key }) => counts.set(key, 0));
  counts.set("other", 0);

  completedEntries.forEach((entry) => {
    const key =
      (entry.belajar?.deskripsi as BelajarComponentScore["key"]) ?? "other";
    const actualKey = counts.has(key) ? key : "other";
    counts.set(actualKey, (counts.get(actualKey) ?? 0) + 1);
  });

  const components: BelajarComponentScore[] = BELAJAR_COMPONENT_DEFINITIONS.map(
    ({ key, label }) => ({
      key,
      label,
      count: counts.get(key) ?? 0,
      rating: mapBelajarCountToScore(counts.get(key) ?? 0),
    })
  );

  const otherCount = counts.get("other") ?? 0;
  if (otherCount > 0) {
    components.push({
      key: "other",
      label: "Kegiatan belajar lainnya",
      count: otherCount,
      rating: mapBelajarCountToScore(otherCount),
    });
  }

  return { rating, note, totalDays, completed, ratio, components };
}

export function evaluateMasyarakat(entries: Kebiasaan[]): BermasyarakatMetrics {
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

  return { rating, note, totalDays, participated };
}

export function evaluateTidur(entries: Kebiasaan[]): TidurMetrics {
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
    rating = 1;
    note = "Belum ada data tidur.";
  }

  return { rating, note, totalDays, countBefore2200AndDoa };
}

export function evaluateIndicators(entries: Kebiasaan[]): IndicatorBundle {
  return {
    bangunPagi: evaluateBangun(entries),
    beribadah: evaluateBeribadah(entries),
    olahraga: evaluateOlahraga(entries),
    makanSehat: evaluateMakan(entries),
    belajar: evaluateBelajar(entries),
    bermasyarakat: evaluateMasyarakat(entries),
    tidur: evaluateTidur(entries),
  };
}

export function toIndicatorSummaries(
  bundle: IndicatorBundle
): IndicatorSummary[] {
  return [
    {
      id: "bangunPagi",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "bangunPagi")!
        .label,
      rating: bundle.bangunPagi.rating,
      note: bundle.bangunPagi.note,
    },
    {
      id: "beribadah",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "beribadah")!
        .label,
      rating: bundle.beribadah.rating,
      note: bundle.beribadah.note,
    },
    {
      id: "olahraga",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "olahraga")!
        .label,
      rating: bundle.olahraga.rating,
      note: bundle.olahraga.note,
    },
    {
      id: "makanSehat",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "makanSehat")!
        .label,
      rating: bundle.makanSehat.rating,
      note: bundle.makanSehat.note,
    },
    {
      id: "belajar",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "belajar")!.label,
      rating: bundle.belajar.rating,
      note: bundle.belajar.note,
    },
    {
      id: "bermasyarakat",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "bermasyarakat")!
        .label,
      rating: bundle.bermasyarakat.rating,
      note: bundle.bermasyarakat.note,
    },
    {
      id: "tidur",
      label: INDICATOR_DEFINITIONS.find((item) => item.id === "tidur")!.label,
      rating: bundle.tidur.rating,
      note: bundle.tidur.note,
    },
  ];
}
