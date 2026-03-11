export type AduanStatus =
  | "pending"
  | "diteruskan"
  | "ditindaklanjuti"
  | "selesai";

export interface StatusHistory {
  status: AduanStatus;
  updatedBy: string;
  role: string;
  updatedAt: string;
  note?: string;
}

export interface AduanMessage {
  id: string;
  from: string;
  role: "student" | "guru_wali" | "guru_bk" | "super_admin";
  message: string;
  timestamp: string;
}

export interface Aduan {
  _id?: string;
  ticketId: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  walas: string;
  messages: AduanMessage[];
  status: AduanStatus;
  statusHistory: StatusHistory[];
  diteruskanKe: "guru_bk" | "super_admin" | null;
  createdAt: string;
  updatedAt: string;
}
