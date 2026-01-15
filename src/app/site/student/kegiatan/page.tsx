"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import Select from "@/app/components/Select";
import { DatePicker } from "@/app/components/DatePicker";
import { TimePicker } from "@/app/components/TimePicker";
import {
  Calendar,
  Utensils,
  HandCoins,
  Dumbbell,
  HelpCircle,
  Sun,
} from "lucide-react";

interface StudentData {
  nama: string;
  nisn: string;
  kelas: string;
}

type BeribadahBooleanKey =
  | "berdoaUntukDiriDanOrtu"
  | "sholatFajar"
  | "sholatLimaWaktuBerjamaah"
  | "zikirSesudahSholat"
  | "sholatDhuha"
  | "sholatSunahRawatib";

type BeribadahForm = {
  [key in BeribadahBooleanKey]: boolean;
} & {
  zakatInfaqSedekah: string;
};

const BERIBADAH_BOOLEAN_FIELDS: Array<{
  key: BeribadahBooleanKey;
  label: string;
}> = [
  {
    key: "berdoaUntukDiriDanOrtu",
    label: "Berdoa untuk diri sendiri dan orang tua",
  },
  {
    key: "sholatFajar",
    label: "Sholat Fajar / Qoblal Subuh*",
  },
  {
    key: "sholatLimaWaktuBerjamaah",
    label: "Sholat 5 waktu berjamaah*",
  },
  {
    key: "zikirSesudahSholat",
    label: "Zikir dan doa sehabis sholat fardlu*",
  },
  {
    key: "sholatDhuha",
    label: "Sholat Dhuha*",
  },
  {
    key: "sholatSunahRawatib",
    label: "Sholat sunah rawatib*",
  },
];

const createDefaultBeribadah = (): BeribadahForm => ({
  berdoaUntukDiriDanOrtu: false,
  sholatFajar: false,
  sholatLimaWaktuBerjamaah: false,
  zikirSesudahSholat: false,
  sholatDhuha: false,
  sholatSunahRawatib: false,
  zakatInfaqSedekah: "",
});

const OLAGRAGA_DESKRIPSI_MAP: Record<string, string> = {
  "senam-sekolah": "Senam di sekolah seminggu sekali",
  "senam-masyarakat": "Senam di masyarakat seminggu sekali",
  "walk-school": "Walk to school setiap hari",
  "ride-school": "Ride to school (sepeda ontel) setiap hari",
  "gym-renang": "Gym / renang seminggu sekali",
  "running-jogging": "Running / lari / jogging seminggu 2 (dua) kali",
  "olahraga-hobi": "Olah raga hobbi seminggu sekali",
  lainnya: "",
};

const BERMASYARAKAT_DESKRIPSI_MAP: Record<string, string> = {
  "membersihkan-tempat-ibadah": "Membersihkan tempat ibadah",
  "membersihkan-got-jalanan": "Membersihkan got / jalanan umum",
  "merawat-tanaman": "Merawat tanaman / penghijauan di tempat umum",
  "petugas-ibadah":
    "Menjadi petugas pelayan beribadah / imam / muadzin / bilal",
  "khotib-penceramah":
    "Menjadi khotib / penceramah / petugas pembimbing keagamaan",
  "mengajar-ngaji": "Mengajar ngaji / ta'lim / membimbing kelompok belajar",
};

const BELAJAR_DESKRIPSI_MAP: Record<string, string> = {
  "membaca-kitab-suci": "Membaca kitab suci ( sesuai Agama yang dianutnya )",
  "membaca-buku-bacaan": "Membaca buku bacaan / novel / hobby / sejarah dsb.",
  "membaca-buku-pelajaran": "Membaca buku mata pelajaran",
  "mengerjakan-tugas": "Mengerjakan tugas / PR",
};

// Professional Select Options
const MAKANAN_OPTIONS = [
  { value: "", label: "Pilih jenis makanan..." },
  { value: "sahur", label: "Makan sahur" },
  { value: "sarapan", label: "Sarapan pagi" },
  { value: "siang", label: "Makan siang" },
  { value: "malam", label: "Makan malam" },
];

