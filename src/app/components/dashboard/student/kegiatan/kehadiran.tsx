"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ShieldAlert,
  Clock,
  FileText,
  CalendarOff,
} from "lucide-react";
import { useGeolocation } from "./daily/useGeolocation";
import { ReasonModal } from "./daily/ReasonModal";

export interface KehadiranData {
  status: "hadir" | "tidak_hadir" | "belum";
  waktuAbsen: string; // Format HH:mm:ss
  hari: string; // Nama hari (Senin-Jumat)
  alasanTidakHadir: string;
  koordinat: { latitude: number; longitude: number } | null;
  jarak: number | null;
  akurasi: number | null;
  verifiedAt: string;
}

// Helper: Check if a date string (YYYY-MM-DD) falls on Saturday or Sunday
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

// Helper: Get Indonesian day name
function getHariName(dateStr: string): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const date = new Date(dateStr + "T00:00:00");
  return days[date.getDay()];
}

interface KehadiranSectionProps {
  data: KehadiranData;
  onChange: (data: KehadiranData) => void;
  onSave: (data: KehadiranData) => void;
  tanggal: string;
}

export default function KehadiranSection({
  data,
  onChange,
  onSave,
  tanggal,
}: KehadiranSectionProps) {
  const {
    isInsideSchoolBounds,
    locationMessage,
    isLoadingLocation,
    verifyLocation,
    distance,
    accuracy,
    fakeGPSReport,
    coordinates,
  } = useGeolocation();

  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isToday = tanggal === new Date().toISOString().split("T")[0];

  const handleAbsenHadir = async () => {
    if (!isInsideSchoolBounds || fakeGPSReport?.isFake) return;
    if (isWeekend(tanggal)) return;
    setIsSubmitting(true);

    const now = new Date();
    // Record precise time with seconds (HH:mm:ss)
    const waktu = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const hari = getHariName(tanggal);

    const newData: KehadiranData = {
      status: "hadir",
      waktuAbsen: waktu,
      hari,
      alasanTidakHadir: "",
      koordinat: coordinates,
      jarak: distance ? Math.round(distance) : null,
      akurasi: accuracy ? Math.round(accuracy) : null,
      verifiedAt: now.toISOString(),
    };

    onChange(newData);
    onSave(newData);
    setIsSubmitting(false);
  };

  const handleAlasanSubmit = (reason: string) => {
    if (isWeekend(tanggal)) return;
    const now = new Date();
    // Record precise time with seconds (HH:mm:ss)
    const hari = getHariName(tanggal);
    const newData: KehadiranData = {
      status: "tidak_hadir",
      waktuAbsen: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      hari,
      alasanTidakHadir: reason,
      koordinat: coordinates,
      jarak: distance ? Math.round(distance) : null,
      akurasi: accuracy ? Math.round(accuracy) : null,
      verifiedAt: now.toISOString(),
    };

    onChange(newData);
    onSave(newData);
    setIsReasonModalOpen(false);
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case "hadir":
        return (
          <div className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Hadir
            </span>
          </div>
        );
      case "tidak_hadir":
        return (
          <div className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Izin / Sakit
            </span>
          </div>
        );
      default:
        return (
          <div className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
              Belum Absen
            </span>
          </div>
        );
    }
  };

  // If already submitted for this date
  if (data.status !== "belum") {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 tracking-tight">
              Kehadiran
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-4">
          {/* Status card */}
          <div
            className={`rounded-2xl p-4 ${
              data.status === "hadir"
                ? "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
                : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {data.status === "hadir" ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {data.status === "hadir"
                    ? "Kehadiran Terverifikasi"
                    : "Tidak Hadir"}
                </p>
                <p className="text-xs text-gray-500">
                  Absen pukul {data.waktuAbsen} WIB
                </p>
              </div>
            </div>

            {data.status === "hadir" && data.jarak !== null && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100/50 rounded-lg px-3 py-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  Jarak: {data.jarak}m dari sekolah • Akurasi: ±{data.akurasi}m
                </span>
              </div>
            )}

            {data.status === "tidak_hadir" && data.alasanTidakHadir && (
              <div className="bg-amber-100/50 rounded-lg px-3 py-2 text-xs text-amber-800">
                <span className="font-semibold">Alasan:</span>{" "}
                {data.alasanTidakHadir}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If the selected date is a weekend, show weekend notice
  const isWeekendDay = isWeekend(tanggal);
  if (isWeekendDay) {
    const dayName = getHariName(tanggal);
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <CalendarOff className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">
            Kehadiran
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
            <CalendarOff className="w-7 h-7 text-orange-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-[220px]">
            Hari <strong>{dayName}</strong> adalah hari libur. Absensi kehadiran
            tidak dicatat pada hari Sabtu dan Minggu.
          </p>
        </div>
      </div>
    );
  }

  // If not today, show info that attendance can only be done today
  if (!isToday) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 tracking-tight">
            Kehadiran
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 max-w-[200px]">
            Absensi kehadiran hanya bisa dilakukan pada{" "}
            <strong>hari ini</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 h-full">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${
                isInsideSchoolBounds && !fakeGPSReport?.isFake
                  ? "bg-emerald-100"
                  : "bg-[var(--secondary)]/10"
              }`}
            >
              {fakeGPSReport?.isFake ? (
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              ) : (
                <MapPin
                  className={`w-5 h-5 ${isInsideSchoolBounds ? "text-emerald-600" : "text-[var(--secondary)]"}`}
                />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-800 tracking-tight shrink-0">
              Kehadiran
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-4">
          {/* Live time indicator */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-500">
                Waktu Saat Ini
              </span>
            </div>
            <span className="text-sm font-bold text-gray-800 font-mono tabular-nums">
              {currentTime} WIB
            </span>
          </div>

          {/* Location status */}
          <div
            className={`rounded-2xl p-4 transition-all duration-300 ${
              isLoadingLocation
                ? "bg-blue-50 border border-blue-100"
                : fakeGPSReport?.isFake
                  ? "bg-rose-50 border border-rose-200"
                  : isInsideSchoolBounds
                    ? "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100"
                    : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : fakeGPSReport?.isFake ? (
                  <XCircle className="w-5 h-5 text-rose-500" />
                ) : isInsideSchoolBounds ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isLoadingLocation
                      ? "text-blue-700"
                      : fakeGPSReport?.isFake
                        ? "text-rose-700"
                        : isInsideSchoolBounds
                          ? "text-emerald-700"
                          : "text-amber-700"
                  }`}
                >
                  {isLoadingLocation
                    ? "Memverifikasi Lokasi..."
                    : fakeGPSReport?.isFake
                      ? "Lokasi Palsu Terdeteksi!"
                      : isInsideSchoolBounds
                        ? "Lokasi Terverifikasi ✓"
                        : "Di Luar Area Sekolah"}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {locationMessage}
                </p>
              </div>
            </div>

            {/* Fake GPS detail */}
            {fakeGPSReport?.isFake && (
              <div className="mt-3 bg-rose-100/50 rounded-lg p-3">
                <p className="text-xs font-bold text-rose-700 mb-1">
                  Alasan Deteksi:
                </p>
                <ul className="space-y-1">
                  {fakeGPSReport.reasons.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-rose-600 flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={verifyLocation}
            disabled={isLoadingLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-xs font-medium hover:border-[var(--secondary)] hover:text-[var(--secondary)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingLocation ? "animate-spin" : ""}`}
            />
            Perbarui Lokasi
          </button>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            {/* Absen hadir button */}
            <button
              type="button"
              onClick={handleAbsenHadir}
              disabled={
                !isInsideSchoolBounds ||
                isLoadingLocation ||
                isSubmitting ||
                !!fakeGPSReport?.isFake
              }
              className="w-full group relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Absen Hadir</span>
            </button>

            {/* Tidak hadir button */}
            <button
              type="button"
              onClick={() => setIsReasonModalOpen(true)}
              disabled={isLoadingLocation || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-600 font-semibold text-sm border-2 border-gray-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Tidak Hadir (Isi Alasan)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reason Modal */}
      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={() => setIsReasonModalOpen(false)}
        onSubmit={handleAlasanSubmit}
      />
    </>
  );
}
