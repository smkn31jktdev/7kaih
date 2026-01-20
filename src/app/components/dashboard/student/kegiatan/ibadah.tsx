"use client";

import { HandCoins, HelpCircle, Check } from "lucide-react";
import {
  BeribadahForm,
  BeribadahBooleanKey,
  BERIBADAH_BOOLEAN_FIELDS,
} from "../const/ibadah";
import { RamadhanForm, isRamadhanPeriod } from "../const/ramadhan/ramadhan";
import RamadhanSection from "./ramadhan/ramadhan";
import EidSection, { isEidDay } from "./eid/eid";

interface IbadahSectionProps {
  data: BeribadahForm;
  ramadhanData?: RamadhanForm;
  currentDate: string;
  onChange: (data: BeribadahForm) => void;
  onRamadhanChange?: (data: RamadhanForm) => void;
  onSave: () => void;
}

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

export default function IbadahSection({
  data,
  ramadhanData,
  currentDate,
  onChange,
  onRamadhanChange,
  onSave,
}: IbadahSectionProps) {
  const handleBooleanChange = (key: BeribadahBooleanKey, checked: boolean) => {
    onChange({
      ...data,
      [key]: checked,
    });
  };

  const isRamadhan = isRamadhanPeriod(currentDate);
  const isEid = isEidDay(currentDate);

  return (
    <SectionCard
      title="Beribadah"
      icon={HandCoins}
      className="border-t-4 border-t-[var(--secondary)]"
    >
      {/* Eid Al-Fitr Section - Only visible on Eid day */}
      {isEid && <EidSection currentDate={currentDate} />}

      <div className="bg-blue-50/50 rounded-xl p-4 mb-6 border border-blue-100 flex gap-3 text-sm text-blue-800 items-start">
        <HelpCircle className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
        <p>
          Tanda <strong>*</strong> wajib diisi oleh siswa muslim. Wanita haid
          tetap dihitung melaksanakan.
        </p>
      </div>

      {/* Ramadhan Section - Only visible during Ramadhan period */}
      {isRamadhan && ramadhanData && onRamadhanChange && (
        <div className="mb-8">
          <RamadhanSection
            data={ramadhanData}
            onChange={onRamadhanChange}
            currentDate={currentDate}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BERIBADAH_BOOLEAN_FIELDS.map((item) => (
          <label
            key={item.key}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-md ${
              data[item.key]
                ? "bg-[var(--secondary)]/5 border-[var(--secondary)]/30 shadow-sm"
                : "bg-white border-gray-200 hover:border-[var(--secondary)]/30 hover:bg-gray-50"
            }`}
          >
            <div
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                data[item.key]
                  ? "bg-[var(--secondary)] border-[var(--secondary)] text-white"
                  : "bg-white border-gray-300 group-hover:border-[var(--secondary)]"
              }`}
            >
              {data[item.key] && <Check className="w-3 h-3" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={data[item.key]}
              onChange={(e) => handleBooleanChange(item.key, e.target.checked)}
            />
            <span
              className={`${
                data[item.key]
                  ? "text-[var(--secondary)] font-semibold"
                  : "text-gray-600"
              } text-sm leading-tight select-none`}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Infaq / Sedekah
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Masukkan nominal rupiah jika anda bersedekah hari ini
          </p>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-400 text-sm font-semibold">
              Rp
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              value={data.zakatInfaqSedekah}
              onChange={(e) =>
                onChange({
                  ...data,
                  zakatInfaqSedekah: e.target.value,
                })
              }
              placeholder="0"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm font-medium placeholder:text-gray-300"
            />
          </div>
        </div>
        <div className="flex items-end justify-end h-full">
          <div className="w-full md:w-auto">
            <SaveButton onClick={onSave} label="Simpan Data Ibadah" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
