"use client";

import { Gift, Heart, Users, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import calendarData from "@/app/server/data/calendar.json";

interface EidSectionProps {
  currentDate: string;
}

const EID_COLOR = "#2AAF2D";

const getEidDataForDate = (date: Date | string) => {
  const checkDate = typeof date === "string" ? new Date(date) : date;
  const yearToCheck = checkDate.getFullYear();

  const ramadanData = calendarData.ramadan.find(
    (r) => r.gregorian_year === yearToCheck,
  );

  if (!ramadanData) {
    return {
      eid_date: "2026-03-20",
      hijri_year: 1447,
    };
  }

  return {
    eid_date: ramadanData.eid_date,
    hijri_year: ramadanData.hijri_year,
  };
};

export const isEidDay = (date: string): boolean => {
  const eidData = getEidDataForDate(date);
  return date === eidData.eid_date;
};

const getEidHijriYear = (date: string): number => {
  const eidData = getEidDataForDate(date);
  return eidData.hijri_year;
};

export default function EidSection({ currentDate }: EidSectionProps) {
  if (!isEidDay(currentDate)) {
    return null;
  }

  const hijriYear = getEidHijriYear(currentDate);

  return (
    <div className="relative overflow-hidden mb-6 sm:mb-8">
      <div
        className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${EID_COLOR} 0%, #23962A 50%, #1B7A21 100%)`,
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 sm:w-80 sm:h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-yellow-400/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-2xl" />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Star
            className="absolute w-3 sm:w-4 h-3 sm:h-4 text-yellow-300/60 top-4 sm:top-6 right-10 sm:right-16"
            fill="currentColor"
          />
          <Star
            className="absolute w-2 sm:w-3 h-2 sm:h-3 text-white/40 top-8 sm:top-12 right-20 sm:right-32 hidden sm:block"
            fill="currentColor"
            style={{ animationDelay: "0.5s" }}
          />
          <Star
            className="absolute w-4 sm:w-5 h-4 sm:h-5 text-yellow-200/50 bottom-6 sm:bottom-8 right-8 sm:right-12"
            fill="currentColor"
            style={{ animationDelay: "1s" }}
          />
          <Star
            className="absolute w-2 sm:w-3 h-2 sm:h-3 text-white/50 top-12 sm:top-16 left-1/4 hidden sm:block"
            fill="currentColor"
            style={{ animationDelay: "0.3s" }}
          />
          <Sparkles
            className="absolute w-4 sm:w-6 h-4 sm:h-6 text-yellow-300/40 bottom-8 sm:bottom-12 left-10 sm:left-16 hidden sm:block"
            style={{ animationDelay: "0.7s" }}
          />
          <Sparkles
            className="absolute w-3 sm:w-4 h-3 sm:h-4 text-white/30 top-6 sm:top-8 left-1/3 hidden md:block"
            style={{ animationDelay: "1.2s" }}
          />
        </div>

        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-25 sm:opacity-30">
          <Image
            src="/assets/svg/ketupat.svg"
            alt="Ketupat"
            width={50}
            height={50}
            className="w-12 h-12 sm:w-20 sm:h-20 drop-shadow-lg"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg overflow-hidden flex-shrink-0">
              <Image
                src="/assets/svg/ketupat.svg"
                alt="Ketupat"
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                Selamat Hari Raya Idul Fitri
              </h2>
              <p className="text-white/80 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">
                1 Syawwal {hijriYear} Hijriyah
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 border border-white/15 mb-4 sm:mb-6 w-full sm:inline-block">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 font-arabic leading-relaxed text-center sm:text-left">
              تَقَبَّلَ اللهُ مِنَّا وَمِنْكُمْ
            </p>
            <p className="text-white/90 text-xs sm:text-sm mt-1.5 sm:mt-2 italic text-center sm:text-left">
              &quot;Taqabbalallahu Minna Wa Minkum&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs sm:text-sm truncate">
                  Mohon Maaf
                </p>
                <p className="text-white/70 text-[11px] sm:text-xs truncate">
                  Lahir dan Batin
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs sm:text-sm truncate">
                  Silaturahmi
                </p>
                <p className="text-white/70 text-[11px] sm:text-xs truncate">
                  Mempererat Persaudaraan
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-xs sm:text-sm truncate">
                  Berbagi
                </p>
                <p className="text-white/70 text-[11px] sm:text-xs truncate">
                  Kebahagiaan Bersama
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/15">
            <p className="text-white/90 text-center text-xs sm:text-sm md:text-base leading-relaxed px-2">
              Selamat merayakan kemenangan setelah sebulan penuh berpuasa.
              <br className="hidden sm:inline" />
              <span className="inline sm:hidden"> </span>
              Semoga amal ibadah kita diterima oleh Allah SWT.
            </p>
          </div>
        </div>
      </div>

      <div
        className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border flex items-start gap-2.5 sm:gap-3"
        style={{
          backgroundColor: `${EID_COLOR}08`,
          borderColor: `${EID_COLOR}20`,
        }}
      >
        <div
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: `${EID_COLOR}15` }}
        >
          <Image
            src="/assets/svg/mosque.svg"
            alt="Mosque"
            width={20}
            height={20}
            className="w-5 h-5 sm:w-6 sm:h-6 opacity-80"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs sm:text-sm font-semibold"
            style={{ color: EID_COLOR }}
          >
            Hari ini adalah Hari Raya Idul Fitri!
          </p>
          <p
            className="text-[11px] sm:text-xs mt-1 leading-relaxed"
            style={{ color: `${EID_COLOR}CC` }}
          >
            Jangan lupa untuk menunaikan Sholat Ied berjamaah dan bersilaturahmi
            dengan keluarga serta kerabat. Semoga kita semua kembali fitri
            seperti bayi baru lahir.
          </p>
        </div>
      </div>
    </div>
  );
}
