// ========== Types for Regular Beribadah ==========
export interface BeribadahEntry {
  tanggal: string;
  berdoaUntukDiriDanOrtu: boolean;
  sholatFajar: boolean;
  sholatLimaWaktuBerjamaah: boolean;
  zikirSesudahSholat: boolean;
  sholatDhuha: boolean;
  sholatSunahRawatib: boolean;
  zakatInfaqSedekah: string;
}

export interface BeribadahStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BeribadahEntry[];
}

// ========== Types for Ramadhan ==========
export interface RamadhanEntry {
  tanggal: string;
  sholatTarawihWitir: boolean;
  berpuasa: boolean;
  ramadhanDay: number | null;
}

export interface RamadhanStudentSummary {
  totalTarawihWitir: number;
  totalPuasa: number;
  totalRamadhanDays: number;
  tarawihWitirRating: number;
  puasaRating: number;
  tarawihWitirNote: string;
  puasaNote: string;
}

export interface RamadhanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  hijriYear: number;
  entries: RamadhanEntry[];
  summary: RamadhanStudentSummary;
}

export interface RamadhanPeriod {
  hijriYear: number;
  gregorianYear: number;
  startDate: string;
  endDate: string;
}

export interface AvailableYear {
  hijriYear: number;
  gregorianYear: number;
}

export interface RamadhanResponse {
  data: RamadhanStudent[];
  period: RamadhanPeriod;
  availableYears: AvailableYear[];
  error?: string;
}

export type BooleanColumnKey = Exclude<
  keyof BeribadahEntry,
  "zakatInfaqSedekah"
>;

export type BooleanColumn = {
  key: BooleanColumnKey;
  label: string;
  pdfLabel: string;
  type: "boolean";
  width: number;
};

export type CurrencyColumn = {
  key: "zakatInfaqSedekah";
  label: string;
  pdfLabel: string;
  type: "currency";
  width: number;
};

export const PRAYER_COLUMNS: Array<BooleanColumn | CurrencyColumn> = [
  {
    key: "berdoaUntukDiriDanOrtu",
    label: "Berdoa",
    pdfLabel: "Doa",
    type: "boolean",
    width: 25,
  },
  {
    key: "sholatFajar",
    label: "Fajar",
    pdfLabel: "Fajar",
    type: "boolean",
    width: 20,
  },
  {
    key: "sholatLimaWaktuBerjamaah",
    label: "5 Waktu",
    pdfLabel: "5 Waktu",
    type: "boolean",
    width: 25,
  },
  {
    key: "zikirSesudahSholat",
    label: "Zikir",
    pdfLabel: "Zikir",
    type: "boolean",
    width: 25,
  },
  {
    key: "sholatDhuha",
    label: "Dhuha",
    pdfLabel: "Dhuha",
    type: "boolean",
    width: 20,
  },
  {
    key: "sholatSunahRawatib",
    label: "Rawatib",
    pdfLabel: "Rawatib",
    type: "boolean",
    width: 20,
  },
  {
    key: "zakatInfaqSedekah",
    label: "Zakat/Infaq",
    pdfLabel: "ZIS (Rp)",
    type: "currency",
    width: 30,
  },
];

export const RAMADHAN_COLOR = "#1AAC7A";

export type ViewMode = "harian" | "ramadhan";

export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 5:
      return "Istimewa";
    case 4:
      return "Sangat Baik";
    case 3:
      return "Baik";
    case 2:
      return "Cukup Baik";
    default:
      return "Kurang Baik";
  }
}

export function getRatingColor(rating: number): string {
  switch (rating) {
    case 5:
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case 4:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case 3:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case 2:
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-red-100 text-red-700 border-red-200";
  }
}
