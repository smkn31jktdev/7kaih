"use client";

import { Dumbbell, Clock, Check } from "lucide-react";
import Select from "@/app/components/Select";
import { OLAGRAGA_OPTIONS, OLAGRAGA_DESKRIPSI_MAP } from "../const/olahraga";

interface OlahragaData {
  jenisOlahraga: string;
  deskripsi: string;
  waktu: string;
}

interface OlahragaSectionProps {
  data: OlahragaData;
  onChange: (data: OlahragaData) => void;
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
    className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
      <div className="w-10 h-10 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 tracking-tight">
        {title}
      </h3>
    </div>
    <div className="space-y-5">{children}</div>
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

export default function OlahragaSection({
  data,
  onChange,
  onSave,
}: OlahragaSectionProps) {
  const handleJenisChange = (val: string) => {
    onChange({
      ...data,
      jenisOlahraga: val,
      deskripsi: OLAGRAGA_DESKRIPSI_MAP[val] || "",
    });
  };

  return (
    <SectionCard title="Olahraga" icon={Dumbbell} className="h-full">
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Aktivitas Fisik
          </label>
          <Select
            value={data.jenisOlahraga}
            onChange={handleJenisChange}
            options={OLAGRAGA_OPTIONS}
            placeholder="Pilih aktivitas..."
          />
          {data.jenisOlahraga === "lainnya" && (
            <input
              type="text"
              value={data.deskripsi}
              onChange={(e) =>
                onChange({
                  ...data,
                  deskripsi: e.target.value,
                })
              }
              placeholder="Sebutkan olahraga lainnya..."
              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Durasi (Menit)
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="number"
              min="0"
              value={data.waktu}
              onChange={(e) =>
                onChange({
                  ...data,
                  waktu: e.target.value,
                })
              }
              placeholder="30"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
            />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <SaveButton onClick={onSave} />
      </div>
    </SectionCard>
  );
}

export type { OlahragaData };
