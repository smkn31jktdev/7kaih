"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Select from "@/app/components/Select";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import { Trash2 } from "lucide-react";

interface StudentResponse {
  id: string;
  nama: string;
  kelas: string;
  nisn: string;
  walas?: string;
}

interface StudentOption {
  value: string;
  label: string;
  description: string;
  nama: string;
  kelas: string;
  nisn: string;
}

interface MonthOption {
  key: string;
  label: string;
  entryCount: number;
}

type FeedbackState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

export default function DeletePage() {
  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingMonths, setIsLoadingMonths] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [totalEntries, setTotalEntries] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    studentName: string;
    monthName: string;
    entryCount: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          if (active && isMountedRef.current) {
            setFeedback({
              type: "error",
              text: "Token admin tidak ditemukan. Silakan login kembali.",
            });
          }
          return;
        }

        const response = await fetch("/api/admin/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Gagal mengambil daftar siswa");
        }

        if (!Array.isArray(payload.students)) {
          throw new Error("Format respons siswa tidak valid");
        }

        if (!active || !isMountedRef.current) {
          return;
        }

        const mappedStudents: StudentOption[] = payload.students.map(
          (student: StudentResponse) => ({
            value: student.nisn,
            label: student.nama,
            description: `${student.kelas || "-"} • NISN ${student.nisn}`,
            nama: student.nama,
            kelas: student.kelas,
            nisn: student.nisn,
          })
        );

        setStudents(mappedStudents);
      } catch (error) {
        if (!active || !isMountedRef.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat daftar siswa.";
        setFeedback({ type: "error", text: message });
      } finally {
        if (active && isMountedRef.current) {
          setIsLoadingStudents(false);
        }
      }
    };

    void fetchStudents();

    return () => {
      active = false;
    };
  }, []);

  const fetchMonthsForStudent = useCallback(
    async (nisn: string, options: { clearFeedback?: boolean } = {}) => {
      if (options.clearFeedback) {
        setFeedback(null);
      }

      setIsLoadingMonths(true);
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          if (isMountedRef.current) {
            setFeedback({
              type: "error",
              text: "Token admin tidak ditemukan. Silakan login kembali.",
            });
          }
          return;
        }

        const response = await fetch(
          `/api/admin/delete?nisn=${encodeURIComponent(nisn)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || "Gagal mengambil data bulan");
        }

        const monthsData: MonthOption[] = Array.isArray(payload.months)
          ? payload.months
          : [];

        if (!isMountedRef.current) {
          return;
        }

        setMonths(monthsData);
        setTotalEntries(
          typeof payload.totalEntries === "number" ? payload.totalEntries : null
        );

        if (options.clearFeedback) {
          if (monthsData.length === 0) {
            setFeedback({
              type: "info",
              text: "Tidak ada data kegiatan untuk siswa ini.",
            });
          } else {
            setFeedback(null);
          }
        }
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        setMonths([]);
        setTotalEntries(null);

        const message =
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil data bulan.";
        setFeedback({ type: "error", text: message });
      } finally {
        if (isMountedRef.current) {
          setIsLoadingMonths(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!selectedStudent) {
      setMonths([]);
      setSelectedMonth("");
      setTotalEntries(null);
      return;
    }

    setSelectedMonth("");
    void fetchMonthsForStudent(selectedStudent, { clearFeedback: true });
  }, [selectedStudent, fetchMonthsForStudent]);

  const selectedStudentMeta = useMemo(
    () => students.find((student) => student.value === selectedStudent) ?? null,
    [students, selectedStudent]
  );

  const selectedMonthMeta = useMemo(
    () => months.find((month) => month.key === selectedMonth) ?? null,
    [months, selectedMonth]
  );

  const monthSelectOptions = useMemo(
    () =>
      months.map((month) => ({
        value: month.key,
        label: month.label,
        description: `${month.entryCount} catatan`,
      })),
    [months]
  );

  const feedbackClassName = useMemo(() => {
    if (!feedback) {
      return "";
    }

    if (feedback.type === "success") {
      return "border-green-200 bg-green-50 text-green-700";
    }
    if (feedback.type === "error") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    return "border-blue-200 bg-blue-50 text-blue-700";
  }, [feedback]);

  const handleDelete = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedStudent || !selectedMonth) {
        setFeedback({
          type: "error",
          text: "Pilih siswa dan bulan sebelum menghapus data.",
        });
        return;
      }

      const studentMeta = selectedStudentMeta;
      const monthMeta = selectedMonthMeta;

      // Tampilkan modal konfirmasi
      const studentName = studentMeta?.nama || "siswa ini";
      const monthName = monthMeta?.label || selectedMonth;
      const entryCount = monthMeta?.entryCount || 0;

      setPendingDelete({
        studentName,
        monthName,
        entryCount,
      });
      setShowConfirmModal(true);
    },
    [selectedMonth, selectedMonthMeta, selectedStudent, selectedStudentMeta]
  );

  const confirmDelete = useCallback(async () => {
    setShowConfirmModal(false);

    if (!selectedStudent || !selectedMonth) {
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setFeedback({
        type: "error",
        text: "Token admin tidak ditemukan. Silakan login kembali.",
      });
      setPendingDelete(null);
      return;
    }

    const studentMeta = selectedStudentMeta;
    const monthMeta = selectedMonthMeta;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nisn: selectedStudent,
          month: selectedMonth,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Gagal menghapus data kegiatan.");
      }

      const deletedCount =
        typeof payload.deletedCount === "number" ? payload.deletedCount : 0;
      const successMessage =
        payload.message ||
        `Berhasil menghapus ${deletedCount} catatan kegiatan ${
          studentMeta?.nama ?? "siswa"
        } untuk bulan ${monthMeta?.label ?? selectedMonth}.`;

      setFeedback({ type: "success", text: successMessage });
      setSelectedMonth("");
      await fetchMonthsForStudent(selectedStudent);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus data kegiatan.";
      setFeedback({ type: "error", text: message });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  }, [
    fetchMonthsForStudent,
    selectedMonth,
    selectedMonthMeta,
    selectedStudent,
    selectedStudentMeta,
  ]);

  const cancelDelete = useCallback(() => {
    setShowConfirmModal(false);
    setPendingDelete(null);
  }, []);

  const totalEntriesLabel = useMemo(() => {
    if (totalEntries === null) {
      return null;
    }
    if (totalEntries === 0) {
      return "Belum ada catatan kegiatan untuk siswa ini.";
    }
    return `Total ${totalEntries} catatan kegiatan tersimpan.`;
  }, [totalEntries]);

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
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6 md:mb-8">
              <div
                style={{ backgroundColor: "var(--secondary)" }}
                className="px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 rounded-tr-xl rounded-tl-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="w-full text-center">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 md:mb-3 flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
                      <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Hapus Kegiatan Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Pilih siswa dan bulan untuk menghapus seluruh catatan
                      kegiatan dari database.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6">
                  {feedback && (
                    <div
                      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${feedbackClassName}`}
                    >
                      {feedback.text}
                    </div>
                  )}

                  <form onSubmit={handleDelete} className="space-y-6">
                    <div>
                      <label
                        htmlFor="student"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Nama siswa
                      </label>
                      <Select
                        value={selectedStudent}
                        onChange={(value) => {
                          setSelectedStudent(value);
                        }}
                        options={students}
                        placeholder={
                          isLoadingStudents
                            ? "Memuat daftar siswa..."
                            : "Pilih siswa"
                        }
                        className="w-full"
                        disabled={isLoadingStudents || students.length === 0}
                        searchable
                      />
                      {isLoadingStudents && (
                        <p className="mt-2 text-xs text-slate-500">
                          Mengambil daftar siswa...
                        </p>
                      )}
                      {!isLoadingStudents && students.length === 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          Tidak ada siswa yang dapat dipilih.
                        </p>
                      )}
                      {selectedStudentMeta && (
                        <p className="mt-2 text-xs text-slate-500">
                          {selectedStudentMeta.kelas || "Kelas belum diatur"} •
                          NISN {selectedStudentMeta.nisn}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="month"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Bulan
                      </label>
                      <Select
                        value={selectedMonth}
                        onChange={(value) => {
                          setSelectedMonth(value);
                        }}
                        options={monthSelectOptions}
                        placeholder={
                          selectedStudent
                            ? isLoadingMonths
                              ? "Memuat data bulan..."
                              : months.length === 0
                              ? "Tidak ada data bulan"
                              : "Pilih bulan"
                            : "Pilih siswa terlebih dahulu"
                        }
                        className="w-full"
                        disabled={
                          !selectedStudent ||
                          isLoadingMonths ||
                          monthSelectOptions.length === 0
                        }
                        searchable
                      />
                      {isLoadingMonths && (
                        <p className="mt-2 text-xs text-slate-500">
                          Mengambil data bulan...
                        </p>
                      )}
                      {selectedMonthMeta && (
                        <p className="mt-2 text-xs text-slate-500">
                          Akan menghapus {selectedMonthMeta.entryCount} catatan
                          pada bulan {selectedMonthMeta.label}.
                        </p>
                      )}
                    </div>

                    {totalEntriesLabel && (
                      <p className="text-xs text-slate-500">
                        {totalEntriesLabel}
                      </p>
                    )}

                    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-red-800 mb-1">
                            Peringatan: Tindakan Permanen
                          </h3>
                          <p className="text-xs text-red-700 leading-relaxed">
                            Tindakan ini akan{" "}
                            <span className="font-bold">
                              menghapus data secara permanen
                            </span>{" "}
                            semua catatan kegiatan untuk bulan terpilih. Dan
                            data yang sudah dihapus{" "}
                            <span className="font-bold">
                              tidak dapat dikembalikan
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-2">
                      <button
                        type="submit"
                        disabled={
                          !selectedStudent ||
                          !selectedMonth ||
                          isDeleting ||
                          isLoadingMonths
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "Menghapus..." : "Hapus Data"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Konfirmasi Delete */}
      {showConfirmModal && pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Konfirmasi Penghapusan
                </h3>
                <p className="text-sm text-slate-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600">
                  Apakah Anda yakin ingin menghapus data kegiatan berikut?
                </p>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Nama Siswa:
                    </span>
                    <span className="text-sm font-semibold text-slate-800 text-right">
                      {pendingDelete.studentName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Bulan:
                    </span>
                    <span className="text-sm font-semibold text-slate-800 text-right">
                      {pendingDelete.monthName}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Jumlah Catatan:
                    </span>
                    <span className="text-sm font-semibold text-red-600 text-right">
                      {pendingDelete.entryCount} catatan
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <p className="text-xs text-red-700 leading-relaxed">
                      <span className="font-semibold">Peringatan:</span> Semua
                      data yang dihapus akan hilang secara permanen dan tidak
                      dapat dikembalikan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 className="h-4 w-4" />
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
