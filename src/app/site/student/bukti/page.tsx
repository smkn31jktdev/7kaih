"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StudentSidebar from "@/app/components/dashboard/student/sidebar";
import StudentNavbar from "@/app/components/dashboard/student/navbar";
import { FileImage, Youtube } from "lucide-react";

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

  useEffect(() => {
    fetchStudentData();
    checkExistingBukti();

    // Set current month display
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submittedBukti?.foto) {
      loadImage(submittedBukti.foto);
    }
  }, [submittedBukti]);

  useEffect(() => {
    if (snackbar) {
      setSnackbarVisible(true);
      const hideTimer = setTimeout(() => {
        setSnackbarVisible(false);
      }, 3000);
      return () => clearTimeout(hideTimer);
    }
  }, [snackbar]);

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.bukti) {
        setHasSubmittedThisMonth(true);
        setSubmittedBukti(data.bukti);
      }
    } catch (error) {
      console.error("Error checking existing bukti:", error);
    }
  }, []);

  const loadImage = async (fotoPath: string) => {
    if (!fotoPath || !fotoPath.startsWith("/uploads/bukti/")) {
      setImageDataUrl(null);
      return;
    }

    setImageLoading(true);
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        setImageDataUrl(null);
        return;
      }

      const filename = fotoPath.split("/").pop();
      const response = await fetch(`/api/uploads/bukti/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load image");
      }

      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setImageDataUrl(dataUrl);
    } catch (error) {
      console.error("Error loading image:", error);
      setImageDataUrl(null);
    } finally {
      setImageLoading(false);
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

    // Double check - prevent submission if already submitted
    if (hasSubmittedThisMonth) {
      setSnackbar({
        message:
          "Bukti untuk bulan ini sudah dikumpulkan dan tidak dapat diubah",
        type: "error",
      });
      return;
    }

    if (!formData.foto) {
      setSnackbar({
        message: "Silakan upload foto bukti",
        type: "error",
      });
      return;
    }

    try {
      const token = localStorage.getItem("studentToken");
      if (!token) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        router.push("/site/student/login");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("foto", formData.foto);
      formDataToSend.append("linkYouTube", formData.linkYouTube);

      const response = await fetch("/api/student/bukti", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan bukti");
      }

      setSnackbar({
        message: data.message,
        type: "success",
      });

      setHasSubmittedThisMonth(true);
    } catch (error) {
      console.error("Error saving bukti:", error);
      setSnackbar({
        message:
          error instanceof Error ? error.message : "Gagal menyimpan bukti",
        type: "error",
      });
    }
  };

  const handleReset = () => {
    setFormData({
      foto: null,
      linkYouTube: "",
    });
    setFotoPreview(null);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({
      ...formData,
      foto: file,
    });

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFotoPreview(null);
    }
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
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header Skeleton */}
                <div
                  style={{ backgroundColor: "var(--secondary)" }}
                  className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-1 sm:mb-2 md:mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded animate-pulse"></div>
                      <div className="h-6 sm:h-8 md:h-10 bg-white/20 rounded animate-pulse w-48"></div>
                    </div>
                    <div className="h-4 sm:h-5 md:h-6 bg-blue-100/50 rounded animate-pulse w-64 mx-auto"></div>
                  </div>
                </div>

                {/* Form Content Skeleton */}
                <div className="p-6 sm:p-8 md:p-10">
                  {/* Basic Information Section Skeleton */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-6"></div>
                    <div className="mb-6">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                      <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2"></div>
                          <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bukti Section Skeleton */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-6"></div>
                    <div className="space-y-6">
                      {/* Foto Section Skeleton */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-48 mt-2"></div>
                          </div>
                        </div>
                      </div>

                      {/* YouTube Section Skeleton */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-2"></div>
                            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-56 mt-2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Skeleton */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-32"></div>
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-40"></div>
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
        <main
          className="flex-1 overflow-auto"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="text-center">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                    <FileImage className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                    <span>Kumpulkan Bukti</span>
                  </h1>
                  <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg">
                    Kumpulkan bukti kegiatanmu untuk bulan {currentMonth}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Informasi Siswa
                    </h2>

                    {/* Current Month */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Periode Pengumpulan
                      </label>
                      <input
                        type="text"
                        value={`Bulan ${currentMonth}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        readOnly
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
                          value={studentData.nama}
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
                          value={studentData.nisn}
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
                          value={studentData.kelas}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bukti Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      {hasSubmittedThisMonth
                        ? "Bukti Kegiatan yang Sudah Dikumpulkan"
                        : "Form Bukti Kegiatan"}
                    </h2>

                    <div className="space-y-6">
                      {/* Foto */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileImage className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Foto Bukti
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {hasSubmittedThisMonth && submittedBukti ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Foto yang Sudah Diupload
                              </label>
                              <div className="relative w-full max-w-xs h-48 border border-gray-300 rounded-lg shadow-sm overflow-hidden bg-gray-50">
                                {imageLoading ? (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
                                      <p className="text-sm text-gray-500">
                                        Memuat gambar...
                                      </p>
                                    </div>
                                  </div>
                                ) : imageDataUrl ? (
                                  <Image
                                    src={imageDataUrl}
                                    alt="Foto bukti kegiatan"
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm">
                                    <div className="text-center">
                                      <FileImage className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                      <p>Foto belum tersedia</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Foto bukti kegiatan yang sudah dikumpulkan pada{" "}
                                {new Date(
                                  submittedBukti.createdAt
                                ).toLocaleDateString("id-ID")}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload Foto (PNG/JPG)
                              </label>
                              <input
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={handleFotoChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={hasSubmittedThisMonth}
                                required
                              />
                              {fotoPreview && (
                                <div className="mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-2">
                                    Preview Foto:
                                  </p>
                                  <div className="relative w-full max-w-xs h-48 border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                                    <Image
                                      src={fotoPreview}
                                      alt="Preview foto bukti"
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                Upload foto bukti kegiatan (format PNG atau JPG,
                                maksimal 5MB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Link YouTube */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Youtube className="w-5 h-5 text-red-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Link YouTube
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {hasSubmittedThisMonth
                                ? "Link Video YouTube yang Sudah Dikumpulkan"
                                : "Link Video YouTube"}
                            </label>
                            <input
                              type="url"
                              value={
                                hasSubmittedThisMonth && submittedBukti
                                  ? submittedBukti.linkYouTube
                                  : formData.linkYouTube
                              }
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  linkYouTube: e.target.value,
                                })
                              }
                              placeholder="https://www.youtube.com/watch?v=..."
                              className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors ${
                                hasSubmittedThisMonth
                                  ? "bg-gray-50 text-gray-600 cursor-not-allowed"
                                  : "focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              }`}
                              disabled={hasSubmittedThisMonth}
                              required={!hasSubmittedThisMonth}
                              readOnly={hasSubmittedThisMonth}
                            />
                            {hasSubmittedThisMonth && submittedBukti && (
                              <div className="mt-2">
                                <a
                                  href={submittedBukti.linkYouTube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
                                >
                                  <Youtube className="w-4 h-4" />
                                  Lihat Video YouTube
                                </a>
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              {hasSubmittedThisMonth
                                ? `Link video YouTube yang dikumpulkan pada ${new Date(
                                    submittedBukti?.createdAt || ""
                                  ).toLocaleDateString("id-ID")}`
                                : "Masukkan link video YouTube sebagai bukti kegiatan"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!hasSubmittedThisMonth && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-8 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        disabled={hasSubmittedThisMonth}
                      >
                        Reset Form
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 rounded-lg text-white font-semibold hover:opacity-90 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: "var(--secondary)" }}
                        disabled={hasSubmittedThisMonth}
                      >
                        {hasSubmittedThisMonth
                          ? "Sudah Dikumpulkan"
                          : "Kumpulkan Bukti"}
                      </button>
                    </div>
                  )}

                  {hasSubmittedThisMonth && submittedBukti && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-green-800 font-medium">
                            Bukti berhasil dikumpulkan
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Dikumpulkan pada:{" "}
                          {new Date(submittedBukti.createdAt).toLocaleString(
                            "id-ID"
                          )}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Data bukti tidak dapat diubah setelah pengumpulan.
                          Silakan hubungi admin jika ada kesalahan.
                        </p>
                      </div>
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
