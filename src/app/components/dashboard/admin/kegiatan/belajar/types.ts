export interface BelajarEntry {
  tanggal: string;
  yaAtauTidak: boolean;
  deskripsi: string;
}

export interface BelajarStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BelajarEntry[];
}

export const BELAJAR_DESKRIPSI_MAP: Record<string, string> = {
  "membaca-kitab-suci": "Membaca kitab suci ( sesuai Agama yang dianutnya )",
  "membaca-buku-bacaan": "Membaca buku bacaan / novel / hobby / sejarah dsb.",
  "membaca-buku-pelajaran": "Membaca buku mata pelajaran",
  "mengerjakan-tugas": "Mengerjakan tugas / PR",
  lainnya: "Lainnya",
};
