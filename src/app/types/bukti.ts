export interface Bukti {
  _id?: string;
  nisn: string;
  nama: string;
  kelas: string;
  bulan: string; // Format: YYYY-MM
  foto: string; // URL atau path ke foto
  linkYouTube: string;
  createdAt: Date;
  updatedAt: Date;
}
