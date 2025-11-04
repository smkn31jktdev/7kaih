"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { Users, Pencil, Save, Loader2, Search, X, Trash } from "lucide-react";
import { SnackbarProvider, useSnackbar } from "notistack";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";

interface StudentItem {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  walas?: string;
  isOnline?: boolean;
}

interface EditFormState {
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  password: string;
}

function EditSiswaContent() {
  const { enqueueSnackbar } = useSnackbar();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    nisn: "",
    nama: "",
    kelas: "",
    walas: "",
    password: "",
  });

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setError("Token admin tidak ditemukan. Silakan login kembali.");
          setStudents([]);
          return;
        }

        const response = await fetch("/api/admin/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Gagal memuat data siswa");
        }

        const data = await response.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error("Fetch students error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data siswa"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }

    const term = searchTerm.toLowerCase();
    return students.filter((student) => {
      return (
        student.nama.toLowerCase().includes(term) ||
        student.nisn.toLowerCase().includes(term) ||
        student.kelas.toLowerCase().includes(term) ||
        (student.walas?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [students, searchTerm]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleEditClick = (student: StudentItem) => {
    setSelectedStudent(student);
    setEditForm({
      nisn: student.nisn,
      nama: student.nama,
      kelas: student.kelas,
      walas: student.walas || "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedStudent(null);
    setEditForm({
      nisn: "",
      nama: "",
      kelas: "",
      walas: "",
      password: "",
    });
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStudent) {
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        enqueueSnackbar("Sesi berakhir. Silakan login ulang.", {
          variant: "error",
        });
        return;
      }

      const payload: Record<string, string> = {
        nisn: editForm.nisn.trim(),
        nama: editForm.nama.trim(),
        kelas: editForm.kelas.trim(),
        walas: editForm.walas.trim(),
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const response = await fetch(
        `/api/admin/students/${selectedStudent.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gagal memperbarui data siswa");
      }

      enqueueSnackbar("Data siswa berhasil diperbarui", {
        variant: "success",
      });

      setStudents((prev) =>
        prev.map((student) =>
          student.id === selectedStudent.id
            ? {
                ...student,
                nama: payload.nama,
                kelas: payload.kelas,
                nisn: payload.nisn,
                walas: payload.walas,
              }
            : student
        )
      );

      closeModal();
    } catch (err) {
      console.error("Update student error:", err);
      enqueueSnackbar(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui data",
        { variant: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedStudent) {
      return;
    }
    setIsDeleteConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }
    setIsDeleteConfirmOpen(false);
  };

  const handleConfirmDeleteStudent = async () => {
    if (!selectedStudent) {
      return;
    }

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        enqueueSnackbar("Sesi berakhir. Silakan login ulang.", {
          variant: "error",
        });
        return;
      }

      const response = await fetch(
        `/api/admin/students/${selectedStudent.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus siswa");
      }

      setStudents((prev) =>
        prev.filter((student) => student.id !== selectedStudent.id)
      );

      enqueueSnackbar("Siswa berhasil dihapus", {
        variant: "success",
      });

      closeModal();
    } catch (err) {
      console.error("Delete student error:", err);
      enqueueSnackbar(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus siswa",
        { variant: "error" }
      );
    } finally {
      setIsDeleting(false);
    }
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
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />
                      <span>Edit Data Siswa</span>
                    </h1>
                    <p className="text-blue-100 text-xs sm:text-sm md:text-base lg:text-lg max-w-3xl mx-auto">
                      Kelola data siswa yang sudah terdaftar dan perbarui
                      informasi mereka.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                        placeholder="Cari nama, NISN, kelas, atau walas"
                      />
                    </div>
                    <div className="text-sm text-slate-600">
                      Total siswa:{" "}
                      <span className="font-semibold">{students.length}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {error}
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                          <tr>
                            <th className="px-4 py-3">No</th>
                            <th className="px-4 py-3">NISN</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Guru Wali</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {isLoading ? (
                            [...Array(5)].map((_, index) => (
                              <tr
                                key={`skeleton-${index}`}
                                className="animate-pulse"
                              >
                                <td className="px-4 py-4">
                                  <div className="h-4 w-6 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="h-4 w-24 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="h-4 w-40 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="h-4 w-16 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="h-4 w-32 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="mx-auto h-4 w-16 rounded bg-slate-200" />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="mx-auto h-8 w-20 rounded-full bg-slate-200" />
                                </td>
                              </tr>
                            ))
                          ) : filteredStudents.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-12 text-center text-sm text-slate-500"
                              >
                                {searchTerm
                                  ? "Tidak ditemukan siswa yang sesuai dengan pencarian."
                                  : "Belum ada data siswa untuk ditampilkan."}
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map((student, index) => (
                              <tr
                                key={student.id}
                                className="hover:bg-slate-50/80 transition-colors"
                              >
                                <td className="px-4 py-4 align-top text-sm text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-4 align-top font-medium text-slate-700">
                                  {student.nisn}
                                </td>
                                <td className="px-4 py-4 align-top">
                                  <div className="font-semibold text-slate-800">
                                    {student.nama}
                                  </div>
                                </td>
                                <td className="px-4 py-4 align-top text-slate-700">
                                  {student.kelas}
                                </td>
                                <td className="px-4 py-4 align-top text-slate-700">
                                  {student.walas || "-"}
                                </td>
                                <td className="px-4 py-4 align-top text-center">
                                  <span
                                    className={`inline-flex w-full items-center justify-center rounded-full px-3 py-1 text-xs font-medium ${
                                      student.isOnline
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                        : "bg-slate-100 text-slate-500 border border-slate-200"
                                    }`}
                                  >
                                    {student.isOnline ? "Online" : "Offline"}
                                  </span>
                                </td>
                                <td className="px-4 py-4 align-top text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleEditClick(student)}
                                    className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div
              style={{ backgroundColor: "var(--secondary)" }}
              className="flex items-center justify-between gap-4 px-6 py-5"
            >
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Siswa</h2>
                <p className="text-sm text-white/80">
                  Perbarui data {selectedStudent.nama}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="nisn"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    NISN
                  </label>
                  <input
                    id="nisn"
                    name="nisn"
                    type="text"
                    value={editForm.nisn}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Masukkan NISN"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nama"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Nama
                  </label>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    value={editForm.nama}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label
                    htmlFor="kelas"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Kelas
                  </label>
                  <input
                    id="kelas"
                    name="kelas"
                    type="text"
                    value={editForm.kelas}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Contoh: 10A, 11B"
                  />
                </div>

                <div>
                  <label
                    htmlFor="walas"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Guru Wali
                  </label>
                  <input
                    id="walas"
                    name="walas"
                    type="text"
                    value={editForm.walas}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Masukkan nama guru wali"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Password Baru (Opsional)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={editForm.password}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </button>
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isSubmitting || isDeleting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:bg-blue-400 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center gap-4 border-b border-slate-200 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <Trash className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Konfirmasi Hapus Siswa
                </h3>
                <p className="text-sm text-slate-500">
                  Tindakan ini bersifat permanen
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-slate-600">
                  Apakah Anda yakin ingin menghapus akun siswa ini dari
                  database?
                </p>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Nama
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.nama}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      NISN
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.nisn}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Kelas
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.kelas || "-"}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Guru Wali
                    </span>
                    <span className="font-semibold text-slate-800">
                      {selectedStudent.walas || "-"}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                  <span className="font-semibold">Peringatan:</span> Data siswa
                  yang dihapus{" "}
                  <span className="font-semibold">tidak dapat</span> dipulihkan.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditSiswaPage() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <EditSiswaContent />
    </SnackbarProvider>
  );
}
