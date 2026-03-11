"use client";

import { useState, useEffect } from "react";
import PiketSidebar from "@/app/components/dashboard/piket/layout/sidebar";
import PiketNavbar from "@/app/components/dashboard/piket/layout/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  Users,
  User,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface StudentAttendance {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  status: "hadir" | "tidak_hadir" | "belum";
  waktuAbsen: string | null;
  alasanTidakHadir: string | null;
}

export default function BerandaSection() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [piketName, setPiketName] = useState("");
  const [piketLoading, setPiketLoading] = useState(true);

  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  // Strict Piket Email Verification
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("adminUser");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.email !== "piket@smkn31jkt.id") {
          window.location.href = "/site/private/admin";
        }
      } else {
        window.location.href = "/site/private/admin/login";
      }
    } catch (_error) {
      void _error;
    }
  }, []);

  useEffect(() => {
    const fetchPiket = async () => {
      try {
        setPiketLoading(true);
        const token = localStorage.getItem("adminToken");
        if (!token) return;
        const response = await fetch("/api/auth/admin/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPiketName(data.user.nama);
        }
      } catch (error) {
        console.error("Error fetching piket:", error);
      } finally {
        setPiketLoading(false);
      }
    };

    const fetchAttendance = async () => {
      try {
        setDataLoading(true);
        const token = localStorage.getItem("adminToken");
        if (!token) return;

        // Use today's date format YYYY-MM-DD
        const today = new Date();
        // Shift to local timezone YYYY-MM-DD
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const tanggalStr = `${year}-${month}-${day}`;

        const response = await fetch(
          `/api/piket/kehadiran?tanggal=${tanggalStr}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setStudents(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchPiket();
    fetchAttendance();

    // Polling every 10 seconds
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

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

  const _groupStudentsByJurusan = (studentsList: StudentAttendance[]) => {
    void _groupStudentsByJurusan;
    const grouped: Record<string, string[]> = {};
    const jurusans = [
      "Akuntansi",
      "Animasi",
      "Bisnis Ritel",
      "DKV",
      "Layanan Perbankan",
      "Manajemen Perkantoran",
      "Lainnya",
    ];
    jurusans.forEach((j) => (grouped[j] = []));

    studentsList.forEach((s) => {
      const jurusan = getJurusan(s.kelas);
      if (grouped[jurusan]) grouped[jurusan].push(s.nama);
      else grouped["Lainnya"].push(s.nama);
    });

    Object.keys(grouped).forEach((k) => {
      if (grouped[k].length === 0) delete grouped[k];
    });
    return grouped;
  };

  const totalSiswa = students.length;
  const hadirCount = students.filter((s) => s.status === "hadir").length;
  const izinCount = students.filter((s) => s.status === "tidak_hadir").length;
  const belumCount = students.filter((s) => s.status === "belum").length;

  const kelasStats = ["X", "XI", "XII"].map((level) => {
    const classStudents = students.filter(
      (s) => getClassLevel(s.kelas) === level,
    );

    const jurusanStats = [
      "Akuntansi",
      "Animasi",
      "Bisnis Ritel",
      "DKV",
      "Layanan Perbankan",
      "Manajemen Perkantoran",
      "Lainnya",
    ]
      .map((jurusan) => {
        const jStudents = classStudents.filter(
          (s) => getJurusan(s.kelas) === jurusan,
        );
        return {
          jurusan,
          total: jStudents.length,
          hadir: jStudents.filter((s) => s.status === "hadir").length,
          izin: jStudents.filter((s) => s.status === "tidak_hadir").length,
          belum: jStudents.filter((s) => s.status === "belum").length,
          izinStudents: jStudents
            .filter((s) => s.status === "tidak_hadir")
            .map((s) => s.nama),
          belumStudents: jStudents
            .filter((s) => s.status === "belum")
            .map((s) => s.nama),
        };
      })
      .filter((j) => j.total > 0);

    return {
      level,
      total: classStudents.length,
      hadir: classStudents.filter((s) => s.status === "hadir").length,
      izin: classStudents.filter((s) => s.status === "tidak_hadir").length,
      belum: classStudents.filter((s) => s.status === "belum").length,
      jurusanStats,
    };
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <PiketSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PiketNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="mb-8 md:mb-10 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Beranda Guru Piket
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                Pantau absensi kehadiran siswa dengan mudah secara langsung.
              </p>
            </div>

            <div className="flex flex-col gap-6 xl:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex-1 space-y-6">
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Profil Piket */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Guru Piket
                      </p>
                      {piketLoading ? (
                        <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900 truncate">
                          {piketName || "Admin / Piket"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total Siswa */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Total Siswa
                      </p>
                      {dataLoading ? (
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900">
                          {totalSiswa} Siswa
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Hadir */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Hadir Hari Ini
                      </p>
                      {dataLoading ? (
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900">
                          {hadirCount} Siswa
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Izin/Tidak Hadir */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-0.5">
                        Izin / Sakit
                      </p>
                      {dataLoading ? (
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      ) : (
                        <p className="text-base font-bold text-gray-900">
                          {izinCount} Siswa
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner ke Monitoring */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--secondary)]/10 to-transparent rounded-bl-full -z-0 opacity-50" />
                  <div className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Monitoring Absensi Siswa
                      </h3>
                      <p className="text-gray-500 max-w-lg leading-relaxed">
                        Lihat daftar absensi siswa secara lengkap, dan dapatkan
                        notifikasi kapan siswa telah menyelesaikan absensi hari
                        ini. Data diperbarui secara real-time.
                      </p>
                      <div className="mt-4 flex gap-4 text-sm font-medium text-gray-600 bg-gray-50 inline-flex px-4 py-2 rounded-xl">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />{" "}
                          {hadirCount} Hadir
                        </span>
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-amber-500" />{" "}
                          {izinCount} Izin
                        </span>
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />{" "}
                          {belumCount} Belum
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link
                        href="/site/private/piket/monitoring"
                        className="bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[var(--secondary)]/25 flex items-center gap-3"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Buka Monitoring
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 xl:flex-row animate-in fade-in slide-in-from-bottom-8 duration-700 mt-6">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        Ringkasan Per Kelas
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {kelasStats.map((stat) => (
                        <div
                          key={stat.level}
                          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                        >
                          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/10 text-[var(--secondary)] flex items-center justify-center font-bold text-lg">
                                {stat.level}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  Kelas {stat.level}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {stat.total} Siswa
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col gap-4">
                            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100 bg-gray-50/50 p-3 rounded-2xl">
                              <div>
                                <p className="text-xl font-bold text-emerald-600">
                                  {stat.hadir}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                                  Hadir
                                </p>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-amber-600">
                                  {stat.izin}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                                  Izin
                                </p>
                              </div>
                              <div>
                                <p className="text-xl font-bold text-gray-600">
                                  {stat.belum}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-1">
                                  Belum
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 flex flex-col gap-3 max-h-[22rem] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                              {stat.jurusanStats.map((jStat) => (
                                <div
                                  key={jStat.jurusan}
                                  className="bg-white border text-left border-gray-100 rounded-xl p-3 shadow-sm"
                                >
                                  <div className="flex items-start justify-between mb-2 gap-2 flex-col xl:flex-row">
                                    <h4 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
                                      {jStat.jurusan}
                                    </h4>
                                    <div className="flex gap-1.5 text-[10px] font-bold">
                                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                        {jStat.hadir} Hadir
                                      </span>
                                      <span className="text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                                        {jStat.izin} Izin
                                      </span>
                                      <span className="text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">
                                        {jStat.belum} Belum
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2 mt-2">
                                    {jStat.izinStudents.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                                          <XCircle className="w-3 h-3" />{" "}
                                          Izin/Sakit
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {jStat.izinStudents.map(
                                            (nama, idx) => (
                                              <span
                                                key={idx}
                                                className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50/50 text-amber-700 text-[10px] font-medium border border-amber-100/50 truncate max-w-full"
                                              >
                                                {nama}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {jStat.belumStudents.length > 0 && (
                                      <div>
                                        <p className="text-[10px] font-bold text-rose-600 mb-1 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />{" "}
                                          Belum/Tanpa Ket
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {jStat.belumStudents.map(
                                            (nama, idx) => (
                                              <span
                                                key={idx}
                                                className="inline-flex items-center px-2 py-0.5 rounded bg-rose-50/50 text-rose-700 text-[10px] font-medium border border-rose-100/50 truncate max-w-full"
                                              >
                                                {nama}
                                              </span>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {jStat.izin === 0 && jStat.belum === 0 && (
                                      <p className="text-[10px] text-emerald-600/70 italic mt-1 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />{" "}
                                        Termonitor lengkap & hadir
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {stat.jurusanStats.length === 0 && (
                              <div className="mt-auto pt-4 flex flex-col items-center justify-center text-gray-400 py-6">
                                <p className="text-sm font-medium">
                                  Belum ada data
                                </p>
                              </div>
                            )}
                          </div>
                          <Link
                            href="/site/private/piket/monitoring"
                            className="p-3 bg-gray-50 text-center text-sm font-semibold text-[var(--secondary)] hover:bg-[var(--secondary)] hover:text-white transition-colors flex items-center justify-center gap-1"
                          >
                            Lihat Detail Kelas {stat.level}{" "}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
