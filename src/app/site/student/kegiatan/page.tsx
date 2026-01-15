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
  Moon,
  Users,
  BookOpen,
  Save,
  Clock,
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

// Reusable Section Component for consistent styling
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

// Unified Save Button
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
    className="w-full mt-2 group relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--secondary)] text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[var(--secondary)]/20 active:scale-[0.98]"
  >
    <span>{label}</span>
    <Save className="w-4 h-4 opacity-80 group-hover:scale-110 transition-transform" />
  </button>
);

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
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
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
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-400">
        <span className="loading loading-spinner loading-lg"></span> Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-poppins text-gray-800">
      <StudentSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StudentNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10 mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 md:mb-12 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                Kegiatan Harian
              </h1>
              <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto md:mx-0 leading-relaxed">
                Catat aktivitas positifmu setiap hari untuk membangun kebiasaan
                baik dan mendapatkan poin prestasi.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Top Controls: Date & Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--secondary)]" />
                      Pilih Tanggal
                    </label>
                    <DatePicker
                      value={formData.tanggal}
                      onChange={(value) => {
                        localStorage.setItem("selectedTanggal", value);
                        setFormData((prev) => ({ ...prev, tanggal: value }));
                      }}
                    />
                  </div>

                  {/* Student Info Card */}
                  <div className="bg-[var(--secondary)]/5 rounded-3xl p-6 border border-[var(--secondary)]/10">
                    <h3 className="text-sm font-bold text-[var(--secondary)] mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Data Siswa
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between pb-2 border-b border-[var(--secondary)]/10">
                        <span className="text-gray-500">Nama</span>
                        <span className="font-semibold text-gray-800 text-right">
                          {formData.nama}
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-[var(--secondary)]/10">
                        <span className="text-gray-500">NISN</span>
                        <span className="font-semibold text-gray-800">
                          {formData.nisn}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Kelas</span>
                        <span className="font-semibold text-gray-800">
                          {formData.kelas}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Activity Sections */}
                <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                  {/* Bangun Pagi & Tidur Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SectionCard title="Bangun Pagi" icon={Sun}>
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
                          placeholder="00:00"
                        />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Membaca Doa Bangun Tidur?
                        </label>
                        <div className="flex gap-4">
                          {[true, false].map((val) => (
                            <label
                              key={String(val)}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  formData.bangunPagi.membacaDanBangunTidur ===
                                  val
                                    ? "border-[var(--secondary)] bg-[var(--secondary)]"
                                    : "border-gray-300 bg-white group-hover:border-[var(--secondary)]"
                                }`}
                              >
                                {formData.bangunPagi.membacaDanBangunTidur ===
                                  val && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <input
                                type="radio"
                                name="bangunTidur"
                                className="hidden"
                                checked={
                                  formData.bangunPagi.membacaDanBangunTidur ===
                                  val
                                }
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    bangunPagi: {
                                      ...formData.bangunPagi,
                                      membacaDanBangunTidur: val,
                                    },
                                  })
                                }
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                {val ? "Ya" : "Tidak"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <SaveButton
                        onClick={() =>
                          handleSectionSubmit("bangunPagi", formData.bangunPagi)
                        }
                      />
                    </SectionCard>

                    <SectionCard title="Tidur Malam" icon={Moon}>
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
                          placeholder="00:00"
                        />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Membaca Doa Sebelum Tidur?
                        </label>
                        <div className="flex gap-4">
                          {[true, false].map((val) => (
                            <label
                              key={String(val)}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  formData.tidur.membacaDanMasTidur === val
                                    ? "border-[var(--secondary)] bg-[var(--secondary)]"
                                    : "border-gray-300 bg-white group-hover:border-[var(--secondary)]"
                                }`}
                              >
                                {formData.tidur.membacaDanMasTidur === val && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <input
                                type="radio"
                                name="mauTidur"
                                className="hidden"
                                checked={
                                  formData.tidur.membacaDanMasTidur === val
                                }
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    tidur: {
                                      ...formData.tidur,
                                      membacaDanMasTidur: val,
                                    },
                                  })
                                }
                              />
                              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                {val ? "Ya" : "Tidak"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <SaveButton
                        onClick={() =>
                          handleSectionSubmit("tidur", formData.tidur)
                        }
                      />
                    </SectionCard>
                  </div>

                  <SectionCard
                    title="Beribadah"
                    icon={HandCoins}
                    className="border-t-4 border-t-[var(--secondary)]"
                  >
                    <div className="bg-blue-50/50 rounded-xl p-4 mb-4 border border-blue-100 flex gap-3 text-sm text-blue-800">
                      <HelpCircle className="w-5 h-5 flex-shrink-0 text-blue-500" />
                      <p>
                        Tanda <strong>*</strong> wajib diisi oleh siswa muslim.
                        Wanita haid tetap dihitung melaksanakan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {BERIBADAH_BOOLEAN_FIELDS.map((item) => (
                        <label
                          key={item.key}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            formData.beribadah[item.key]
                              ? "bg-[var(--secondary)]/5 border-[var(--secondary)]/30 shadow-sm"
                              : "bg-white border-gray-200 hover:border-[var(--secondary)]/30 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              formData.beribadah[item.key]
                                ? "bg-[var(--secondary)] border-[var(--secondary)] text-white"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {formData.beribadah[item.key] && (
                              <Save className="w-3 h-3" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
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
                          />
                          <span
                            className={`${
                              formData.beribadah[item.key]
                                ? "text-[var(--secondary)] font-semibold"
                                : "text-gray-600"
                            } text-sm leading-tight select-none`}
                          >
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominal Infaq / Sedekah (Rupiah)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
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
                        placeholder="Contoh: 2000"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm placeholder:text-gray-400"
                      />
                    </div>
                    <SaveButton
                      onClick={() =>
                        handleSectionSubmit("beribadah", formData.beribadah)
                      }
                    />
                  </SectionCard>

                  {/* Makan Sehat & Olahraga */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SectionCard title="Makan Sehat" icon={Utensils}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Jenis Makanan
                          </label>
                          <Select
                            value={formData.makanSehat.jenisMakanan}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                makanSehat: {
                                  ...formData.makanSehat,
                                  jenisMakanan: val,
                                },
                              })
                            }
                            options={MAKANAN_OPTIONS}
                            placeholder="Pilih waktu makan..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Menu Lauk
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
                            placeholder="Contoh: Ayam, Tahu, Tempe..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
                          />
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                          <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Makan Sayur / Buah?
                            </span>
                            <div className="flex gap-4">
                              {[true, false].map((val) => (
                                <label
                                  key={`sb-${val}`}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                      formData.makanSehat.makanSayurAtauBuah ===
                                      val
                                        ? "border-[var(--secondary)] bg-[var(--secondary)]"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {formData.makanSehat.makanSayurAtauBuah ===
                                      val && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <input
                                    type="radio"
                                    className="hidden"
                                    checked={
                                      formData.makanSehat.makanSayurAtauBuah ===
                                      val
                                    }
                                    onChange={() =>
                                      setFormData({
                                        ...formData,
                                        makanSehat: {
                                          ...formData.makanSehat,
                                          makanSayurAtauBuah: val,
                                        },
                                      })
                                    }
                                  />
                                  <span className="text-sm text-gray-600">
                                    {val ? "Ya" : "Tidak"}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="block text-sm font-medium text-gray-700">
                                Minum Susu / Suplemen?
                              </span>
                              <span title="Pilih YA jika salah satu atau keduanya terpenuhi.">
                                <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                              </span>
                            </div>
                            <div className="flex gap-4">
                              {[true, false].map((val) => (
                                <label
                                  key={`sup-${val}`}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <div
                                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                      formData.makanSehat.minumSuplemen === val
                                        ? "border-[var(--secondary)] bg-[var(--secondary)]"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {formData.makanSehat.minumSuplemen ===
                                      val && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <input
                                    type="radio"
                                    className="hidden"
                                    checked={
                                      formData.makanSehat.minumSuplemen === val
                                    }
                                    onChange={() =>
                                      setFormData({
                                        ...formData,
                                        makanSehat: {
                                          ...formData.makanSehat,
                                          minumSuplemen: val,
                                        },
                                      })
                                    }
                                  />
                                  <span className="text-sm text-gray-600">
                                    {val ? "Ya" : "Tidak"}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <SaveButton
                        onClick={() =>
                          handleSectionSubmit("makanSehat", formData.makanSehat)
                        }
                      />
                    </SectionCard>

                    <SectionCard title="Olahraga" icon={Dumbbell}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Jenis Olahraga
                          </label>
                          <Select
                            value={formData.olahraga.jenisOlahraga}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                olahraga: {
                                  ...formData.olahraga,
                                  jenisOlahraga: val,
                                  deskripsi: OLAGRAGA_DESKRIPSI_MAP[val] || "",
                                },
                              })
                            }
                            options={OLAGRAGA_OPTIONS}
                            placeholder="Pilih aktivitas..."
                          />
                          {formData.olahraga.jenisOlahraga === "lainnya" && (
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
                              placeholder="Sebutkan olahraga lainnya..."
                              className="mt-3 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
                            />
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Durasi (Menit)
                          </label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              min="0"
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
                              placeholder="30"
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      <SaveButton
                        onClick={() =>
                          handleSectionSubmit("olahraga", formData.olahraga)
                        }
                      />
                    </SectionCard>
                  </div>

                  {/* Bermasyarakat */}
                  <SectionCard title="Bermasyarakat" icon={Users}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Jenis Kegiatan
                        </label>
                        <Select
                          value={formData.bermasyarakat.deskripsi}
                          onChange={(val) =>
                            setFormData({
                              ...formData,
                              bermasyarakat: {
                                ...formData.bermasyarakat,
                                deskripsi: val,
                              },
                            })
                          }
                          options={BERMASYARAKAT_OPTIONS}
                          placeholder="Pilih kegiatan sosial..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Tempat Kegiatan
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
                          placeholder="Masjid, Balai Warga, dll"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Waktu Pelaksanaan
                        </label>
                        <TimePicker
                          value={formData.bermasyarakat.waktu}
                          onChange={(val) =>
                            setFormData({
                              ...formData,
                              bermasyarakat: {
                                ...formData.bermasyarakat,
                                waktu: val,
                              },
                            })
                          }
                          placeholder="00:00"
                        />
                      </div>
                      <div className="md:col-span-2 pt-2">
                        <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-[var(--secondary)]/50 transition-all cursor-pointer">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              formData.bermasyarakat.paraf
                                ? "bg-[var(--secondary)] border-[var(--secondary)]"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {formData.bermasyarakat.paraf && (
                              <Save className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
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
                          />
                          <span className="text-sm text-gray-600">
                            Saya menyatakan kegiatan ini diketahui oleh Orang
                            Tua / Wali / RT setempat (Paraf)
                          </span>
                        </label>
                      </div>
                    </div>
                    <SaveButton
                      onClick={() =>
                        handleSectionSubmit(
                          "bermasyarakat",
                          formData.bermasyarakat
                        )
                      }
                    />
                  </SectionCard>

                  {/* Belajar */}
                  <SectionCard title="Belajar Mandiri" icon={BookOpen}>
                    <div className="space-y-6">
                      <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                        <span className="block text-sm font-medium text-gray-800 mb-3">
                          Apakah kamu belajar mandiri hari ini?
                        </span>
                        <div className="flex gap-4">
                          {[true, false].map((val) => (
                            <label
                              key={`bel-${val}`}
                              className="flex items-center gap-2 cursor-pointer group"
                            >
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                  formData.belajar.yaAtauTidak === val
                                    ? "border-[var(--secondary)] bg-[var(--secondary)]"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {formData.belajar.yaAtauTidak === val && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <input
                                type="radio"
                                className="hidden"
                                checked={formData.belajar.yaAtauTidak === val}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    belajar: {
                                      ...formData.belajar,
                                      yaAtauTidak: val,
                                    },
                                  })
                                }
                              />
                              <span className="text-sm text-gray-600">
                                {val ? "Ya, saya belajar" : "Tidak"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.belajar.yaAtauTidak && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Materi yang dipelajari
                          </label>
                          <Select
                            value={formData.belajar.deskripsi}
                            onChange={(val) =>
                              setFormData({
                                ...formData,
                                belajar: {
                                  ...formData.belajar,
                                  deskripsi: val,
                                },
                              })
                            }
                            options={BELAJAR_OPTIONS}
                            placeholder="Topik belajar..."
                          />
                        </div>
                      )}
                    </div>
                    <SaveButton
                      onClick={() =>
                        handleSectionSubmit("belajar", formData.belajar)
                      }
                    />
                  </SectionCard>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Snackbar Notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 transform transition-all duration-300 z-[100] ${
          snackbarVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        {snackbar && (
          <div
            className={`px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 border ${
              snackbar.type === "success"
                ? "bg-white text-emerald-600 border-emerald-100"
                : "bg-white text-rose-600 border-rose-100"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                snackbar.type === "success" ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="font-medium text-sm text-gray-800">
              {snackbar.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
