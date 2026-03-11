"use client";

import { MoveRight, Search, Filter, Users } from "lucide-react";
import type { BermasyarakatStudent } from "./types";

interface BermasyarakatStudentListProps {
  students: BermasyarakatStudent[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectStudent: (student: BermasyarakatStudent) => void;
}

export default function BermasyarakatStudentList({
  students,
  searchQuery,
  onSearchChange,
  onSelectStudent,
}: BermasyarakatStudentListProps) {
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

  return (
    <>
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--secondary)]">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Bermasyarakat
            </h1>
            <p className="text-gray-500">
              Rekapitulasi aktivitas sosial dan bermasyarakat siswa.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
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
              Total: <strong>{filteredStudents.length}</strong> Siswa
            </span>
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="w-16 h-16 mb-4 opacity-20" />
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
          )}
        </div>
      </div>
    </>
  );
}
