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
        <main className="flex-1 overflow-auto bg-gray-50/50">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {/* Header */}
            <div className="mb-8 md:mb-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="text-center md:text-left w-full md:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                  Edit Data Siswa
                </h1>
                <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                  Kelola dan perbarui informasi siswa yang terdaftar.
                </p>
              </div>

              {/* Search Bar - Positioned in header for better UX on desktop */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-[var(--secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all shadow-sm placeholder:text-gray-400"
                  placeholder="Cari nama, NISN, atau kelas..."
                />
              </div>
            </div>

            <div className="w-full">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Users className="w-4 h-4 text-[var(--secondary)]" />
                    <span>Daftar Siswa</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs border border-gray-200">
                      {students.length}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mx-6 mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    {error}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                      <tr>
                        <th className="px-6 py-4">No</th>
                        <th className="px-6 py-4">NISN</th>
                        <th className="px-6 py-4">Nama</th>
                        <th className="px-6 py-4">Kelas</th>
                        <th className="px-6 py-4">Guru Wali</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white text-gray-700 text-sm">
                      {isLoading ? (
                        [...Array(5)].map((_, index) => (
                          <tr
                            key={`skeleton-${index}`}
                            className="animate-pulse"
                          >
                            <td className="px-6 py-4">
                              <div className="h-4 w-6 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-24 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-40 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-16 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-32 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="mx-auto h-4 w-16 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="mx-auto h-8 w-20 rounded-full bg-gray-100" />
                            </td>
                          </tr>
                        ))
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-16 text-center text-gray-400"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Search className="w-8 h-8 opacity-20" />
                              <p>
                                {searchTerm
                                  ? "Tidak ditemukan data yang sesuai."
                                  : "Belum ada data siswa."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, index) => (
                          <tr
                            key={student.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4 font-medium text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {student.nisn}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {student.nama}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {student.kelas}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {student.walas || "-"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  student.isOnline
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {student.isOnline ? "Online" : "Offline"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleEditClick(student)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all cursor-pointer"
                                title="Edit Siswa"
                              >
                                <Pencil className="h-4 w-4" />
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
        </main>
      </div>

      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Data Siswa
                  </h2>
                  <p className="text-sm text-gray-500">
                    Perbarui informasi untuk {selectedStudent.nama}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <form
                id="edit-student-form"
                onSubmit={handleUpdateStudent}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      NISN
                    </label>
                    <input
                      name="nisn"
                      value={editForm.nisn}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Nomor Induk Siswa Nasional"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Nama Lengkap
                    </label>
                    <input
                      name="nama"
                      value={editForm.nama}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Nama Lengkap Siswa"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Kelas
                    </label>
                    <input
                      name="kelas"
                      value={editForm.kelas}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Contoh: 12 RPL 1"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Guru Wali
                    </label>
                    <input
                      name="walas"
                      value={editForm.walas}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Nama Wali Kelas"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Password Baru{" "}
                      <span className="text-gray-400 font-normal">
                        (Opsional)
                      </span>
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={editForm.password}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Biarkan kosong jika tidak ingin mengubah"
                    />
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                        <Trash className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-700">
                          Hapus Data Siswa
                        </p>
                        <p className="text-xs text-rose-600/80">
                          Tindakan ini tidak dapat dibatalkan.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteClick}
                      className="px-4 py-2 bg-white text-rose-600 text-xs font-bold rounded-xl border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
                    >
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-100 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                form="edit-student-form"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[var(--secondary)] text-white font-bold text-sm rounded-xl hover:brightness-110 shadow-lg shadow-[var(--secondary)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 text-rose-500">
                <Trash className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Hapus Data Siswa?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Apakah anda yakin ingin menghapus data siswa{" "}
                <span className="font-bold text-gray-800">
                  {selectedStudent?.nama}
                </span>
                ? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="flex-1 py-3 bg-gray-50 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStudent}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Ya, Hapus"
                )}
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
