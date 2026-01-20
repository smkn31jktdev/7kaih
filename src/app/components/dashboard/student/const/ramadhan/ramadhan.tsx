// Constants for Ramadhan special activities
// Active period: February 19, 2026 - March 19, 2026 (March 20 is Eid Al-Fitr)

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

// Ramadhan date range for 2026
// Note: March 20 is Eid Al-Fitr, so Ramadhan ends on March 19
export const RAMADHAN_START_DATE = new Date("2026-02-19");
export const RAMADHAN_END_DATE = new Date("2026-03-19");

/**
 * Check if a given date falls within Ramadhan period
 * @param date - Date to check (can be Date object or string in YYYY-MM-DD format)
 * @returns boolean indicating if it's Ramadhan
 */
export const isRamadhanPeriod = (date: Date | string): boolean => {
  const checkDate = typeof date === "string" ? new Date(date) : date;

  // Normalize to compare just the date (ignore time)
  const normalizedCheck = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate(),
  );
  const normalizedStart = new Date(
    RAMADHAN_START_DATE.getFullYear(),
    RAMADHAN_START_DATE.getMonth(),
    RAMADHAN_START_DATE.getDate(),
  );
  const normalizedEnd = new Date(
    RAMADHAN_END_DATE.getFullYear(),
    RAMADHAN_END_DATE.getMonth(),
    RAMADHAN_END_DATE.getDate(),
  );

  return normalizedCheck >= normalizedStart && normalizedCheck <= normalizedEnd;
};

/**
 * Get Ramadhan day number from date
 * @param date - Date to check
 * @returns number of Ramadhan day (1-30) or null if not Ramadhan
 */
export const getRamadhanDay = (date: Date | string): number | null => {
  if (!isRamadhanPeriod(date)) return null;

  const checkDate = typeof date === "string" ? new Date(date) : date;
  const diffTime = checkDate.getTime() - RAMADHAN_START_DATE.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays + 1; // Day 1 = first day of Ramadhan
};

/**
 * Get days remaining in Ramadhan
 * @param date - Current date
 * @returns number of days remaining or null if not Ramadhan
 */
export const getRamadhanDaysRemaining = (
  date: Date | string,
): number | null => {
  if (!isRamadhanPeriod(date)) return null;

  const checkDate = typeof date === "string" ? new Date(date) : date;
  const diffTime = RAMADHAN_END_DATE.getTime() - checkDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};
