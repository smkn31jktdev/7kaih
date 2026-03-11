export interface SummaryIndicator {
  id: string;
  label: string;
  rating: number;
  note: string;
}

export interface StudentSummary {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  monthLabel: string;
  monthKey: string;
  indicators: SummaryIndicator[];
}

export interface SummaryMonthOption {
  key: string;
  label: string;
}

export const RATING_HEADERS = [
  { value: 1, label: "Kurang Baik" },
  { value: 2, label: "Cukup Baik" },
  { value: 3, label: "Baik" },
  { value: 4, label: "Sangat Baik" },
  { value: 5, label: "Istimewa" },
] as const;
