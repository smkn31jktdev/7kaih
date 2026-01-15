"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  Activity,
  CheckCircle2,
  XCircle,
  School,
  Clock,
  CalendarDays,
} from "lucide-react";

interface KegiatanData {
  bangunPagi?: {
    jam: string;
    membacaDanBangunTidur: boolean;
  };
  tidur?: {
    jam: string;
    membacaDanMasTidur: boolean;
  };
  beribadah?: {
    berdoaUntukDiriDanOrtu?: boolean;
    sholatFajar?: boolean;
    sholatLimaWaktuBerjamaah?: boolean;
    zikirSesudahSholat?: boolean;
    sholatDhuha?: boolean;
    sholatSunahRawatib?: boolean;
    zakatInfaqSedekah?: string;
  };
  makanSehat?: {
    jenisMakanan: string;
    jenisLaukSayur: string;
    minumSuplemen: boolean;
  };
  olahraga?: {
    deskripsi: string;
    waktu: string;
  };
  bermasyarakat?: {
    deskripsi: string;
    tempat: string;
    waktu: string;
    paraf: boolean;
  };
  belajar?: {
    yaAtauTidak: boolean;
    deskripsi: string;
  };
}

type KegiatanBeribadah = NonNullable<KegiatanData["beribadah"]>;

const BERIBADAH_BOOLEAN_KEYS: Array<
  Exclude<keyof KegiatanBeribadah, "zakatInfaqSedekah">
> = [
  "berdoaUntukDiriDanOrtu",
  "sholatFajar",
  "sholatLimaWaktuBerjamaah",
  "zikirSesudahSholat",
  "sholatDhuha",
  "sholatSunahRawatib",
];

