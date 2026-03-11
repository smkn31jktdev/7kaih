export interface SemesterIndicator {
  id: string;
  label: string;
  ratings: Record<string, number>; // monthKey -> rating
  notes: Record<string, string>; // monthKey -> note
  averageRating: number;
}

export interface StudentSemesterSummary {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  semesterLabel: string;
  semesterKey: string;
  tahunAjaran: string;
  months: SemesterMonth[];
  indicators: SemesterIndicator[];
  overallRating: number;
}

export interface SemesterMonth {
  key: string;
  label: string;
}

export interface SemesterOption {
  key: string;
  label: string;
  tahunAjaran: string;
  months: SemesterMonth[];
}

export const RATING_HEADERS = [
  { value: 1, label: "Kurang Baik" },
  { value: 2, label: "Cukup Baik" },
  { value: 3, label: "Baik" },
  { value: 4, label: "Sangat Baik" },
  { value: 5, label: "Istimewa" },
] as const;

export function getRatingLabel(rating: number): string {
  return RATING_HEADERS.find((h) => h.value === rating)?.label ?? "-";
}

/**
 * Given a year (tahun ajaran start year), return the semester options.
 * Semester 1 (Ganjil): Juli - November
 * Semester 2 (Genap): Januari - Mei
 */
export function buildSemesterOptions(years: number[]): SemesterOption[] {
  const MONTH_NAMES_ID = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const options: SemesterOption[] = [];

  const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

  for (const year of uniqueYears) {
    // Semester 1 (Ganjil): Juli-November of `year`
    const sem1Months: SemesterMonth[] = [];
    for (let m = 7; m <= 11; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      sem1Months.push({ key, label: `${MONTH_NAMES_ID[m - 1]} ${year}` });
    }
    options.push({
      key: `${year}-sem1`,
      label: `Semester 1 (Ganjil) ${year}/${year + 1}`,
      tahunAjaran: `${year}/${year + 1}`,
      months: sem1Months,
    });

    // Semester 2 (Genap): Januari-Mei of `year + 1`
    const nextYear = year + 1;
    const sem2Months: SemesterMonth[] = [];
    for (let m = 1; m <= 5; m++) {
      const key = `${nextYear}-${String(m).padStart(2, "0")}`;
      sem2Months.push({
        key,
        label: `${MONTH_NAMES_ID[m - 1]} ${nextYear}`,
      });
    }
    options.push({
      key: `${year}-sem2`,
      label: `Semester 2 (Genap) ${year}/${year + 1}`,
      tahunAjaran: `${year}/${year + 1}`,
      months: sem2Months,
    });
  }

  return options;
}
