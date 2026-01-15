"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import {
  FileImage,
  ExternalLink,
  X,
  Image as ImageIcon,
  Download,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";

interface Bukti {
  nisn: string;
  nama: string;
  kelas: string;
  bulan: string;
  foto: string;
  linkYouTube: string;
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
    if (bukti.imageData && bukti.imageMimeType) {
      setImageDataUrl(`data:${bukti.imageMimeType};base64,${bukti.imageData}`);
    } else if (bukti.imageUrl) {
      setImageDataUrl(bukti.imageUrl);
    } else {
      loadImageFromFile(bukti.foto);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBukti(null);
    setImageDataUrl(null);
    setImageLoading(false);
  };

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

    const namaFormatted = selectedBukti.nama.toLowerCase().replace(/\s+/g, "-");
    const bulanFormatted = selectedBukti.bulan.replace("-", "");
    const extension = imageDataUrl.includes("data:image/png") ? "png" : "jpg";
    const filename = `bukti_${namaFormatted}_${bulanFormatted}.${extension}`;

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
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            <div className="mb-8 md:mb-10 text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Bukti Kegiatan
              </h1>
              <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                Tinjau dokumentasi foto dan video YouTube yang diunggah oleh
                siswa setiap bulannya.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[var(--secondary)]">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Daftar Unggahan</h3>
                </div>
              </div>

              <div className="p-0">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-gray-50/50 animate-pulse"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
                      <X className="w-8 h-8" />
                    </div>
                    <h3 className="text-red-900 font-medium mb-1">
                      Gagal Memuat Data
                    </h3>
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                ) : buktiList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">
                      Belum ada bukti
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Belum ada siswa yang mengunggah bukti kegiatan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-50/30">
                    {buktiList.map((bukti) => (
                      <div
                        key={`${bukti.nisn}-${bukti.bulan}`}
                        className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                              {bukti.nama.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {bukti.nama}
                              </p>
                              <p className="text-xs text-gray-500">
                                {bukti.kelas}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                            {formatBulan(bukti.bulan)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => openModal(bukti)}
                            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Lihat Foto
                          </button>
                          {bukti.linkYouTube && (
                            <a
                              href={bukti.linkYouTube}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Video YouTube
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && selectedBukti && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Detail Bukti
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedBukti.nama} • {formatBulan(selectedBukti.bulan)}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Col: Image */}
                <div className="flex-1 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-h-[300px] flex items-center justify-center relative">
                  {imageLoading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full" />
                      <span className="text-xs">Memuat...</span>
                    </div>
                  ) : imageDataUrl ? (
                    <div className="relative w-full h-full min-h-[400px]">
                      <Image
                        src={imageDataUrl}
                        alt="Preview Bukti"
                        fill
                        className="object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-20">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Gambar tidak tersedia</p>
                    </div>
                  )}
                </div>

                {/* Right Col: Info & Actions */}
                <div className="w-full lg:w-80 space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div>
                      <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                        Nama Siswa
                      </label>
                      <p className="text-gray-900 font-semibold">
                        {selectedBukti.nama}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                        NISN
                      </label>
                      <p className="text-gray-900 font-medium font-mono">
                        {selectedBukti.nisn}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                        Kelas
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedBukti.kelas}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                        Bulan
                      </label>
                      <p className="text-gray-900 font-medium">
                        {formatBulan(selectedBukti.bulan)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm">
                      Tautan & Aksi
                    </h4>
                    {selectedBukti.linkYouTube ? (
                      <div className="space-y-2">
                        <a
                          href={selectedBukti.linkYouTube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-100"
                        >
                          <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium truncate">
                            Buka di YouTube
                          </div>
                        </a>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              selectedBukti.linkYouTube
                            )
                          }
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors w-full"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <div className="text-sm font-medium">Salin Link</div>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Tidak ada link YouTube.
                      </p>
                    )}

                    {imageDataUrl && (
                      <button
                        onClick={downloadImage}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[var(--secondary)] text-white font-medium hover:bg-teal-700 transition-colors shadow-sm mt-4"
                      >
                        <Download className="w-4 h-4" />
                        Download Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
