import { Aduan, AduanStatus } from "@/app/types/aduan";

const API_BASE = "/api/student/aduan";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("studentToken");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAduan(): Promise<Aduan[]> {
  const res = await fetch(API_BASE, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Gagal mengambil data aduan");
  const data = await res.json();
  return data.aduan;
}

export async function sendAduan(
  message: string,
  ticketId?: string,
): Promise<{ success: boolean; aduan?: Aduan; message?: unknown }> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, ticketId }),
  });
  if (!res.ok) throw new Error("Gagal mengirim aduan");
  return res.json();
}

export function getStatusLabel(status: AduanStatus): string {
  switch (status) {
    case "pending":
      return "Laporan terkirim, menunggu respons guru wali";
    case "diteruskan":
      return "Laporan anda sudah diterima oleh guru wali dan dalam tahap pemantauan, silakan tunggu";
    case "ditindaklanjuti":
      return "Laporan anda sedang dalam tindak lanjut";
    case "selesai":
      return "Laporan anda telah selesai ditangani";
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
      return "Dipantau";
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
