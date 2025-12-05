"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import { FileImage, ExternalLink, X } from "lucide-react";
import Image from "next/image";

interface Bukti {
  nisn: string;
  nama: string;
  kelas: string;
  bulan: string;
  foto: string;
  linkYouTube: string;
  // Field baru untuk deployment
  imageUrl?: string;
  imageId?: string;
  imageData?: string;
  imageMimeType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminBuktiPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [buktiList, setBuktiList] = useState<Bukti[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBukti, setSelectedBukti] = useState<Bukti | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  useEffect(() => {
    const fetchBukti = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          console.error("No token found");
          setLoading(false);
          return;
        }
        const response = await fetch("/api/admin/bukti", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bukti");
        }
        const data: Bukti[] = await response.json();
        setBuktiList(data);
      } catch (error) {
        console.error("Error fetching bukti:", error);
        setError(error instanceof Error ? error.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchBukti();
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

  const openModal = (bukti: Bukti) => {
    setSelectedBukti(bukti);
    setIsModalOpen(true);
    // Gunakan imageData dari database langsung (sudah Base64)
    if (bukti.imageData && bukti.imageMimeType) {
      setImageDataUrl(`data:${bukti.imageMimeType};base64,${bukti.imageData}`);
    } else if (bukti.imageUrl) {
      // Fallback ke imageUrl jika tersedia
      setImageDataUrl(bukti.imageUrl);
    } else {
      // Fallback ke load dari file untuk data lama
      loadImageFromFile(bukti.foto);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBukti(null);
    setImageDataUrl(null);
    setImageLoading(false);
  };

  // Fallback function untuk data lama yang masih menggunakan file lokal
  const loadImageFromFile = async (fotoPath: string) => {
    if (!fotoPath || !fotoPath.startsWith("/uploads/bukti/")) {
      setImageDataUrl(null);
      return;
    }

    setImageLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
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

  const downloadImage = () => {
    if (!imageDataUrl || !selectedBukti) return;

    // File download: bukti_nama-siswa_bulan.jpg/png
    const namaFormatted = selectedBukti.nama.toLowerCase().replace(/\s+/g, "-");
    const bulanFormatted = selectedBukti.bulan.replace("-", "");
    const extension = imageDataUrl.includes("data:image/png") ? "png" : "jpg";
    const filename = `bukti_${namaFormatted}_${bulanFormatted}.${extension}`;

    // Create download link
    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBulan = (bulan: string) => {
    const [year, month] = bulan.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("id-ID", { year: "numeric", month: "long" });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminNavbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
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
                      <FileImage className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Bukti Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pantau bukti kegiatan siswa berupa foto dan link YouTube.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2 sm:p-4">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                  <div className="bg-white rounded-2xl p-5 border border-emerald-100">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          Daftar Bukti Siswa
                        </h3>
                        <p className="text-sm text-slate-500">
                          Lihat bukti kegiatan siswa dalam bentuk foto dan video
                          YouTube.
                        </p>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        Memuat bukti...
                      </div>
                    ) : error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                        {error}
                      </div>
                    ) : buktiList.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                        Belum ada bukti siswa.
                      </div>
                    ) : (
                      <div className="h-64 md:h-72 lg:h-[18rem] overflow-y-auto overscroll-contain scrollbar-hide">
                        <div className="space-y-3">
                          {buktiList.map((bukti) => (
                            <div
                              key={`${bukti.nisn}-${bukti.bulan}`}
                              className="flex items-center justify-between gap-4 rounded-2xl bg-white/80 border border-emerald-50 px-4 py-4 hover:bg-emerald-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                  <FileImage className="w-6 h-6 text-emerald-700" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {bukti.nama}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {bukti.kelas || "-"} •{" "}
                                    {formatBulan(bukti.bulan)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => openModal(bukti)}
                                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                              >
                                Lihat Bukti
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && selectedBukti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 pt-10 pb-6 sm:pb-10">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div
              className="flex items-center justify-between gap-4 rounded-t-3xl px-6 py-5 flex-shrink-0"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Bukti Kegiatan Siswa
                </h2>
                <p className="text-sm text-white/80">
                  {selectedBukti.nama} • {formatBulan(selectedBukti.bulan)}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Nama
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedBukti.nama}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      NISN
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedBukti.nisn}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Kelas
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedBukti.kelas || "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      Foto Bukti
                    </h3>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                      <div className="relative w-full h-64">
                        {imageLoading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-2"></div>
                              <p className="text-sm text-slate-500">
                                Memuat gambar...
                              </p>
                            </div>
                          </div>
                        ) : imageDataUrl ? (
                          <Image
                            src={imageDataUrl}
                            alt="Bukti kegiatan"
                            fill
                            className="object-cover"
                            onError={() => {
                              setImageDataUrl(null);
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-500 text-sm">
                            <div className="text-center">
                              <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                              <p>Foto belum tersedia</p>
                              <p className="text-xs mt-1">
                                File: {selectedBukti.foto}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                      Link YouTube
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={selectedBukti.linkYouTube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka YouTube
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedBukti.linkYouTube
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        Salin Link
                      </button>
                      {imageDataUrl && (
                        <button
                          type="button"
                          onClick={downloadImage}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          <FileImage className="h-4 w-4" />
                          Download Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