const OLAGRAGA_OPTIONS = [
  { value: "", label: "Pilih jenis olahraga..." },
  {
    value: "senam-sekolah",
    label: "Senam di sekolah",
    description: "seminggu sekali",
  },
  {
    value: "senam-masyarakat",
    label: "Senam di masyarakat",
    description: "seminggu sekali",
  },
  { value: "walk-school", label: "Walk to school", description: "setiap hari" },
  {
    value: "ride-school",
    label: "Ride to school",
    description: "sepeda ontel setiap hari",
  },
  {
    value: "gym-renang",
    label: "Gym / renang",
    description: "seminggu sekali",
  },
  {
    value: "running-jogging",
    label: "Running / lari / jogging",
    description: "seminggu 2 (dua) kali",
  },
  {
    value: "olahraga-hobi",
    label: "Olah raga hobbi",
    description: "seminggu sekali",
  },
  { value: "lainnya", label: "Olah raga lainnya" },
];

const BERMASYARAKAT_OPTIONS = [
  { value: "", label: "Pilih jenis kegiatan bermasyarakat..." },
  ...Object.entries(BERMASYARAKAT_DESKRIPSI_MAP).map(([key, description]) => ({
    value: key,
    label: description,
  })),
];

const BELAJAR_OPTIONS = [
  { value: "", label: "Pilih jenis kegiatan belajar..." },
  ...Object.entries(BELAJAR_DESKRIPSI_MAP).map(([key, description]) => ({
    value: key,
    label: description,
  })),
];

