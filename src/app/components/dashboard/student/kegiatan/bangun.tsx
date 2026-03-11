"use client";

import { Sun } from "lucide-react";
import { TimePicker } from "@/app/components/TimePicker";

interface BangunPagiData {
  jam: string;
  membacaDanBangunTidur: boolean;
}

interface BangunSectionProps {
  data: BangunPagiData;
  onChange: (data: BangunPagiData) => void;
  onSave: () => void;
}

// Reusable Section Card
const SectionCard = ({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 flex flex-col ${className}`}
  >
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50 shrink-0">
      <div className="w-10 h-10 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 tracking-tight">
        {title}
      </h3>
    </div>
    <div className="flex flex-col flex-1">{children}</div>
  </div>
);

// Save Button Component
const SaveButton = ({
  onClick,
  label = "Simpan Data",
}: {
  onClick: () => void;
  label?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full mt-2 group relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--secondary)] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[var(--secondary)]/20 active:scale-[0.98] cursor-pointer"
  >
    <span>{label}</span>
  </button>
);

export default function BangunSection({
  data,
  onChange,
  onSave,
}: BangunSectionProps) {
  return (
    <SectionCard title="Bangun Pagi" icon={Sun} className="h-full">
      <div className="space-y-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Waktu Bangun
          </label>
          <TimePicker
            value={data.jam}
            onChange={(value) =>
              onChange({
                ...data,
                jam: value,
              })
            }
            placeholder="00:00"
          />
        </div>
        <div className="pt-2">
          <span className="block text-xs font-medium text-gray-500 mb-2">
            Membaca Doa?
          </span>
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <label key={`bangun-${val}`} className="cursor-pointer">
                <input
                  type="radio"
                  className="hidden peer"
                  checked={data.membacaDanBangunTidur === val}
                  onChange={() =>
                    onChange({
                      ...data,
                      membacaDanBangunTidur: val,
                    })
                  }
                />
                <div className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 peer-checked:bg-orange-50 peer-checked:text-orange-600 peer-checked:border-orange-200 transition-all">
                  {val ? "Ya" : "Tidak"}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <SaveButton onClick={onSave} />
      </div>
    </SectionCard>
  );
}

export type { BangunPagiData };
