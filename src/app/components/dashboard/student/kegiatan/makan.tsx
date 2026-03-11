"use client";

import { Utensils, HelpCircle } from "lucide-react";
import Select from "@/app/components/Select";
import { MAKANAN_OPTIONS } from "../const/makan";

interface MakanSehatData {
  jenisMakanan: string;
  jenisLaukSayur: string;
  makanSayurAtauBuah: boolean;
  minumSuplemen: boolean;
}

interface MakanSectionProps {
  data: MakanSehatData;
  onChange: (data: MakanSehatData) => void;
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

export default function MakanSection({
  data,
  onChange,
  onSave,
}: MakanSectionProps) {
  return (
    <SectionCard title="Makan Sehat" icon={Utensils} className="h-full">
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Makanan Utama
          </label>
          <Select
            value={data.jenisMakanan}
            onChange={(val) =>
              onChange({
                ...data,
                jenisMakanan: val,
              })
            }
            options={MAKANAN_OPTIONS}
            placeholder="Pilih waktu makan..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Lauk Pauk
          </label>
          <input
            type="text"
            value={data.jenisLaukSayur}
            onChange={(e) =>
              onChange({
                ...data,
                jenisLaukSayur: e.target.value,
              })
            }
            placeholder="Ayam, Tahu, Sayur..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Sayur / Buah?</span>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <label key={`sb-${val}`} className="cursor-pointer">
                  <input
                    type="radio"
                    className="hidden peer"
                    checked={data.makanSayurAtauBuah === val}
                    onChange={() =>
                      onChange({
                        ...data,
                        makanSayurAtauBuah: val,
                      })
                    }
                  />
                  <span className="px-2 py-1 rounded text-xs font-medium text-gray-500 peer-checked:bg-white peer-checked:text-pink-600 peer-checked:shadow-sm transition-all">
                    {val ? "Ya" : "Tidak"}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-700">Susu / Suplemen?</span>
              <span title="Pilih YA jika salah satu atau keduanya terpenuhi.">
                <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
              </span>
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <label key={`sup-${val}`} className="cursor-pointer">
                  <input
                    type="radio"
                    className="hidden peer"
                    checked={data.minumSuplemen === val}
                    onChange={() =>
                      onChange({
                        ...data,
                        minumSuplemen: val,
                      })
                    }
                  />
                  <span className="px-2 py-1 rounded text-xs font-medium text-gray-500 peer-checked:bg-white peer-checked:text-pink-600 peer-checked:shadow-sm transition-all">
                    {val ? "Ya" : "Tidak"}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <SaveButton onClick={onSave} />
      </div>
    </SectionCard>
  );
}

export type { MakanSehatData };
