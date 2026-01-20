"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import { DatePicker } from "@/app/components/DatePicker";
import { Calendar, Users } from "lucide-react";

// Import components from kegiatan folder
import {
  BangunSection,
  TidurSection,
  IbadahSection,
  MakanSection,
  OlahragaSection,
  BelajarSection,
  BermasyarakatSection,
} from "@/app/components/dashboard/student/kegiatan";

// Import types and constants from const folder
import {
  BeribadahForm,
  BeribadahBooleanKey,
  BERIBADAH_BOOLEAN_FIELDS,
  createDefaultBeribadah,
} from "@/app/components/dashboard/student/const/ibadah";
import {
  RamadhanForm,
  RAMADHAN_BOOLEAN_FIELDS,
  createDefaultRamadhan,
  isRamadhanPeriod,
} from "@/app/components/dashboard/student/const/ramadhan/ramadhan";

interface StudentData {
  nama: string;
  nisn: string;
  kelas: string;
}

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
    ramadhan: createDefaultRamadhan(),
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
              existingBeribadah.zakatInfaqSedekah ?? "",
            );
          }
        }
        kegiatan["beribadah"] = normalizedBeribadah;

        // Normalize ramadhan data
        const existingRamadhan = kegiatan.ramadhan as
          | Partial<RamadhanForm>
          | undefined;
        const normalizedRamadhan = createDefaultRamadhan();
        if (existingRamadhan) {
          RAMADHAN_BOOLEAN_FIELDS.forEach(({ key }) => {
            normalizedRamadhan[key] = Boolean(existingRamadhan[key]);
          });
        }
        kegiatan["ramadhan"] = normalizedRamadhan;

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
    sectionData: Record<string, unknown>,
  ) => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        router.push("/site/student/login");
        return;
      }

      const payloadSectionData = JSON.parse(
        JSON.stringify(sectionData),
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
          <div className="w-full px-3 sm:px-4 lg:px-6 py-6 md:py-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- Row 1: Meta Data & Tidur/Bangun --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Card 1: Select Date */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--secondary)]" />
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

                {/* Card 2: Student Info */}
                <div className="bg-[var(--secondary)]/5 rounded-3xl p-6 border border-[var(--secondary)]/10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[var(--secondary)]">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--secondary)] uppercase tracking-wider">
                      Data Siswa
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-[var(--secondary)]/10">
                      <span className="text-gray-500">Nama</span>
                      <span className="font-semibold text-gray-800 text-right truncate pl-2">
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

                {/* Card 3: Bangun Pagi */}
                <BangunSection
                  data={formData.bangunPagi}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, bangunPagi: data }))
                  }
                  onSave={() =>
                    handleSectionSubmit("bangunPagi", formData.bangunPagi)
                  }
                />

                {/* Card 4: Tidur Malam */}
                <TidurSection
                  data={formData.tidur}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, tidur: data }))
                  }
                  onSave={() => handleSectionSubmit("tidur", formData.tidur)}
                />
              </div>

              {/* --- Row 2: Beribadah (Focus Area) --- */}
              <IbadahSection
                data={formData.beribadah}
                ramadhanData={formData.ramadhan}
                currentDate={formData.tanggal}
                onChange={(data) =>
                  setFormData((prev) => ({ ...prev, beribadah: data }))
                }
                onRamadhanChange={(data) =>
                  setFormData((prev) => ({ ...prev, ramadhan: data }))
                }
                onSave={async () => {
                  // Save beribadah data
                  await handleSectionSubmit("beribadah", formData.beribadah);
                  // If during Ramadhan, also save ramadhan data (stored in same kegiatan document)
                  if (isRamadhanPeriod(formData.tanggal)) {
                    await handleSectionSubmit("ramadhan", formData.ramadhan);
                  }
                }}
              />

              {/* --- Row 3: Makan, Olahraga, Belajar --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Makan Sehat */}
                <MakanSection
                  data={formData.makanSehat}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, makanSehat: data }))
                  }
                  onSave={() =>
                    handleSectionSubmit("makanSehat", formData.makanSehat)
                  }
                />

                {/* Olahraga */}
                <OlahragaSection
                  data={formData.olahraga}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, olahraga: data }))
                  }
                  onSave={() =>
                    handleSectionSubmit("olahraga", formData.olahraga)
                  }
                />

                {/* Belajar */}
                <BelajarSection
                  data={formData.belajar}
                  onChange={(data) =>
                    setFormData((prev) => ({ ...prev, belajar: data }))
                  }
                  onSave={() =>
                    handleSectionSubmit("belajar", formData.belajar)
                  }
                />
              </div>

              {/* --- Row 4: Bermasyarakat (Full Width) --- */}
              <BermasyarakatSection
                data={formData.bermasyarakat}
                onChange={(data) =>
                  setFormData((prev) => ({ ...prev, bermasyarakat: data }))
                }
                onSave={() =>
                  handleSectionSubmit("bermasyarakat", formData.bermasyarakat)
                }
              />
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
