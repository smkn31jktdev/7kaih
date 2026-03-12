"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/app/components/dashboard/admin/sidebar";
import AdminNavbar from "@/app/components/dashboard/admin/navbar";
import { Users, Pencil, Save, Loader2, Search, X, Trash } from "lucide-react";
import { SnackbarProvider, useSnackbar } from "notistack";
import { useSessionTimeout } from "@/app/lib/useSessionTimeout";
import { useRouter } from "next/navigation";

interface AdminItem {
  id: string;
  nama: string;
  email: string;
  createdAt?: string;
}

interface EditFormState {
  nama: string;
  email: string;
  password: string;
}

function EditAdminContent() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    nama: "",
    email: "",
    password: "",
  });

  useSessionTimeout({
    timeoutMinutes: 30,
    redirectPath: "/site/private/admin/login?expired=1",
    tokenKey: "adminToken",
  });

  // Guard - only super admin
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("adminToken");
      if (!token) {
        enqueueSnackbar("Anda tidak memiliki akses ke halaman ini", {
          variant: "error",
        });
        setIsAllowed(false);
        router.replace("/site/private/admin");
        return;
      }

      try {
        const res = await fetch("/api/auth/admin/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          enqueueSnackbar("Anda tidak memiliki akses ke halaman ini", {
            variant: "error",
          });
          router.replace("/site/private/admin");
          return;
        }
        const data = await res.json();
        if (data?.user?.email !== "smkn31jktdev@gmail.com") {
          enqueueSnackbar("Anda tidak memiliki akses ke halaman ini", {
            variant: "error",
          });
          setIsAllowed(false);
          router.replace("/site/private/admin");
          return;
        }
        setIsAllowed(true);
      } catch {
        enqueueSnackbar("Terjadi kesalahan autentikasi", { variant: "error" });
        setIsAllowed(false);
        router.replace("/site/private/admin");
      }
    };

    checkAuth();
  }, [router, enqueueSnackbar]);

  useEffect(() => {
    if (isAllowed !== true) return;

    const fetchAdmins = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setError("Token admin tidak ditemukan. Silakan login kembali.");
          setAdmins([]);
          return;
        }

        const response = await fetch("/api/admin/admins", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Gagal memuat data admin");
        }

        const data = await response.json();
        setAdmins(data.admins || []);
      } catch (err) {
        console.error("Fetch admins error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil data admin",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, [isAllowed]);

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) {
      return admins;
    }

    const term = searchTerm.toLowerCase();
    return admins.filter((admin) => {
      return (
        admin.nama.toLowerCase().includes(term) ||
        admin.email.toLowerCase().includes(term)
      );
    });
  }, [admins, searchTerm]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleEditClick = (admin: AdminItem) => {
    setSelectedAdmin(admin);
    setEditForm({
      nama: admin.nama,
      email: admin.email,
      password: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDeleteConfirmOpen(false);
    setSelectedAdmin(null);
    setEditForm({
      nama: "",
      email: "",
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

  const handleUpdateAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdmin) {
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
        nama: editForm.nama.trim(),
        email: editForm.email.trim(),
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gagal memperbarui data admin");
      }

      enqueueSnackbar("Data admin berhasil diperbarui", {
        variant: "success",
      });

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === selectedAdmin.id
            ? {
                ...admin,
                nama: payload.nama,
                email: payload.email,
              }
            : admin,
        ),
      );

      closeModal();
    } catch (err) {
      console.error("Update admin error:", err);
      enqueueSnackbar(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui data",
        { variant: "error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!selectedAdmin) {
      return;
    }
    // Prevent deleting super admin
    if (selectedAdmin.email === "smkn31jktdev@gmail.com") {
      enqueueSnackbar("Super admin tidak dapat dihapus", { variant: "error" });
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

  const handleConfirmDeleteAdmin = async () => {
    if (!selectedAdmin) {
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

      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gagal menghapus admin");
      }

      setAdmins((prev) =>
        prev.filter((admin) => admin.id !== selectedAdmin.id),
      );

      enqueueSnackbar("Admin berhasil dihapus", {
        variant: "success",
      });

      closeModal();
    } catch (err) {
      console.error("Delete admin error:", err);
      enqueueSnackbar(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus admin",
        { variant: "error" },
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAllowed === null) {
    return null;
  }

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
                  Edit Data Admin
                </h1>
                <p className="text-gray-500 text-sm md:text-base mx-auto md:mx-0">
                  Kelola dan perbarui informasi admin yang terdaftar.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-[var(--secondary)] focus:outline-none focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all shadow-sm placeholder:text-gray-400"
                  placeholder="Cari nama atau email..."
                />
              </div>
            </div>

            <div className="w-full">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Users className="w-4 h-4 text-[var(--secondary)]" />
                    <span>Daftar Admin</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs border border-gray-200">
                      {admins.length}
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
                        <th className="px-6 py-4">Nama</th>
                        <th className="px-6 py-4">Email</th>
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
                              <div className="h-4 w-40 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="h-4 w-48 rounded bg-gray-100" />
                            </td>
                            <td className="px-6 py-4">
                              <div className="mx-auto h-8 w-20 rounded-full bg-gray-100" />
                            </td>
                          </tr>
                        ))
                      ) : filteredAdmins.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-16 text-center text-gray-400"
                          >
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Search className="w-8 h-8 opacity-20" />
                              <p>
                                {searchTerm
                                  ? "Tidak ditemukan data yang sesuai."
                                  : "Belum ada data admin."}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredAdmins.map((admin, index) => (
                          <tr
                            key={admin.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4 font-medium text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {admin.nama}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {admin.email}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleEditClick(admin)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all cursor-pointer"
                                title="Edit Admin"
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

      {isModalOpen && selectedAdmin && (
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
                    Edit Data Admin
                  </h2>
                  <p className="text-sm text-gray-500">
                    Perbarui informasi untuk {selectedAdmin.nama}
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
                id="edit-admin-form"
                onSubmit={handleUpdateAdmin}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Nama Guru
                    </label>
                    <input
                      name="nama"
                      value={editForm.nama}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Nama Lengkap Guru"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={editForm.email}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:border-[var(--secondary)] focus:ring-4 focus:ring-[var(--secondary)]/10 transition-all outline-none placeholder:text-gray-400"
                      placeholder="Email Admin"
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

                {/* Danger Zone - only show for non-super admin accounts */}
                {selectedAdmin.email !== "smkn31jktdev@gmail.com" && (
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                          <Trash className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-rose-700">
                            Hapus Data Admin
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
                )}
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
                form="edit-admin-form"
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
                Hapus Data Admin?
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Apakah anda yakin ingin menghapus data admin{" "}
                <span className="font-bold text-gray-800">
                  {selectedAdmin?.nama}
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
                onClick={handleConfirmDeleteAdmin}
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

export default function EditAdminPage() {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      <EditAdminContent />
    </SnackbarProvider>
  );
}