export default function KegiatanSiswa() {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData>({
    nama: "",
    nisn: "",
    kelas: "",
  });

  const [snackbar, setSnackbar] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [showSuplemenHelp, setShowSuplemenHelp] = useState(false);
  const suplemenRef = useRef<HTMLDivElement | null>(null);

  const [showBeribadahHelp, setShowBeribadahHelp] = useState(false);
  const beribadahRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showSuplemenHelp) return;

    function handleOutside(e: MouseEvent) {
      if (
        suplemenRef.current &&
        e.target instanceof Node &&
        !suplemenRef.current.contains(e.target)
      ) {
        setShowSuplemenHelp(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setShowSuplemenHelp(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showSuplemenHelp]);

  useEffect(() => {
    if (!showBeribadahHelp) return;

    function handleOutside(e: MouseEvent) {
      if (
        beribadahRef.current &&
        e.target instanceof Node &&
        !beribadahRef.current.contains(e.target)
      ) {
        setShowBeribadahHelp(false);
      }
    }

    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setShowBeribadahHelp(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showBeribadahHelp]);

  // Form state
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    nama: "",
    nisn: "",
    kelas: "",
    bangunPagi: {
      jam: "",
      membacaDanBangunTidur: false,
    },
    tidur: {
      jam: "",
      membacaDanMasTidur: false,
    },
    beribadah: createDefaultBeribadah(),
    makanSehat: {
      jenisMakanan: "",
      jenisLaukSayur: "",
      makanSayurAtauBuah: false,
      minumSuplemen: false,
    },
    olahraga: {
      jenisOlahraga: "",
      deskripsi: "",
      waktu: "",
    },
    bermasyarakat: {
      deskripsi: "",
      tempat: "",
      waktu: "",
      paraf: false,
    },
    belajar: {
      yaAtauTidak: false,
      deskripsi: "",
    },
  });

  useEffect(() => {
    fetchStudentData();
    // Load saved tanggal from localStorage
    const savedTanggal = localStorage.getItem("selectedTanggal");
    if (savedTanggal) {
      setFormData((prev) => ({ ...prev, tanggal: savedTanggal }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (snackbar) {
      setSnackbarVisible(true);
      const hideTimer = setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [snackbar]);

  useEffect(() => {
    if (formData.tanggal && studentData.nisn) {
      fetchKegiatanByDate(formData.tanggal);
    }
  }, [formData.tanggal, studentData.nisn]);

  const fetchStudentData = async () => {
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

      setFormData((prev) => ({
        ...prev,
        nama: data.student.nama,
        nisn: data.student.nisn,
        kelas: data.student.kelas,
      }));
    } catch (error) {
      console.error("Error fetching student data:", error);
      router.push("/site/student/login");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKegiatanByDate = async (tanggal: string) => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) return;

      const response = await fetch(`/api/student/kegiatan?tanggal=${tanggal}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.kegiatan) {
        const kegiatan = { ...data.kegiatan } as Record<string, unknown>;
        delete kegiatan["_id"];

        // Normalize olahraga data
        if (kegiatan.olahraga && typeof kegiatan.olahraga === "object") {
          const o = { ...(kegiatan.olahraga as Record<string, unknown>) };
          const normalizedOlahraga = {
            jenisOlahraga: o.jenisOlahraga || "",
            deskripsi: o.deskripsi || "",
            waktu: o.waktu || "",
          };
          kegiatan["olahraga"] = normalizedOlahraga;
        }

        const existingBeribadah = kegiatan.beribadah as
          | Partial<BeribadahForm>
          | undefined;
        const normalizedBeribadah = createDefaultBeribadah();
        if (existingBeribadah) {
          BERIBADAH_BOOLEAN_FIELDS.forEach(({ key }) => {
            normalizedBeribadah[key] = Boolean(existingBeribadah[key]);
          });
          if (existingBeribadah.zakatInfaqSedekah !== undefined) {
            normalizedBeribadah.zakatInfaqSedekah = String(
              existingBeribadah.zakatInfaqSedekah ?? ""
            );
          }
        }
        kegiatan["beribadah"] = normalizedBeribadah;

        // Normalize makanSehat data
        if (kegiatan.makanSehat && typeof kegiatan.makanSehat === "object") {
          const m = { ...(kegiatan.makanSehat as Record<string, unknown>) };
          const normalizedMakanSehat = {
            jenisMakanan: m.jenisMakanan || "",
            jenisLaukSayur: m.jenisLaukSayur || "",
            makanSayurAtauBuah: Boolean(m.makanSayurAtauBuah),
            minumSuplemen: Boolean(m.minumSuplemen),
          };
          kegiatan["makanSehat"] = normalizedMakanSehat;
        }

        // Normalize bermasyarakat data
        if (
          kegiatan.bermasyarakat &&
          typeof kegiatan.bermasyarakat === "object"
        ) {
          const b = { ...(kegiatan.bermasyarakat as Record<string, unknown>) };
          const normalizedBermasyarakat = {
            deskripsi: b.deskripsi || "",
            tempat: b.tempat || "",
            waktu: b.waktu || "",
            paraf: Boolean(b.paraf),
          };
          kegiatan["bermasyarakat"] = normalizedBermasyarakat;
        }

        setFormData((prev) => ({
          ...prev,
          ...(kegiatan as Record<string, unknown>),
        }));
      }
    } catch (error) {
      console.error("Error fetching kegiatan:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        router.push("/site/student/login");
        return;
      }

      const outgoing = JSON.parse(JSON.stringify(formData)) as Record<
        string,
        unknown
      >;
      delete outgoing["_id"];

      const response = await fetch("/api/student/kegiatan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(outgoing),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan data");
      }

      setSnackbar({
        message: data.message,
        type: "success",
      });

      // Refresh form atau redirect ke dashboard
      // router.push("/site/student");
    } catch (error) {
      console.error("Error saving kegiatan:", error);
      setSnackbar({
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan data kegiatan",
        type: "error",
      });
    }
  };

  const handleSectionSubmit = async (
    section: string,
    sectionData: Record<string, unknown>
  ) => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        router.push("/site/student/login");
        return;
      }

      // sanitize sectionData for olahraga to include jenisOlahraga
      const payloadSectionData = JSON.parse(
        JSON.stringify(sectionData)
      ) as Record<string, unknown>;
      delete payloadSectionData["_id"];

      const response = await fetch("/api/student/kegiatan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section,
          tanggal: formData.tanggal,
          nama: formData.nama,
          nisn: formData.nisn,
          kelas: formData.kelas,
          [section]: payloadSectionData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan data");
      }

      setSnackbar({
        message: data.message,
        type: "success",
      });

      // Refresh data dari server
      fetchKegiatanByDate(formData.tanggal);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      setSnackbar({
        message:
          error instanceof Error
            ? error.message
            : `Gagal menyimpan data ${section}`,
        type: "error",
      });
    }
  };

  const handleReset = () => {
    setFormData({
      tanggal: new Date().toISOString().split("T")[0],
      nama: studentData.nama,
      nisn: studentData.nisn,
      kelas: studentData.kelas,
      bangunPagi: {
        jam: "",
        membacaDanBangunTidur: false,
      },
      tidur: {
        jam: "",
        membacaDanMasTidur: false,
      },
      beribadah: createDefaultBeribadah(),
      makanSehat: {
        jenisMakanan: "",
        jenisLaukSayur: "",
        makanSayurAtauBuah: false,
        minumSuplemen: false,
      },
      olahraga: {
        jenisOlahraga: "",
        deskripsi: "",
        waktu: "",
      },
      bermasyarakat: {
        deskripsi: "",
        tempat: "",
        waktu: "",
        paraf: false,
      },
      belajar: {
        yaAtauTidak: false,
        deskripsi: "",
      },
    });
  };

  if (isLoading) {
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
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div
                  style={{ backgroundColor: "var(--secondary)" }}
                  className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 rounded-tr-xl rounded-tl-xl"
                >
                  <div className="text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Kegiatan Harian</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                      Catat kegiatan harianmu untuk mendapatkan poin
                    </p>
                  </div>
                </div>

                {/* Loading Content */}
                <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                    Memuat data kegiatan...
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
        <main className="flex-1 overflow-auto">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 lg:px-8 lg:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                    <span>Kegiatan Harian</span>
                  </h1>
                  <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                    Catat kegiatan harianmu untuk mendapatkan poin
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6 md:p-8 lg:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 pb-2 border-b border-gray-200">
                      Informasi Dasar
                    </h2>

                    {/* Tanggal */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Kegiatan
                      </label>
                      <DatePicker
                        value={formData.tanggal}
                        onChange={(value) => {
                          localStorage.setItem("selectedTanggal", value);

                          setFormData({
                            tanggal: value,
                            nama: studentData.nama,
                            nisn: studentData.nisn,
                            kelas: studentData.kelas,
                            bangunPagi: {
                              jam: "",
                              membacaDanBangunTidur: false,
                            },
                            tidur: {
                              jam: "",
                              membacaDanMasTidur: false,
                            },
                            beribadah: {
                              berdoaUntukDiriDanOrtu: false,
                              sholatFajar: false,
                              sholatLimaWaktuBerjamaah: false,
                              zikirSesudahSholat: false,
                              sholatDhuha: false,
                              sholatSunahRawatib: false,
                              zakatInfaqSedekah: "",
                            },
                            makanSehat: {
                              jenisMakanan: "",
                              jenisLaukSayur: "",
                              makanSayurAtauBuah: false,
                              minumSuplemen: false,
                            },
                            olahraga: {
                              jenisOlahraga: "",
                              deskripsi: "",
                              waktu: "",
                            },
                            bermasyarakat: {
                              deskripsi: "",
                              tempat: "",
                              waktu: "",
                              paraf: false,
                            },
                            belajar: {
                              yaAtauTidak: false,
                              deskripsi: "",
                            },
                          });
                        }}
                      />
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          value={formData.nama}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NISN
                        </label>
                        <input
                          type="text"
                          value={formData.nisn}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Kelas
                        </label>
                        <input
                          type="text"
                          value={formData.kelas}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Daily Activities Sections */}
                  <div className="space-y-6">
                    {/* Bangun Pagi & Tidur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Bangun Pagi */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Bangun Pagi
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Waktu Bangun
                            </label>
                            <TimePicker
                              value={formData.bangunPagi.jam}
                              onChange={(value) =>
                                setFormData({
                                  ...formData,
                                  bangunPagi: {
                                    ...formData.bangunPagi,
                                    jam: value,
                                  },
                                })
                              }
                              placeholder="Pilih waktu bangun..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Membaca Doa Bangun Tidur
                            </label>
                            <div className="flex gap-4 sm:gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="bangunTidur"
                                  checked={
                                    formData.bangunPagi.membacaDanBangunTidur
                                  }
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      bangunPagi: {
                                        ...formData.bangunPagi,
                                        membacaDanBangunTidur: true,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Ya
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="bangunTidur"
                                  checked={
                                    !formData.bangunPagi.membacaDanBangunTidur
                                  }
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      bangunPagi: {
                                        ...formData.bangunPagi,
                                        membacaDanBangunTidur: false,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Tidak
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="pt-3 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleSectionSubmit(
                                  "bangunPagi",
                                  formData.bangunPagi
                                )
                              }
                              className="w-full bg-orange-600 text-white py-2 sm:py-2.5 px-4 rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tidur */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Tidur
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Waktu Tidur
                            </label>
                            <TimePicker
                              value={formData.tidur.jam}
                              onChange={(value) =>
                                setFormData({
                                  ...formData,
                                  tidur: {
                                    ...formData.tidur,
                                    jam: value,
                                  },
                                })
                              }
                              placeholder="Pilih waktu tidur..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Membaca Doa Mau Tidur
                            </label>
                            <div className="flex gap-4 sm:gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="mauTidur"
                                  checked={formData.tidur.membacaDanMasTidur}
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      tidur: {
                                        ...formData.tidur,
                                        membacaDanMasTidur: true,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Ya
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="mauTidur"
                                  checked={!formData.tidur.membacaDanMasTidur}
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      tidur: {
                                        ...formData.tidur,
                                        membacaDanMasTidur: false,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Tidak
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="pt-3 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleSectionSubmit("tidur", formData.tidur)
                              }
                              className="w-full bg-indigo-600 text-white py-2 sm:py-2.5 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Beribadah */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          <HandCoins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          Beribadah
                        </h3>
                      </div>
                      <div className="mb-6">
                        <div
                          ref={beribadahRef}
                          className="flex items-start justify-between mb-4 relative"
                        >
                          <p className="text-sm text-gray-600">
                            Tandai indikator ibadah yang sudah dikerjakan hari
                            ini:
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setShowBeribadahHelp(!showBeribadahHelp)
                            }
                            aria-expanded={showBeribadahHelp}
                            aria-controls="beribadah-help"
                            className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            title="Informasi"
                          >
                            <HelpCircle className="w-5 h-5" />
                          </button>

                          <div
                            id="beribadah-help"
                            role="dialog"
                            aria-hidden={!showBeribadahHelp}
                            className={`absolute left-0 top-full mt-3 z-50 w-[min(28rem,100%)] transition-all duration-150 ${
                              showBeribadahHelp
                                ? "opacity-100 translate-y-0 pointer-events-auto"
                                : "opacity-0 -translate-y-2 pointer-events-none"
                            }`}
                          >
                            <div className="relative">
                              <div className="absolute -top-2 left-6">
                                <svg
                                  width="20"
                                  height="10"
                                  viewBox="0 0 20 10"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M0 10L10 0L20 10H0Z"
                                    fill="#ffffff"
                                    stroke="#e6e6e6"
                                  />
                                </svg>
                              </div>

                              <div className="mt-1 bg-white border border-gray-200 shadow-xl rounded-md p-3 text-sm text-gray-700 ring-1 ring-black/5">
                                <p className="leading-relaxed">
                                  tanda <strong>*</strong> diisi oleh
                                  siswa/siswi beragama Islam, dan bagi wanita
                                  muslim selama masa haid dihitung melaksanakan
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
                          {BERIBADAH_BOOLEAN_FIELDS.map((item) => (
                            <label
                              key={item.key}
                              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.beribadah[item.key]}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    beribadah: {
                                      ...formData.beribadah,
                                      [item.key]: e.target.checked,
                                    },
                                  })
                                }
                                className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Membayar zakat, infaq, sedekah / bersedekah /
                            beramal (nominal)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            inputMode="numeric"
                            value={formData.beribadah.zakatInfaqSedekah}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                beribadah: {
                                  ...formData.beribadah,
                                  zakatInfaqSedekah: e.target.value,
                                },
                              })
                            }
                            placeholder="Masukkan nominal dalam rupiah"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Kosongkan jika belum melakukan sedekah hari ini.
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 sm:pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleSectionSubmit("beribadah", formData.beribadah)
                          }
                          className="w-full text-white py-2 sm:py-2.5 px-4 rounded-lg hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          Simpan
                        </button>
                      </div>
                    </div>

                    {/* Makan Sehat & Olahraga */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Makan Sehat */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Makan Sehat
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Jenis Makanan
                            </label>
                            <Select
                              value={formData.makanSehat.jenisMakanan}
                              onChange={(value) =>
                                setFormData({
                                  ...formData,
                                  makanSehat: {
                                    ...formData.makanSehat,
                                    jenisMakanan: value,
                                  },
                                })
                              }
                              options={MAKANAN_OPTIONS}
                              placeholder="Pilih jenis makanan..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Makan lauk
                            </label>
                            <input
                              type="text"
                              value={formData.makanSehat.jenisLaukSayur}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  makanSehat: {
                                    ...formData.makanSehat,
                                    jenisLaukSayur: e.target.value,
                                  },
                                })
                              }
                              placeholder="Contoh: Telor, daging, ayam, ikan, tahu, tempe dsb"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Makan sayur atau Makan buah
                            </label>
                            <div className="flex gap-4 sm:gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="sayurBuah"
                                  checked={
                                    formData.makanSehat.makanSayurAtauBuah
                                  }
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      makanSehat: {
                                        ...formData.makanSehat,
                                        makanSayurAtauBuah: true,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Ya
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="sayurBuah"
                                  checked={
                                    !formData.makanSehat.makanSayurAtauBuah
                                  }
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      makanSehat: {
                                        ...formData.makanSehat,
                                        makanSayurAtauBuah: false,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Tidak
                                </span>
                              </label>
                            </div>
                          </div>
                          <div>
                            <div
                              ref={suplemenRef}
                              className="flex items-start justify-between mb-1 relative"
                            >
                              <label className="block text-sm font-medium text-gray-700">
                                Minum Susu dan/atau Suplemen
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowSuplemenHelp(!showSuplemenHelp)
                                }
                                aria-expanded={showSuplemenHelp}
                                aria-controls="suplemen-help"
                                className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                title="Bantuan"
                              >
                                <HelpCircle className="w-5 h-5" />
                              </button>

                              {/* Professional popover */}
                              <div
                                id="suplemen-help"
                                role="dialog"
                                aria-hidden={!showSuplemenHelp}
                                className={`absolute left-0 top-full mt-3 z-50 w-[min(26rem,100%)] transition-all duration-150 ${
                                  showSuplemenHelp
                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 -translate-y-2 pointer-events-none"
                                }`}
                              >
                                <div className="relative">
                                  {/* Arrow */}
                                  <div className="absolute -top-2 left-6">
                                    <svg
                                      width="20"
                                      height="10"
                                      viewBox="0 0 20 10"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M0 10L10 0L20 10H0Z"
                                        fill="#ffffff"
                                        stroke="#e6e6e6"
                                      />
                                    </svg>
                                  </div>

                                  <div className="mt-1 bg-white border border-gray-200 shadow-xl rounded-md p-3 text-sm text-gray-700 ring-1 ring-black/5">
                                    <p className="leading-relaxed">
                                      Jika hanya salah satu, misal hanya meminum
                                      susu atau suplemen maka diisi dengan{" "}
                                      <strong>ya</strong>, jika tidak keduanya
                                      maka <strong>tidak</strong>.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 sm:gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="suplemen"
                                  checked={formData.makanSehat.minumSuplemen}
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      makanSehat: {
                                        ...formData.makanSehat,
                                        minumSuplemen: true,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Ya
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="suplemen"
                                  checked={!formData.makanSehat.minumSuplemen}
                                  onChange={() =>
                                    setFormData({
                                      ...formData,
                                      makanSehat: {
                                        ...formData.makanSehat,
                                        minumSuplemen: false,
                                      },
                                    })
                                  }
                                  className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-xs sm:text-sm text-gray-700">
                                  Tidak
                                </span>
                              </label>
                            </div>
                          </div>
                          <div className="pt-3 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleSectionSubmit(
                                  "makanSehat",
                                  formData.makanSehat
                                )
                              }
                              className="w-full bg-pink-600 text-white py-2 sm:py-2.5 px-4 rounded-lg hover:bg-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Olahraga */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                          </div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Olahraga
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Pilih jenis olahraga yang dilakukan
                            </label>
                            <Select
                              value={formData.olahraga.jenisOlahraga}
                              onChange={(value) =>
                                setFormData({
                                  ...formData,
                                  olahraga: {
                                    ...formData.olahraga,
                                    jenisOlahraga: value,
                                    deskripsi:
                                      OLAGRAGA_DESKRIPSI_MAP[value] || "",
                                  },
                                })
                              }
                              options={OLAGRAGA_OPTIONS}
                              placeholder="Pilih jenis olahraga..."
                            />
                            {formData.olahraga.jenisOlahraga === "lainnya" && (
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Jenis olahraga lainnya
                                </label>
                                <input
                                  type="text"
                                  value={formData.olahraga.deskripsi}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      olahraga: {
                                        ...formData.olahraga,
                                        deskripsi: e.target.value,
                                      },
                                    })
                                  }
                                  placeholder="Masukkan jenis olahraga lainnya"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Durasi (menit)
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg
                                  className="w-5 h-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={formData.olahraga.waktu}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    olahraga: {
                                      ...formData.olahraga,
                                      waktu: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Contoh: 30"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                              />
                            </div>
                          </div>
                          <div className="pt-3 sm:pt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleSectionSubmit(
                                  "olahraga",
                                  formData.olahraga
                                )
                              }
                              className="w-full bg-yellow-600 text-white py-2 sm:py-2.5 px-4 rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bermasyarakat */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Bermasyarakat
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Pilih jenis kegiatan bermasyarakat yang dilakukan
                          </label>
                          <Select
                            value={formData.bermasyarakat.deskripsi}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                bermasyarakat: {
                                  ...formData.bermasyarakat,
                                  deskripsi: value,
                                },
                              })
                            }
                            options={BERMASYARAKAT_OPTIONS}
                            placeholder="Pilih jenis kegiatan bermasyarakat..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tempat
                            </label>
                            <input
                              type="text"
                              value={formData.bermasyarakat.tempat}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bermasyarakat: {
                                    ...formData.bermasyarakat,
                                    tempat: e.target.value,
                                  },
                                })
                              }
                              placeholder="Contoh: Masjid, sekolah, taman"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Waktu
                            </label>
                            <TimePicker
                              value={formData.bermasyarakat.waktu}
                              onChange={(value) =>
                                setFormData({
                                  ...formData,
                                  bermasyarakat: {
                                    ...formData.bermasyarakat,
                                    waktu: value,
                                  },
                                })
                              }
                              placeholder="Pilih waktu..."
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.bermasyarakat.paraf}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  bermasyarakat: {
                                    ...formData.bermasyarakat,
                                    paraf: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 rounded"
                            />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">
                              Paraf Orang Tua/Wali/RT
                            </span>
                          </label>
                          <div className="flex gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleSectionSubmit(
                                  "bermasyarakat",
                                  formData.bermasyarakat
                                )
                              }
                              className="bg-cyan-600 text-white py-2 sm:py-2.5 px-4 sm:px-6 rounded-lg hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Belajar */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 pb-3 border-b border-gray-200">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Belajar
                        </h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apakah belajar hari ini?
                          </label>
                          <div className="flex items-center gap-3 sm:gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="belajar"
                                checked={formData.belajar.yaAtauTidak === true}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    belajar: {
                                      ...formData.belajar,
                                      yaAtauTidak: true,
                                    },
                                  })
                                }
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Ya
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="belajar"
                                checked={formData.belajar.yaAtauTidak === false}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    belajar: {
                                      ...formData.belajar,
                                      yaAtauTidak: false,
                                    },
                                  })
                                }
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-xs sm:text-sm font-medium text-gray-700">
                                Tidak
                              </span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Pilih jenis kegiatan belajar yang dilakukan
                          </label>
                          <Select
                            value={formData.belajar.deskripsi}
                            onChange={(value) =>
                              setFormData({
                                ...formData,
                                belajar: {
                                  ...formData.belajar,
                                  deskripsi: value,
                                },
                              })
                            }
                            options={BELAJAR_OPTIONS}
                            placeholder="Pilih jenis kegiatan belajar..."
                          />
                        </div>
                        <div className="pt-3 sm:pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              handleSectionSubmit("belajar", formData.belajar)
                            }
                            className="w-full bg-purple-600 text-white py-2 sm:py-2.5 px-4 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium text-sm sm:text-base"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 sm:pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="order-2 sm:order-1 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      className="order-1 sm:order-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-white font-semibold hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
                      style={{ backgroundColor: "var(--secondary)" }}
                    >
                      Simpan Semua Data
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Snackbar */}
      <div
        className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 transform transition-all duration-300 z-50 ${
          snackbarVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-6 opacity-0"
        } ${
          snackbar?.type === "success"
            ? "bg-emerald-500"
            : snackbar?.type === "error"
            ? "bg-rose-500"
            : "bg-gray-500"
        } text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl shadow-lg pointer-events-none text-sm sm:text-base max-w-[90vw] sm:max-w-md text-center`}
        aria-live="assertive"
      >
        {snackbar?.message}
      </div>
    </div>
  );
}
