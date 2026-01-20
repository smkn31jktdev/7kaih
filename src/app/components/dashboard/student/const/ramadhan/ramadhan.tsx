import calendarData from "@/app/server/data/calendar.json";

export type RamadhanBooleanKey = "sholatTarawihWitir" | "berpuasa";

export type RamadhanForm = {
  [key in RamadhanBooleanKey]: boolean;
};

export const RAMADHAN_BOOLEAN_FIELDS: Array<{
  key: RamadhanBooleanKey;
  label: string;
  description: string;
  icon: "moon" | "sunrise";
}> = [
  {
    key: "sholatTarawihWitir",
    label: "Sholat Tarawih & Witir*",
    description: "Melaksanakan sholat tarawih dan witir di malam hari",
    icon: "moon",
  },
  {
    key: "berpuasa",
    label: "Berpuasa*",
    description: "Menjalankan ibadah puasa di bulan Ramadhan",
    icon: "sunrise",
  },
];

export const createDefaultRamadhan = (): RamadhanForm => ({
  sholatTarawihWitir: false,
  berpuasa: false,
});

export const getRamadhanPeriodForDate = (date: Date | string) => {
  const checkDate = typeof date === "string" ? new Date(date) : date;
  const yearToCheck = checkDate.getFullYear();

  const ramadhanData = calendarData.ramadan.find(
    (r) => r.gregorian_year === yearToCheck,
  );

  if (!ramadhanData) {
    return {
      hijri_year: 1447,
      gregorian_year: 2026,
      start_date: new Date("2026-02-18"),
      end_date: new Date("2026-03-19"),
      eid_date: new Date("2026-03-20"),
    };
  }

  return {
    hijri_year: ramadhanData.hijri_year,
    gregorian_year: ramadhanData.gregorian_year,
    start_date: new Date(ramadhanData.start_date),
    end_date: new Date(ramadhanData.end_date),
    eid_date: new Date(ramadhanData.eid_date),
  };
};

export const isRamadhanPeriod = (date: Date | string): boolean => {
  const checkDate = typeof date === "string" ? new Date(date) : date;
  const ramadhanPeriod = getRamadhanPeriodForDate(checkDate);

  const normalizedCheck = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate(),
  );
  const normalizedStart = new Date(
    ramadhanPeriod.start_date.getFullYear(),
    ramadhanPeriod.start_date.getMonth(),
    ramadhanPeriod.start_date.getDate(),
  );
  const normalizedEnd = new Date(
    ramadhanPeriod.end_date.getFullYear(),
    ramadhanPeriod.end_date.getMonth(),
    ramadhanPeriod.end_date.getDate(),
  );

  return normalizedCheck >= normalizedStart && normalizedCheck <= normalizedEnd;
};

export const getRamadhanDay = (date: Date | string): number | null => {
  if (!isRamadhanPeriod(date)) return null;

  const checkDate = typeof date === "string" ? new Date(date) : date;
  const ramadhanPeriod = getRamadhanPeriodForDate(checkDate);
  const diffTime = checkDate.getTime() - ramadhanPeriod.start_date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1;
};

export const getRamadhanDaysRemaining = (
  date: Date | string,
): number | null => {
  if (!isRamadhanPeriod(date)) return null;

  const checkDate = typeof date === "string" ? new Date(date) : date;
  const ramadhanPeriod = getRamadhanPeriodForDate(checkDate);
  const diffTime = ramadhanPeriod.end_date.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Return null if it's the last day (0 days remaining) or past the last day
  if (diffDays <= 0) return null;

  return diffDays;
};

export const getHijriYearForDate = (date: Date | string): number => {
  const ramadhanPeriod = getRamadhanPeriodForDate(date);
  return ramadhanPeriod.hijri_year;
};

export const getCurrentHijriYear = (): number => {
  return getHijriYearForDate(new Date());
};
