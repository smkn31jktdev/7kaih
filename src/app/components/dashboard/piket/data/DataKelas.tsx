import { useState } from "react";
import { Users, CheckCircle2, XCircle, Clock } from "lucide-react";

interface StudentAttendance {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  status: "hadir" | "tidak_hadir" | "belum";
  waktuAbsen: string | null;
  alasanTidakHadir: string | null;
}

interface DataKelasProps {
  students: StudentAttendance[];
  searchQuery: string;
  dataLoading: boolean;
}

export default function DataKelas({
  students,
  searchQuery,
  dataLoading,
}: DataKelasProps) {
  const [activeTab, setActiveTab] = useState<"X" | "XI" | "XII">("X");
  const [activeJurusan, setActiveJurusan] = useState<string>("Semua");

  const jurusans = [
    "Semua",
    "Akuntansi",
    "Animasi",
    "Bisnis Ritel",
    "DKV",
    "Layanan Perbankan",
    "Manajemen Perkantoran",
  ];

  // Helper to determine the class level
  const getClassLevel = (kelasName: string) => {
    const upper = kelasName.toUpperCase();
    if (
      upper.startsWith("XII ") ||
      upper === "XII" ||
      upper.includes("-XII-") ||
      upper.includes("XII-")
    )
      return "XII";
    if (
      upper.startsWith("XI ") ||
      upper === "XI" ||
      upper.includes("-XI-") ||
      upper.includes("XI-")
    )
      return "XI";
    if (
      upper.startsWith("X ") ||
      upper === "X" ||
      upper.includes("-X-") ||
      upper.includes("X-")
    )
      return "X";
    return "X"; // fallback
  };

  const getJurusan = (kelasName: string) => {
    const upper = kelasName.toUpperCase();
    if (
      upper.includes("AKUNTANSI") ||
      upper.includes("AKL") ||
      upper.includes("AKT")
    )
      return "Akuntansi";
    if (upper.includes("ANIMASI")) return "Animasi";
    if (
      upper.includes("BISNIS") ||
      upper.includes("RITEL") ||
      upper.includes("BDP") ||
      upper.includes("BR")
    )
      return "Bisnis Ritel";
    if (
      upper.includes("DKV") ||
      upper.includes("DESAIN") ||
      upper.includes("KOMUNIKASI")
    )
      return "DKV";
    if (
      upper.includes("LAYANAN") ||
      upper.includes("PERBANKAN") ||
      upper.includes("LPS") ||
      upper.includes("PBK")
    )
      return "Layanan Perbankan";
    if (
      upper.includes("MANAJEMEN") ||
      upper.includes("PERKANTORAN") ||
      upper.includes("MPLB") ||
      upper.includes("OTKP")
    )
      return "Manajemen Perkantoran";
    return "Lainnya";
  };

  const filteredStudents = students.filter((student) => {
    const matchesLevel = getClassLevel(student.kelas) === activeTab;
    const matchesJurusan =
      activeJurusan === "Semua"
        ? true
        : getJurusan(student.kelas) === activeJurusan;
    const matchesSearch =
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesJurusan && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Filter Section */}
      <div className="bg-white border-b border-gray-100">
        {/* Kelas Tabs */}
        <div className="flex gap-2 p-4 pb-2 overflow-x-auto scrollbar-hide">
          {["X", "XI", "XII"].map((level) => (
            <button
              key={level}
              onClick={() => setActiveTab(level as any)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 ${
                activeTab === level
                  ? "bg-[var(--secondary)] text-white shadow-md shadow-[var(--secondary)]/20"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Kelas {level}
            </button>
          ))}
        </div>

        {/* Jurusan Filter */}
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
          {jurusans.map((jurusan) => (
            <button
              key={jurusan}
              onClick={() => setActiveJurusan(jurusan)}
              className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-all shrink-0 ${
                activeJurusan === jurusan
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100"
              }`}
            >
              {jurusan}
            </button>
          ))}
        </div>
      </div>

      {/* Table section */}
      <div className="flex-1 overflow-auto bg-white p-0">
        {dataLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 h-full">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-gray-500">
              Tidak ada data siswa ditemukan untuk Kelas {activeTab}
            </p>
            <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-600">Siswa</th>
                <th className="px-6 py-4 font-bold text-gray-600">
                  Kelas Lengkap
                </th>
                <th className="px-6 py-4 font-bold text-gray-600">Status</th>
                <th className="px-6 py-4 font-bold text-gray-600">Waktu</th>
                <th className="px-6 py-4 font-bold text-gray-600 w-full">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <tr
                  key={student.nisn}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                          student.status === "hadir"
                            ? "bg-emerald-500"
                            : student.status === "tidak_hadir"
                              ? "bg-amber-500"
                              : "bg-gray-300"
                        }`}
                      >
                        {student.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {student.nama}
                        </p>
                        <p className="text-xs text-gray-500">{student.nisn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium whitespace-pre-wrap min-w-[150px]">
                    {student.kelas}
                  </td>
                  <td className="px-6 py-4 lg:w-48">
                    {student.status === "hadir" && (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Hadir
                        </span>
                      </div>
                    )}
                    {student.status === "tidak_hadir" && (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Izin
                        </span>
                      </div>
                    )}
                    {student.status === "belum" && (
                      <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Belum/Tanpa Ket
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium tabular-nums">
                    {student.waktuAbsen ? `${student.waktuAbsen} WIB` : "-"}
                  </td>
                  <td className="px-6 py-4 w-full">
                    <div
                      className="max-w-xs truncate text-gray-500 text-sm"
                      title={student.alasanTidakHadir || ""}
                    >
                      {student.status === "tidak_hadir"
                        ? student.alasanTidakHadir
                        : "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
