"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  StudentSemesterSummary,
  SemesterOption,
  SemesterIndicator,
  SemesterMonth,
} from "./types";
import { buildSemesterOptions } from "./types";

interface MonthSummaryResponse {
  summaries: Array<{
    nisn: string;
    nama: string;
    kelas: string;
    walas: string;
    monthLabel: string;
    monthKey: string;
    indicators: Array<{
      id: string;
      label: string;
      rating: number;
      note: string;
    }>;
  }>;
  availableMonths: Array<{ key: string; label: string }>;
  selectedMonth: string | null;
}

export interface UseSemesterDataReturn {
  semesterSummaries: StudentSemesterSummary[];
  loading: boolean;
  error: string | null;
  semesterOptions: SemesterOption[];
  selectedSemester: string | null;
  selectedDetail: StudentSemesterSummary | null;
  isDetailOpen: boolean;
  handleSemesterChange: (semesterKey: string) => void;
  openDetail: (summary: StudentSemesterSummary) => void;
  closeDetail: () => void;
}

export function useSemesterData(): UseSemesterDataReturn {
  const [semesterSummaries, setSemesterSummaries] = useState<
    StudentSemesterSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<StudentSemesterSummary | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const semesterOptions = useMemo(
    () => buildSemesterOptions(availableYears),
    [availableYears],
  );

  const currentSemesterOption = useMemo(
    () => semesterOptions.find((opt) => opt.key === selectedSemester) ?? null,
    [semesterOptions, selectedSemester],
  );

  // Fetch available months first, then determine years
  const fetchAvailableMonths = useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setError("Token admin tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await fetch("/api/admin/kegiatan/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Gagal memuat data");
      }

      const data: MonthSummaryResponse = await response.json();
      const years = new Set<number>();

      data.availableMonths.forEach((m) => {
        const year = parseInt(m.key.split("-")[0], 10);
        if (!isNaN(year)) {
          years.add(year);
        }
      });

      const yearArray = Array.from(years);
      setAvailableYears(yearArray);

      return yearArray;
    } catch (err) {
      console.error("Error fetching available months:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      return [];
    }
  }, []);

  // Fetch data for a single month
  const fetchMonthData = useCallback(
    async (monthKey: string): Promise<MonthSummaryResponse | null> => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return null;

        const response = await fetch(
          `/api/admin/kegiatan/summary?month=${encodeURIComponent(monthKey)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) return null;

        return await response.json();
      } catch {
        return null;
      }
    },
    [],
  );

  // Aggregate monthly data into semester summaries
  const fetchSemesterData = useCallback(
    async (semester: SemesterOption) => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all months in parallel
        const monthDataResults = await Promise.all(
          semester.months.map(async (month) => {
            const data = await fetchMonthData(month.key);
            return { month, data };
          }),
        );

        // Collect all unique students across all months
        const studentMap = new Map<
          string,
          {
            nisn: string;
            nama: string;
            kelas: string;
            walas: string;
            monthData: Map<
              string,
              Array<{ id: string; label: string; rating: number; note: string }>
            >;
          }
        >();

        const validMonths: SemesterMonth[] = [];

        monthDataResults.forEach(({ month, data }) => {
          if (!data || data.summaries.length === 0) return;

          validMonths.push(month);

          data.summaries.forEach((summary) => {
            if (!studentMap.has(summary.nisn)) {
              studentMap.set(summary.nisn, {
                nisn: summary.nisn,
                nama: summary.nama,
                kelas: summary.kelas,
                walas: summary.walas,
                monthData: new Map(),
              });
            }

            const student = studentMap.get(summary.nisn)!;
            // Update name/class to latest
            student.nama = summary.nama;
            student.kelas = summary.kelas;
            student.walas = summary.walas;
            student.monthData.set(month.key, summary.indicators);
          });
        });

        // Build semester summaries
        const summaries: StudentSemesterSummary[] = [];

        studentMap.forEach((student) => {
          // Collect all indicator IDs across all months for this student
          const indicatorIds = new Map<string, string>();
          student.monthData.forEach((indicators) => {
            indicators.forEach((ind) => {
              if (!indicatorIds.has(ind.id)) {
                indicatorIds.set(ind.id, ind.label);
              }
            });
          });

          // Build semester indicators
          const semesterIndicators: SemesterIndicator[] = [];
          indicatorIds.forEach((label, id) => {
            const ratings: Record<string, number> = {};
            const notes: Record<string, string> = {};
            let totalRating = 0;
            let monthCount = 0;

            validMonths.forEach((month) => {
              const monthIndicators = student.monthData.get(month.key);
              if (monthIndicators) {
                const found = monthIndicators.find((ind) => ind.id === id);
                if (found) {
                  ratings[month.key] = found.rating;
                  notes[month.key] = found.note;
                  totalRating += found.rating;
                  monthCount++;
                }
              }
            });

            const averageRating =
              monthCount > 0 ? Math.round(totalRating / monthCount) : 0;

            semesterIndicators.push({
              id,
              label,
              ratings,
              notes,
              averageRating,
            });
          });

          // Calculate overall average
          const overallRating =
            semesterIndicators.length > 0
              ? Math.round(
                  semesterIndicators.reduce(
                    (sum, ind) => sum + ind.averageRating,
                    0,
                  ) / semesterIndicators.length,
                )
              : 0;

          summaries.push({
            nisn: student.nisn,
            nama: student.nama,
            kelas: student.kelas,
            walas: student.walas,
            semesterLabel: semester.label,
            semesterKey: semester.key,
            tahunAjaran: semester.tahunAjaran,
            months: validMonths,
            indicators: semesterIndicators,
            overallRating,
          });
        });

        summaries.sort((a, b) => a.nama.localeCompare(b.nama, "id-ID"));
        setSemesterSummaries(summaries);
      } catch (err) {
        console.error("Error fetching semester data:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setSemesterSummaries([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchMonthData],
  );

  // Determine the current semester based on date
  const autoSelectSemester = useCallback(
    (years: number[]) => {
      if (years.length === 0) return;

      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();

      const options = buildSemesterOptions(years);

      // Try to auto-select the current semester
      let matched: SemesterOption | null = null;

      if (currentMonth >= 7 && currentMonth <= 11) {
        // Semester 1 of current year
        matched =
          options.find((opt) => opt.key === `${currentYear}-sem1`) ?? null;
      } else if (currentMonth >= 1 && currentMonth <= 5) {
        // Semester 2 of previous year's tahun ajaran
        matched =
          options.find((opt) => opt.key === `${currentYear - 1}-sem2`) ?? null;
      }

      if (!matched && options.length > 0) {
        matched = options[0];
      }

      if (matched) {
        setSelectedSemester(matched.key);
        fetchSemesterData(matched);
      } else {
        setLoading(false);
      }
    },
    [fetchSemesterData],
  );

  const handleSemesterChange = useCallback(
    (semesterKey: string) => {
      if (!semesterKey || semesterKey === selectedSemester) return;
      if (isDetailOpen) {
        setIsDetailOpen(false);
        setSelectedDetail(null);
      }
      setSelectedSemester(semesterKey);
      const option = semesterOptions.find((opt) => opt.key === semesterKey);
      if (option) {
        fetchSemesterData(option);
      }
    },
    [selectedSemester, isDetailOpen, semesterOptions, fetchSemesterData],
  );

  const openDetail = useCallback((summary: StudentSemesterSummary) => {
    setSelectedDetail(summary);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedDetail(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAvailableMonths().then((years) => {
      if (years && years.length > 0) {
        autoSelectSemester(years);
      } else {
        setLoading(false);
      }
    });
  }, [fetchAvailableMonths, autoSelectSemester]);

  return {
    semesterSummaries,
    loading,
    error,
    semesterOptions,
    selectedSemester,
    selectedDetail,
    isDetailOpen,
    handleSemesterChange,
    openDetail,
    closeDetail,
  };
}
