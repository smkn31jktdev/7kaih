"use client";

import { Star, Check, Moon } from "lucide-react";
import {
  RamadhanForm,
  RamadhanBooleanKey,
  RAMADHAN_BOOLEAN_FIELDS,
  getRamadhanDay,
  getRamadhanDaysRemaining,
  getHijriYearForDate,
} from "../../const/ramadhan/ramadhan";

interface RamadhanSectionProps {
  data: RamadhanForm;
  onChange: (data: RamadhanForm) => void;
  currentDate: string;
}

const RAMADHAN_COLOR = "#1AAC7A";

export default function RamadhanSection({
  data,
  onChange,
  currentDate,
}: RamadhanSectionProps) {
  const handleBooleanChange = (key: RamadhanBooleanKey, checked: boolean) => {
    onChange({
      ...data,
      [key]: checked,
    });
  };

  const ramadhanDay = getRamadhanDay(currentDate);
  const daysRemaining = getRamadhanDaysRemaining(currentDate);
  const hijriYear = getHijriYearForDate(currentDate);

  return (
    <div className="relative overflow-hidden">
      <div
        className="relative rounded-xl md:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${RAMADHAN_COLOR} 0%, #15936A 50%, #0F7A57 100%)`,
        }}
      >
        <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-yellow-400/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="absolute inset-0 pointer-events-none hidden sm:block">
          <Star
            className="absolute w-2 sm:w-3 h-2 sm:h-3 text-yellow-300/50 top-4 right-8 sm:right-12"
            fill="currentColor"
          />
          <Star
            className="absolute w-1.5 sm:w-2 h-1.5 sm:h-2 text-white/40 top-8 right-16 sm:right-24"
            fill="currentColor"
            style={{ animationDelay: "0.5s" }}
          />
          <Star
            className="absolute w-3 sm:w-4 h-3 sm:h-4 text-yellow-200/40 bottom-6 right-6 sm:right-8"
            fill="currentColor"
            style={{ animationDelay: "1s" }}
          />
          <Star
            className="absolute w-1.5 sm:w-2 h-1.5 sm:h-2 text-white/50 top-12 left-1/3"
            fill="currentColor"
            style={{ animationDelay: "0.3s" }}
          />
        </div>

        <div className="absolute top-2 sm:top-4 right-3 sm:right-6 opacity-20 sm:opacity-25">
          <div className="relative w-10 h-10 sm:w-16 sm:h-16">
            <Moon
              className="w-full h-full text-yellow-200"
              fill="currentColor"
            />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25 flex-shrink-0">
              <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight truncate">
                Ramadhan Mubarak
              </h3>
              <p className="text-white/80 text-xs sm:text-sm truncate">
                Ramadhan {hijriYear} H • Ibadah Khusus Bulan Suci
              </p>
            </div>
          </div>

          {ramadhanDay && (
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-white/15">
                <span className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wider block">
                  Hari Ke-
                </span>
                <p className="text-xl sm:text-2xl font-bold text-yellow-300">
                  {ramadhanDay}
                </p>
              </div>
              {daysRemaining && daysRemaining > 0 && (
                <div className="bg-white/15 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-white/15">
                  <span className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wider block">
                    Sisa Hari
                  </span>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {daysRemaining}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {RAMADHAN_BOOLEAN_FIELDS.map((item) => {
          const isChecked = data[item.key];

          return (
            <label
              key={item.key}
              className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all cursor-pointer group hover:shadow-md active:scale-[0.98] ${
                isChecked
                  ? "bg-[#1AAC7A]/10 border-[#1AAC7A]/30 shadow-sm"
                  : "bg-white border-gray-200 hover:border-[#1AAC7A]/30 hover:bg-gray-50"
              }`}
            >
              <div
                className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                  isChecked
                    ? "bg-[#1AAC7A] border-[#1AAC7A] text-white"
                    : "bg-white border-gray-300 group-hover:border-[#1AAC7A]"
                }`}
              >
                {isChecked && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="checkbox"
                  className="hidden"
                  checked={isChecked}
                  onChange={(e) =>
                    handleBooleanChange(item.key, e.target.checked)
                  }
                />
                <span
                  className={`${
                    isChecked
                      ? "text-[#1AAC7A] font-bold"
                      : "text-gray-700 font-semibold"
                  } text-xs sm:text-sm leading-tight select-none block mb-0.5 sm:mb-1`}
                >
                  {item.label}
                </span>
                <span className="text-[11px] sm:text-xs text-gray-500 leading-relaxed block">
                  {item.description}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
