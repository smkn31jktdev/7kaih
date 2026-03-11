"use client";

import { MoveRight, Search, Filter, HandCoins, Moon } from "lucide-react";
import Select from "@/app/components/Select";
import type {
  BeribadahStudent,
  RamadhanStudent,
  RamadhanPeriod,
  AvailableYear,
  ViewMode,
} from "./types";
import { RAMADHAN_COLOR, getRatingColor } from "./types";

interface BeribadahStudentListProps {
  // Common
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  error: string | null;

  // Regular
  students: BeribadahStudent[];
  onSelectStudent: (student: BeribadahStudent) => void;

  // Ramadhan
  ramadhanStudents: RamadhanStudent[];
  onSelectRamadhanStudent: (student: RamadhanStudent) => void;
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: AvailableYear[];
  period: RamadhanPeriod | null;
}

export default function BeribadahStudentList({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  error,
  students,
  onSelectStudent,
  ramadhanStudents,
  onSelectRamadhanStudent,
  selectedYear,
  onYearChange,
  availableYears,
  period,
}: BeribadahStudentListProps) {
  const filteredStudents = searchQuery
    ? students.filter((s) => {
        const lower = searchQuery.toLowerCase();
        return (
          s.nama.toLowerCase().includes(lower) ||
          s.nisn.includes(lower) ||
          s.kelas.toLowerCase().includes(lower)
        );
      })
    : students;

  const filteredRamadhanStudents = searchQuery
    ? ramadhanStudents.filter((s) => {
        const lower = searchQuery.toLowerCase();
        return (
          s.nama.toLowerCase().includes(lower) ||
          s.nisn.includes(lower) ||
          s.kelas.toLowerCase().includes(lower)
        );
      })
    : ramadhanStudents;

  return (
    <>
      {/* Header Card with Tabs */}
      <div
        className={`rounded-3xl p-6 shadow-sm border overflow-hidden relative transition-all duration-300 ${
          viewMode === "ramadhan" ? "text-white" : "bg-white text-gray-800"
        }`}
        style={
          viewMode === "ramadhan"
            ? {
                background: `linear-gradient(135deg, ${RAMADHAN_COLOR} 0%, #15936A 50%, #0F7A57 100%)`,
              }
            : {}
        }
      >
        {viewMode === "ramadhan" && (
          <>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-4 right-6 opacity-20">
              <Moon className="w-16 h-16 text-yellow-200" fill="currentColor" />
            </div>
          </>
        )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                viewMode === "ramadhan"
                  ? "bg-white/20 backdrop-blur-sm border border-white/25"
                  : "bg-[var(--secondary)]/10 text-[var(--secondary)]"
              }`}
            >
              {viewMode === "ramadhan" ? (
                <Moon className="w-8 h-8 text-yellow-300" />
              ) : (
                <HandCoins className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {viewMode === "ramadhan" ? "Ibadah Ramadhan" : "Beribadah"}
              </h1>
              <p
                className={
                  viewMode === "ramadhan" ? "text-white/80" : "text-gray-500"
                }
              >
                {viewMode === "ramadhan"
                  ? period
                    ? `Ramadhan ${period.hijriYear} H (${period.startDate} s/d ${period.endDate})`
                    : "Rekapitulasi ibadah Ramadhan siswa"
                  : "Rekapitulasi aktivitas ibadah harian siswa."}
              </p>
            </div>
          </div>

          {/* Tab Switcher & Year Selector */}
          <div className="flex items-center gap-4">
            <div
              className={`flex rounded-xl p-1 ${
                viewMode === "ramadhan"
                  ? "bg-white/15 backdrop-blur-sm border border-white/15"
                  : "bg-gray-100"
              }`}
            >
              <button
                onClick={() => onViewModeChange("harian")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === "harian"
                    ? "bg-white text-[var(--secondary)] shadow-sm"
                    : viewMode === "ramadhan"
                      ? "text-white/70 hover:text-white"
                      : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="hidden sm:inline">Ibadah </span>Harian
              </button>
              <button
                onClick={() => onViewModeChange("ramadhan")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "ramadhan"
                    ? "bg-white text-[#1AAC7A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Moon className="w-4 h-4" />
                Ramadhan
              </button>
            </div>

            {/* Year Selector for Ramadhan */}
            {viewMode === "ramadhan" && availableYears.length > 0 && (
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/15">
                <Select
                  value={String(selectedYear)}
                  onChange={(val) => onYearChange(Number(val))}
                  options={availableYears.map((y) => ({
                    value: String(y.gregorianYear),
                    label: `${y.hijriYear} H / ${y.gregorianYear} M`,
                  }))}
                  placeholder="Pilih Tahun"
                  className="min-w-[180px] text-sm !bg-transparent !text-white !border-white/30"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari siswa berdasarkan nama atau NISN..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>
              Total:{" "}
              <strong>
                {viewMode === "harian"
                  ? filteredStudents.length
                  : filteredRamadhanStudents.length}
              </strong>{" "}
              Siswa
            </span>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[600px] overflow-y-auto">
          {viewMode === "harian" ? (
            // ========== Regular Beribadah List ==========
            filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <HandCoins className="w-16 h-16 mb-4 opacity-20" />
                <p>Tidak ada data siswa ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1">
                {filteredStudents.map((student) => (
                  <div
                    key={student.nisn}
                    className={`group flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-all cursor-pointer border-b border-gray-100 last:border-0`}
                    onClick={() => onSelectStudent(student)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg group-hover:bg-[var(--secondary)] group-hover:text-white transition-colors">
                        {student.nama.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-[var(--secondary)] transition-colors">
                          {student.nama}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                            {student.kelas || "Tanpa Kelas"}
                          </span>
                          <span>•</span>
                          <span>{student.nisn}</span>
                          <span>•</span>
                          <span>{student.entries.length} Catatan</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[var(--secondary)] hover:border-[var(--secondary)] hover:bg-[var(--secondary)]/5 transition-all">
                        <MoveRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : // ========== Ramadhan List ==========
          filteredRamadhanStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Moon className="w-16 h-16 mb-4 opacity-20" />
              <p>Belum ada data ibadah Ramadhan untuk periode ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {filteredRamadhanStudents.map((student) => (
                <div
                  key={student.nisn}
                  className="group flex items-center justify-between p-4 md:p-6 hover:bg-gray-50 transition-all cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => onSelectRamadhanStudent(student)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: RAMADHAN_COLOR }}
                    >
                      {student.nama.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#1AAC7A] transition-colors">
                        {student.nama}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                          {student.kelas || "Tanpa Kelas"}
                        </span>
                        <span>•</span>
                        <span>{student.nisn}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRatingColor(student.summary.tarawihWitirRating)}`}
                      >
                        Tarawih: {student.summary.totalTarawihWitir} malam
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getRatingColor(student.summary.puasaRating)}`}
                      >
                        Puasa: {student.summary.totalPuasa} hari
                      </span>
                    </div>
                    <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1AAC7A] hover:border-[#1AAC7A] hover:bg-[#1AAC7A]/5 transition-all">
                      <MoveRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
