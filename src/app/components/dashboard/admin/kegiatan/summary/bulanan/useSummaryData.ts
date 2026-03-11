"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type { StudentSummary, SummaryMonthOption } from "./types";

export interface UseSummaryDataReturn {
  summaries: StudentSummary[];
  summaryLoading: boolean;
  summaryError: string | null;
  summaryMonths: SummaryMonthOption[];
  selectedSummaryMonth: string | null;
  selectedSummaryMonthLabel: string | null;
  selectedSummary: StudentSummary | null;
  isSummaryModalOpen: boolean;
  fetchSummaries: (monthOverride?: string | null) => Promise<void>;
  handleSummaryMonthChange: (newMonth: string) => void;
  openSummaryModal: (summary: StudentSummary) => void;
  closeSummaryModal: () => void;
}

export function useSummaryData(): UseSummaryDataReturn {
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryMonths, setSummaryMonths] = useState<SummaryMonthOption[]>([]);
  const [selectedSummaryMonth, setSelectedSummaryMonth] = useState<
    string | null
  >(null);
  const summaryMonthRef = useRef<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<StudentSummary | null>(
    null,
  );
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const updateSelectedSummaryMonth = useCallback((value: string | null) => {
    summaryMonthRef.current = value;
    setSelectedSummaryMonth(value);
  }, []);

  const selectedSummaryMonthLabel = useMemo(() => {
    if (!selectedSummaryMonth) {
      return null;
    }
    const option = summaryMonths.find(
      (month) => month.key === selectedSummaryMonth,
    );
    return option?.label ?? null;
  }, [selectedSummaryMonth, summaryMonths]);

  const fetchSummaries = useCallback(
    async (monthOverride?: string | null) => {
      let fallbackRefetch: string | null = null;
      try {
        setSummaryLoading(true);
        setSummaryError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          console.error("No token found");
          setSummaryError(
            "Token admin tidak ditemukan. Silakan login kembali.",
          );
          setSummaries([]);
          return;
        }
        const monthToFetch =
          monthOverride ?? summaryMonthRef.current ?? undefined;
        const endpoint = monthToFetch
          ? `/api/admin/kegiatan/summary?month=${encodeURIComponent(
              monthToFetch,
            )}`
          : "/api/admin/kegiatan/summary";
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Gagal memuat rangkuman");
        }
        const data = await response.json();
        setSummaries(data.summaries || []);
        setSummaryMonths(data.availableMonths || []);
        if (monthOverride === undefined) {
          if (!summaryMonthRef.current) {
            const fallbackMonth =
              data.selectedMonth || data.availableMonths?.[0]?.key || null;
            if (fallbackMonth) {
              updateSelectedSummaryMonth(fallbackMonth);
            }
          } else if (
            summaryMonthRef.current &&
            data.availableMonths &&
            data.availableMonths.length > 0 &&
            !data.availableMonths.some(
              (option: SummaryMonthOption) =>
                option.key === summaryMonthRef.current,
            )
          ) {
            const fallbackMonth = data.availableMonths[0].key;
            fallbackRefetch = fallbackMonth;
            updateSelectedSummaryMonth(fallbackMonth);
          }
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
        setSummaryError(
          error instanceof Error ? error.message : "Terjadi kesalahan",
        );
        setSummaries([]);
      } finally {
        setSummaryLoading(false);
        if (fallbackRefetch) {
          void fetchSummaries(fallbackRefetch);
        }
      }
    },
    [updateSelectedSummaryMonth],
  );

  const openSummaryModal = useCallback((summary: StudentSummary) => {
    setSelectedSummary(summary);
    setIsSummaryModalOpen(true);
  }, []);

  const closeSummaryModal = useCallback(() => {
    setIsSummaryModalOpen(false);
    setSelectedSummary(null);
  }, []);

  const handleSummaryMonthChange = useCallback(
    (newMonth: string) => {
      if (!newMonth || newMonth === summaryMonthRef.current) {
        return;
      }
      if (isSummaryModalOpen) {
        closeSummaryModal();
      }
      updateSelectedSummaryMonth(newMonth);
      fetchSummaries(newMonth);
    },
    [
      isSummaryModalOpen,
      closeSummaryModal,
      updateSelectedSummaryMonth,
      fetchSummaries,
    ],
  );

  // Initial fetch + polling
  useEffect(() => {
    fetchSummaries();

    const summaryInterval = setInterval(() => {
      fetchSummaries();
    }, 60000);

    return () => {
      clearInterval(summaryInterval);
    };
  }, [fetchSummaries]);

  return {
    summaries,
    summaryLoading,
    summaryError,
    summaryMonths,
    selectedSummaryMonth,
    selectedSummaryMonthLabel,
    selectedSummary,
    isSummaryModalOpen,
    fetchSummaries,
    handleSummaryMonthChange,
    openSummaryModal,
    closeSummaryModal,
  };
}
