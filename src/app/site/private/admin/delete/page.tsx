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
  const [, setTotalEntries] = useState<number | null>(null);
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
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {/* Header */}
            <div className="mb-8 md:mb-10 w-full text-center md:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Hapus Kegiatan Siswa
              </h1>
              <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                Pilih siswa dan bulan untuk menghapus seluruh catatan kegiatan
                dari database secara permanen.
              </p>
            </div>

            <div className="w-full">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
                {feedback && (
                  <div
                    className={`mb-6 rounded-xl border px-4 py-3 text-sm flex items-center gap-2 ${feedbackClassName}`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        feedback.type === "error"
                          ? "bg-rose-500"
                          : "bg-green-500"
                      }`}
                    ></div>
                    {feedback.text}
                  </div>
                )}

                <form onSubmit={handleDelete} className="space-y-6">
                  <div>
                    <label
                      htmlFor="student"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Pilih Siswa
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
                          : "Cari nama siswa..."
                      }
                      className="w-full"
                      disabled={isLoadingStudents || students.length === 0}
                      searchable
                    />
                    {isLoadingStudents && (
                      <p className="mt-2 text-xs text-gray-500">
                        Mengambil daftar siswa...
                      </p>
                    )}
                    {selectedStudentMeta && (
                      <p className="mt-2 text-xs text-gray-400">
                        {selectedStudentMeta.kelas || "Kelas belum diatur"} •
                        NISN {selectedStudentMeta.nisn}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="month"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Pilih Bulan
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
                            : "Pilih bulan kegiatan"
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
                    {selectedMonthMeta && (
                      <p className="mt-2 text-xs text-blue-600 font-medium">
                        Ditemukan {selectedMonthMeta.entryCount} catatan
                        kegiatan.
                      </p>
                    )}
                  </div>

                  {/* Danger Zone Block */}
                  <div className="pt-4 mt-6 border-t border-gray-100">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm border border-rose-100">
                          <Trash2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-gray-900 mb-1">
                            Area Berbahaya
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            Tindakan ini akan{" "}
                            <span className="font-semibold text-rose-600">
                              menghapus permanen
                            </span>{" "}
                            semua catatan kegiatan untuk siswa dan bulan yang
                            dipilih. Data yang dihapus tidak dapat dikembalikan.
                          </p>
                          <button
                            type="submit"
                            disabled={
                              !selectedStudent ||
                              !selectedMonth ||
                              isDeleting ||
                              isLoadingMonths
                            }
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting
                              ? "Memproses..."
                              : "Hapus Data Kegiatan"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Konfirmasi Delete */}
      {showConfirmModal && pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 text-rose-500">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Konfirmasi Penghapusan
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Apakah Anda yakin ingin menghapus data kegiatan ini?
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Siswa</span>
                <span className="font-semibold text-gray-900">
                  {pendingDelete.studentName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Bulan</span>
                <span className="font-semibold text-gray-900">
                  {pendingDelete.monthName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Data</span>
                <span className="font-bold text-rose-600">
                  {pendingDelete.entryCount} Catatan
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="flex-1 py-3 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? "..." : "Ya, Hapus Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
