"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import Select from "@/app/components/Select";
import { BELAJAR_OPTIONS } from "../const/belajar";

interface BelajarData {
  yaAtauTidak: boolean;
  deskripsi: string;
}

interface BelajarSectionProps {
  data: BelajarData;
  onChange: (data: BelajarData) => void;
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

export default function BelajarSection({
  data,
  onChange,
  onSave,
}: BelajarSectionProps) {
  // Check if current description is a custom one
  const isCustom =
    data.deskripsi !== "" &&
    !BELAJAR_OPTIONS.some((opt) => opt.value === data.deskripsi);

  const [showLainnya, setShowLainnya] = useState(
    isCustom || data.deskripsi === "Lainnya",
  );

  // Sync state if form data changes externally
  useEffect(() => {
    const custom =
      data.deskripsi !== "" &&
      !BELAJAR_OPTIONS.some((opt) => opt.value === data.deskripsi);

    if (custom) {
      setShowLainnya(true);
    } else if (data.deskripsi !== "Lainnya" && data.deskripsi !== "") {
      setShowLainnya(false);
    }
  }, [data.deskripsi]);

  return (
    <SectionCard title="Belajar Mandiri" icon={BookOpen} className="h-full">
      <div className="space-y-6 flex-1">
        <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 text-center">
          <span className="block text-sm font-medium text-gray-800 mb-3">
            Belajar mandiri hari ini?
          </span>
          <div className="flex justify-center gap-4">
            {[true, false].map((val) => (
              <label
                key={`bel-${val}`}
                className="flex items-center gap-2 cursor-pointer group px-4 py-2 bg-white rounded-lg border border-orange-100 shadow-sm hover:border-orange-300 transition-all"
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    data.yaAtauTidak === val
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {data.yaAtauTidak === val && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  checked={data.yaAtauTidak === val}
                  onChange={() =>
                    onChange({
                      ...data,
                      yaAtauTidak: val,
                    })
                  }
                />
                <span className="text-sm text-gray-600 font-medium">
                  {val ? "Ya" : "Tidak"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {data.yaAtauTidak && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Materi
              </label>
              <Select
                value={
                  showLainnya &&
                  data.deskripsi !== "" &&
                  !BELAJAR_OPTIONS.some((o) => o.value === data.deskripsi)
                    ? "Lainnya"
                    : data.deskripsi
                }
                onChange={(val) => {
                  if (val === "Lainnya") {
                    setShowLainnya(true);
                    onChange({ ...data, deskripsi: "Lainnya" });
                  } else {
                    setShowLainnya(false);
                    onChange({ ...data, deskripsi: val });
                  }
                }}
                options={BELAJAR_OPTIONS}
                placeholder="Topik belajar..."
              />
            </div>

            {showLainnya && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <input
                  type="text"
                  value={data.deskripsi === "Lainnya" ? "" : data.deskripsi}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      deskripsi: e.target.value,
                    })
                  }
                  placeholder="Tuliskan materi belajar..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        <SaveButton onClick={onSave} />
      </div>
    </SectionCard>
  );
}

export type { BelajarData };
