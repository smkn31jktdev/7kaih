"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  LayoutDashboard,
  Users,
  Activity,
  CircleCheck,
  CircleX,
  School,
  // Book,
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

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/student/login?expired=1",
    tokenKey: "studentToken",
  });

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
        time: `Hari ini bangun jam, ${kegiatan.bangunPagi.jam}`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Bangun Pagi",
        time: "Belum selesai",
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
        time: `Hari ini sudah beribadah`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Beribadah",
        time: "Belum selesai",
        completed: false,
      });
    }

    // Makan Sehat
    if (
      kegiatan.makanSehat?.jenisMakanan ||
      kegiatan.makanSehat?.jenisLaukSayur
    ) {
      const mealTypeMap: Record<string, string> = {
        sahur: "Sahur",
        sarapan: "Sarapan Pagi",
        siang: "Makan Siang",
        malam: "Makan Malam",
      };
      const mealType = kegiatan.makanSehat.jenisMakanan
        ? mealTypeMap[kegiatan.makanSehat.jenisMakanan] ||
          kegiatan.makanSehat.jenisMakanan
        : "";
      activities.push({
        name: "Makan Sehat",
        time: `Hari ini makan sehat${mealType ? ` (${mealType})` : ""}${
          kegiatan.makanSehat.jenisLaukSayur
            ? ` dengan ${kegiatan.makanSehat.jenisLaukSayur}`
            : ""
        }`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Makan Sehat",
        time: "Belum selesai",
        completed: false,
      });
    }

    // Olahraga
    if (kegiatan.olahraga?.deskripsi) {
      activities.push({
        name: "Olahraga",
        time: `Hari ini berolahraga ${kegiatan.olahraga.deskripsi} selama, ${
          kegiatan.olahraga.waktu || ""
        } menit`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Olahraga",
        time: "Belum selesai",
        completed: false,
      });
    }

    // Belajar
    if (kegiatan.belajar?.yaAtauTidak) {
      activities.push({
        name: "Belajar",
        time: `Hari ini belajar ${kegiatan.belajar.deskripsi || ""}`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Belajar",
        time: "Belum selesai",
        completed: false,
      });
    }

    // Bermasyarakat
    if (kegiatan.bermasyarakat?.deskripsi) {
      activities.push({
        name: "Bermasyarakat",
        time: `Hari ini ${kegiatan.bermasyarakat.deskripsi || ""} di ${
          kegiatan.bermasyarakat.tempat || ""
        }`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Bermasyarakat",
        time: "Belum selesai",
        completed: false,
      });
    }

    // Tidur
    if (kegiatan.tidur?.jam) {
      activities.push({
        name: "Tidur",
        time: `Hari ini tidur jam, ${kegiatan.tidur.jam}`,
        completed: true,
      });
    } else {
      activities.push({
        name: "Tidur",
        time: "Belum selesai",
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
    <div className="flex h-screen bg-gray-50">
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
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          {/* Header Section */}
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Dashboard Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pantau aktivitas harian dan poin kebiasaanmu dengan mudah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="flex flex-col gap-6 xl:flex-row">
                  <div className="flex-1 space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-100/40 rounded-3xl p-6 border border-green-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium mb-1">
                              Kegiatan Hari Ini
                            </p>
                            <p className="text-3xl font-bold text-green-800">
                              {isLoadingKegiatan
                                ? "..."
                                : `${
                                    getActivities().filter((a) => a.completed)
                                      .length
                                  }/7`}
                            </p>
                            <p className="text-sm text-green-600">
                              Kebiasaan selesai
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center">
                            <Activity className="w-7 h-7 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100/40 rounded-3xl p-6 border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium mb-1">
                              Nama Siswa
                            </p>
                            <p className="text-3xl font-bold text-blue-800">
                              {isLoadingStudent
                                ? "..."
                                : studentData?.nama || "N/A"}
                            </p>
                            <p className="text-sm text-blue-600">
                              Nama lengkap
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center">
                            <Users className="w-7 h-7 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/40 rounded-3xl p-6 border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 text-sm font-medium mb-1">
                              NISN dan Kelas
                            </p>
                            <p className="text-3xl font-bold text-orange-800">
                              {isLoadingStudent
                                ? "..."
                                : `${studentData?.nisn || "N/A"} - ${
                                    studentData?.kelas || "N/A"
                                  }`}
                            </p>
                            <p className="text-sm text-orange-600">
                              NISN dan Kelas
                            </p>
                          </div>
                          <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center">
                            <School className="w-7 h-7 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white rounded-2xl p-5 border border-indigo-100">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-indigo-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              Aktivitas Terbaru
                            </h3>
                            <p className="text-sm text-slate-500">
                              Ringkasan aktivitas harianmu hari ini (
                              {new Date().toLocaleDateString("id-ID", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              )
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {isLoadingKegiatan ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                              <p className="mt-2 text-sm text-slate-500">
                                Memuat aktivitas...
                              </p>
                            </div>
                          ) : (
                            getActivities().map((activity, index) => (
                              <div
                                key={index}
                                className={`flex items-center gap-4 rounded-2xl bg-white/80 border px-4 py-4 hover:bg-opacity-50 transition-colors ${
                                  activity.completed
                                    ? "border-green-50 hover:bg-green-50/50"
                                    : "border-gray-50 hover:bg-gray-50/50"
                                }`}
                              >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                                  {activity.completed ? (
                                    <CircleCheck className="w-7 h-7 text-green-600 bg-green-100 rounded-full p-1" />
                                  ) : (
                                    <CircleX className="w-7 h-7 text-gray-400 bg-gray-100 rounded-full p-1" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {activity.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {activity.time}
                                  </p>
                                </div>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    activity.completed
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                ></div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
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
