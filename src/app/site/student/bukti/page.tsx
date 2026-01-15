"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import {
  FileImage,
  Youtube,
  CheckCircle,
  Upload,
  PlayCircle,
} from "lucide-react";

interface StudentData {
  nama: string;
  nisn: string;
  kelas: string;
}

interface BuktiData {
  _id?: string;
  nisn: string;
  nama: string;
  kelas: string;
  bulan: string;
  foto: string;
  linkYouTube: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function BuktiSiswa() {
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
    foto: null as File | null,
    linkYouTube: "",
  });

  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [hasSubmittedThisMonth, setHasSubmittedThisMonth] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");
  const [submittedBukti, setSubmittedBukti] = useState<BuktiData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudentData = useCallback(async () => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        router.push("/site/student/login");
        return;
      }
      const response = await fetch("/api/auth/student/me", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setStudentData({
        nama: data.student.nama,
        nisn: data.student.nisn,
        kelas: data.student.kelas,
      });
    } catch {
      router.push("/site/student/login");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const checkExistingBukti = useCallback(async () => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) return;
      const now = new Date();
      const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const response = await fetch(`/api/student/bukti?bulan=${bulan}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.bukti) {
        setHasSubmittedThisMonth(true);
        setSubmittedBukti(data.bukti);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStudentData();
    checkExistingBukti();

    const now = new Date();
    const monthNames = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    setCurrentMonth(`${monthNames[now.getMonth()]} ${now.getFullYear()}`);
  }, [fetchStudentData, checkExistingBukti]);

  const loadImage = async (fotoPath: string) => {
    if (!fotoPath || !fotoPath.startsWith("/uploads/bukti/")) {
      setImageDataUrl(null);
      return;
    }
    setImageLoading(true);
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) return;
      const filename = fotoPath.split("/").pop();
      const response = await fetch(`/api/uploads/bukti/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      setImageDataUrl(dataUrl);
    } catch {
      setImageDataUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    if (submittedBukti?.foto) {
      loadImage(submittedBukti.foto);
    }
  }, [submittedBukti]);

  useEffect(() => {
    if (snackbar) {
      setSnackbarVisible(true);
      const hideTimer = setTimeout(() => setSnackbarVisible(false), 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [snackbar]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileSidebar = () =>
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmittedThisMonth) return;
    if (!formData.foto) {
      setSnackbar({ message: "Silakan upload foto bukti", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        router.push("/site/student/login");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("foto", formData.foto);
      formDataToSend.append("linkYouTube", formData.linkYouTube);

      const response = await fetch("/api/student/bukti", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menyimpan bukti");

      setSnackbar({ message: data.message, type: "success" });
      setHasSubmittedThisMonth(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Gagal";
      setSnackbar({ message: msg, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ foto: null, linkYouTube: "" });
    setFotoPreview(null);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, foto: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setFotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFotoPreview(null);
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="w-full mx-auto space-y-6">
            {/* Header */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Dokumentasi Kegiatan
              </h1>
              <p className="text-gray-500 text-sm">
                Kumpulkan bukti kegiatanmu untuk bulan{" "}
                <span className="font-semibold text-[var(--secondary)] whitespace-nowrap">
                  {currentMonth}
                </span>
              </p>
            </div>

            {hasSubmittedThisMonth && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-800">
                    Bukti Telah Dikumpulkan
                  </h3>
                  <p className="text-sm text-emerald-600 mt-1">
                    Terima kasih! Kamu sudah mengumpulkan bukti kegiatan untuk
                    bulan ini. Dikumpulkan pada:{" "}
                    <span className="font-semibold">
                      {submittedBukti &&
                        new Date(submittedBukti.createdAt).toLocaleDateString(
                          "id-ID"
                        )}
                    </span>
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit">
                <h3 className="font-bold text-gray-900 mb-4">
                  Informasi Siswa
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Nama
                    </label>
                    <p className="font-medium text-gray-800">
                      {studentData.nama}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      NISN
                    </label>
                    <p className="font-medium text-gray-800">
                      {studentData.nisn}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Kelas
                    </label>
                    <p className="font-medium text-gray-800">
                      {studentData.kelas}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Upload Section */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileImage className="w-5 h-5 text-blue-500" />
                      Foto Dokumentasi
                    </h3>

                    {hasSubmittedThisMonth && submittedBukti ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        {imageLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            Loading...
                          </div>
                        ) : imageDataUrl ? (
                          <Image
                            src={imageDataUrl}
                            alt="Bukti"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            Tidak ada gambar
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label
                          className={`
                                            flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                                            ${
                                              fotoPreview
                                                ? "border-blue-400 bg-blue-50"
                                                : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                                            }
                                        `}
                        >
                          {fotoPreview ? (
                            <div className="relative w-full h-full p-2">
                              <Image
                                src={fotoPreview}
                                alt="Preview"
                                fill
                                className="object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold text-blue-500">
                                  Klik upload
                                </span>
                              </p>
                              <p className="text-xs text-gray-400">
                                PNG / JPG (MAX. 5MB)
                              </p>
                            </div>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            accept="image/png,image/jpeg"
                            onChange={handleFotoChange}
                            disabled={hasSubmittedThisMonth}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Youtube Section */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      Link Video (YouTube)
                    </h3>

                    {hasSubmittedThisMonth && submittedBukti ? (
                      submittedBukti.linkYouTube ? (
                        <a
                          href={submittedBukti.linkYouTube}
                          target="_blank"
                          className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <PlayCircle className="w-5 h-5" />
                          <span className="text-sm font-medium truncate flex-1">
                            {submittedBukti.linkYouTube}
                          </span>
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Tidak ada link video.
                        </p>
                      )
                    ) : (
                      <input
                        type="url"
                        className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-red-300 focus:ring-0 rounded-xl transition-all text-sm"
                        placeholder="https://youtube.com/..."
                        value={formData.linkYouTube}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            linkYouTube: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>

                  {!hasSubmittedThisMonth && (
                    <div className="pt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-2.5 rounded-xl bg-[var(--secondary)] text-white font-medium hover:bg-teal-600 transition-all shadow-sm shadow-teal-100 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? "Mengirim..." : "Kirim Bukti"}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Snackbar */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 transform transition-all duration-300 z-[100] ${
          snackbarVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0"
        }`}
      >
        {snackbar && (
          <div
            className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
              snackbar.type === "success"
                ? "bg-gray-900 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span>{snackbar.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