export default function StudentDashboard() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [kegiatan, setKegiatan] = useState<KegiatanData | null>(null);
  const [isLoadingKegiatan, setIsLoadingKegiatan] = useState(true);
  const [studentData, setStudentData] = useState<{
    nama: string;
    nisn: string;
    kelas: string;
  } | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [currentDate, setCurrentDate] = useState("");

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/student/login?expired=1",
    tokenKey: "studentToken",
  });

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(now.toLocaleDateString("id-ID", options));
  }, []);

  const fetchKegiatanHariIni = useCallback(async () => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        router.push("/site/student/login");
        return;
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todayString = `${year}-${month}-${day}`;
      const response = await fetch(
        `/api/student/kegiatan?tanggal=${todayString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch kegiatan");
      }

      const data = await response.json();
      setKegiatan((data.kegiatan as KegiatanData) || {});
    } catch (error) {
      console.error("Error fetching kegiatan:", error);
      setKegiatan({} as KegiatanData);
    } finally {
      setIsLoadingKegiatan(false);
    }
  }, [router]);

  const fetchStudentData = useCallback(async () => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        router.push("/site/student/login");
        return;
      }

      const response = await fetch("/api/auth/student/me", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch student data");
      }

      const data = await response.json();
      setStudentData({
        nama: data.student.nama,
        nisn: data.student.nisn,
        kelas: data.student.kelas,
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      router.push("/site/student/login");
    } finally {
      setIsLoadingStudent(false);
    }
  }, [router]);

  const getActivities = () => {
    if (!kegiatan) return [];

    const activities = [];

    // Bangun Pagi
    if (kegiatan.bangunPagi?.jam) {
      activities.push({
        name: "Bangun Pagi",
        time: `Jam ${kegiatan.bangunPagi.jam}`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Bangun Pagi",
        time: "--:--",
        completed: false,
      });
    }

    // Beribadah
    const beribadahData = kegiatan.beribadah;
    const hasBeribadah = beribadahData
      ? BERIBADAH_BOOLEAN_KEYS.some((key) => Boolean(beribadahData[key])) ||
        Boolean(beribadahData.zakatInfaqSedekah)
      : false;
    if (hasBeribadah) {
      activities.push({
        name: "Beribadah",
        time: "Tercatat",
        completed: true,
      });
    } else {
      activities.push({
        name: "Beribadah",
        time: "-",
        completed: false,
      });
    }

    // Makan Sehat
    if (
      kegiatan.makanSehat?.jenisMakanan ||
      kegiatan.makanSehat?.jenisLaukSayur
    ) {
      let desc = "Tercatat";
      const mealTypeMap: Record<string, string> = {
        sahur: "Sahur",
        sarapan: "Sarapan",
        siang: "Siang",
        malam: "Malam",
      };
      if (kegiatan.makanSehat.jenisMakanan) {
        desc =
          mealTypeMap[kegiatan.makanSehat.jenisMakanan] ||
          kegiatan.makanSehat.jenisMakanan;
      }

      activities.push({
        name: "Makan Sehat",
        time: desc,
        completed: true,
      });
    } else {
      activities.push({
        name: "Makan Sehat",
        time: "-",
        completed: false,
      });
    }

    // Olahraga
    if (kegiatan.olahraga?.deskripsi) {
      activities.push({
        name: "Olahraga",
        time: `${kegiatan.olahraga.waktu || "0"} menit`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Olahraga",
        time: "-",
        completed: false,
      });
    }

    // Belajar
    if (kegiatan.belajar?.yaAtauTidak) {
      activities.push({
        name: "Belajar",
        time: "Tercatat",
        completed: true,
      });
    } else {
      activities.push({
        name: "Belajar",
        time: "-",
        completed: false,
      });
    }

    // Bermasyarakat
    if (kegiatan.bermasyarakat?.deskripsi) {
      activities.push({
        name: "Bermasyarakat",
        time: "Tercatat",
        completed: true,
      });
    } else {
      activities.push({
        name: "Bermasyarakat",
        time: "-",
        completed: false,
      });
    }

    // Tidur
    if (kegiatan.tidur?.jam) {
      activities.push({
        name: "Tidur",
        time: `Jam ${kegiatan.tidur.jam}`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Tidur",
        time: "--:--",
        completed: false,
      });
    }

    return activities;
  };

  useEffect(() => {
    fetchKegiatanHariIni();
    fetchStudentData();
  }, [fetchKegiatanHariIni, fetchStudentData]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-poppins text-gray-800">
      {/* Sidebar */}
      <StudentSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <StudentNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full mx-auto space-y-6">
            {/* Header / Welcome Section */}
            <div className="flex flex-col items-center md:flex-row md:items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Dashboard
                </h1>
                <p className="text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-2 text-sm md:text-base">
                  <CalendarDays className="w-4 h-4" />
                  {currentDate}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--secondary)]" />
                  <span className="text-sm font-medium text-gray-600">
                    Selamat Beraktivitas!
                  </span>
                </div>
              </div>
            </div>

            {/* Profile & Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[var(--secondary)] to-teal-400 opacity-10"></div>
                <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[var(--secondary)] to-teal-400 rounded-full flex items-center justify-center mb-4 shadow-sm text-white">
                  <span className="text-2xl font-bold">
                    {studentData?.nama
                      ? studentData.nama.charAt(0).toUpperCase()
                      : "?"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 line-clamp-1 relative z-10">
                  {isLoadingStudent
                    ? "Memuat..."
                    : studentData?.nama || "Siswa"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 relative z-10">
                  <School className="w-3.5 h-3.5" />
                  <span>
                    {isLoadingStudent
                      ? "..."
                      : `${studentData?.kelas || "-"} • ${
                          studentData?.nisn || "-"
                        }`}
                  </span>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:col-span-2 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        Progres Harian
                      </h3>
                      <p className="text-xs text-gray-500">
                        Selesaikan kebiasaan baikmu
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">
                      {isLoadingKegiatan
                        ? "-"
                        : getActivities().filter((a) => a.completed).length}
                    </span>
                    <span className="text-gray-400 text-sm">/7</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[var(--secondary)] h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${
                          isLoadingKegiatan
                            ? 0
                            : (getActivities().filter((a) => a.completed)
                                .length /
                                7) *
                              100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-right text-xs text-gray-400 mt-2">
                    {isLoadingKegiatan
                      ? "Sedang memuat data..."
                      : getActivities().filter((a) => a.completed).length === 7
                      ? "Luar biasa! Semua kegiatan selesai!"
                      : "Ayo selesaikan kegiatanmu!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Activities List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Aktivitas Hari Ini
                </h3>
                <button
                  onClick={() => router.push("/site/student/kegiatan")}
                  className="w-full sm:w-auto text-center px-4 py-2 rounded-lg bg-[var(--secondary)] text-white text-sm font-medium hover:bg-teal-600 transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                >
                  Isi Kegiatan &rarr;
                </button>
              </div>

              <div className="p-0">
                {isLoadingKegiatan ? (
                  <div className="p-8 text-center text-gray-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[var(--secondary)] border-t-transparent rounded-full mx-auto mb-2"></div>
                    Memuat data...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-50">
                    <div className="divide-y divide-gray-50">
                      {getActivities()
                        .slice(0, 4)
                        .map((activity, idx) => (
                          <ActivityRow key={idx} activity={activity} />
                        ))}
                    </div>
                    <div className="divide-y divide-gray-50">
                      {getActivities()
                        .slice(4)
                        .map((activity, idx) => (
                          <ActivityRow key={idx} activity={activity} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
}: {
  activity: { name: string; time: string; completed: boolean };
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
        activity.completed ? "opacity-100" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            activity.completed
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {activity.completed ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-sm">{activity.name}</p>
          <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
      </div>
      <div>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
            activity.completed
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {activity.completed ? "Selesai" : "Belum"}
        </span>
      </div>
    </div>
  );
}
