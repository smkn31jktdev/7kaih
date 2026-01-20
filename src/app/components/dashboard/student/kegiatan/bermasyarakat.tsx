"use client";

import { Users, Check } from "lucide-react";
import Select from "@/app/components/Select";
import { TimePicker } from "@/app/components/TimePicker";
import { BERMASYARAKAT_OPTIONS } from "../const/masyarakat";

interface BermasyarakatData {
  deskripsi: string;
  tempat: string;
  waktu: string;
  paraf: boolean;
}

interface BermasyarakatSectionProps {
  data: BermasyarakatData;
  onChange: (data: BermasyarakatData) => void;
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

export default function BermasyarakatSection({
  data,
  onChange,
  onSave,
}: BermasyarakatSectionProps) {
  return (
    <SectionCard title="Bermasyarakat" icon={Users}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Jenis Kegiatan
          </label>
          <Select
            value={data.deskripsi}
            onChange={(val) =>
              onChange({
                ...data,
                deskripsi: val,
              })
            }
            options={BERMASYARAKAT_OPTIONS}
            placeholder="Pilih kegiatan sosial..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Tempat Kegiatan
          </label>
          <input
            type="text"
            value={data.tempat}
            onChange={(e) =>
              onChange({
                ...data,
                tempat: e.target.value,
              })
            }
            placeholder="Masjid, Balai Warga, dll"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Waktu Pelaksanaan
          </label>
          <TimePicker
            value={data.waktu}
            onChange={(val) =>
              onChange({
                ...data,
                waktu: val,
              })
            }
            placeholder="00:00"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 pt-4">
        {/* Paraf Checkbox - Improved Mobile View */}
        <label className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[var(--secondary)]/40 hover:bg-[var(--secondary)]/5 transition-all cursor-pointer w-full group">
          <div
            className={`w-6 h-6 mt-0.5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              data.paraf
                ? "bg-[var(--secondary)] border-[var(--secondary)] scale-110"
                : "bg-white border-gray-300 group-hover:border-[var(--secondary)]/50"
            }`}
          >
            {data.paraf && <Check className="w-4 h-4 text-white" />}
          </div>
          <input
            type="checkbox"
            className="hidden"
            checked={data.paraf}
            onChange={(e) =>
              onChange({
                ...data,
                paraf: e.target.checked,
              })
            }
          />
          <div className="flex flex-col gap-1">
            <span
              className={`text-sm sm:text-base leading-relaxed ${data.paraf ? "text-[var(--secondary)] font-medium" : "text-gray-700"}`}
            >
              Saya menyatakan kegiatan ini diketahui oleh Orang Tua / Wali / RT
              setempat
            </span>
            <span className="text-xs text-gray-400">
              (Paraf Orang Tua/Wali diperlukan)
            </span>
          </div>
        </label>

        {/* Save Button */}
        <div className="w-full">
          <SaveButton onClick={onSave} />
        </div>
      </div>
    </SectionCard>
  );
}

export type { BermasyarakatData };
