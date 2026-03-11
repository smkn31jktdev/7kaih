import { Aduan, AduanStatus } from "@/app/types/aduan";

const API_BASE = "/api/admin/aduan";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAduanList(): Promise<{
  aduan: Aduan[];
  adminNama: string;
  isSuperAdmin: boolean;
}> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil data aduan");
  return res.json();
}

export async function updateAduanStatus(
  ticketId: string,
  action: string,
  note?: string,
): Promise<{ success: boolean; status: string }> {
  const res = await fetch(API_BASE, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ticketId, action, note }),
  });
  if (!res.ok) throw new Error("Gagal mengubah status aduan");
  return res.json();
}

export async function sendResponse(
  ticketId: string,
  message: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/respond`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ ticketId, message }),
  });
  if (!res.ok) throw new Error("Gagal mengirim balasan");
  return res.json();
}

export function getStatusLabel(status: AduanStatus): string {
  switch (status) {
    case "pending":
      return "Menunggu tindakan guru wali";
    case "diteruskan":
      return "Sudah diteruskan ke Guru BK / Super Admin";
    case "ditindaklanjuti":
      return "Sedang ditindaklanjuti";
    case "selesai":
      return "Selesai ditangani";
    default:
      return "";
  }
}

export function getStatusColor(status: AduanStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-50 border-yellow-200 text-yellow-700";
    case "diteruskan":
      return "bg-blue-50 border-blue-200 text-blue-700";
    case "ditindaklanjuti":
      return "bg-orange-50 border-orange-200 text-orange-700";
    case "selesai":
      return "bg-green-50 border-green-200 text-green-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-700";
  }
}

export function getStatusBadge(status: AduanStatus): string {
  switch (status) {
    case "pending":
      return "Menunggu";
    case "diteruskan":
      return "Diteruskan";
    case "ditindaklanjuti":
      return "Ditindaklanjuti";
    case "selesai":
      return "Selesai";
    default:
      return status;
  }
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
