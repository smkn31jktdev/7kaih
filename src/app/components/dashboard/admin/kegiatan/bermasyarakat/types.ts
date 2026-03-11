export interface BermasyarakatEntry {
  tanggal: string;
  jenisKegiatan: string;
  tempat: string;
  waktu: string;
  paraf: boolean;
}

export interface BermasyarakatStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BermasyarakatEntry[];
}

export const BERMASYARAKAT_DESKRIPSI_MAP: Record<string, string> = {
  "membersihkan-tempat-ibadah": "Membersihkan tempat ibadah",
  "membersihkan-got-jalanan": "Membersihkan got / jalanan umum",
  "merawat-tanaman": "Merawat tanaman / penghijauan di tempat umum",
  "petugas-ibadah":
    "Menjadi petugas pelayan beribadah / imam / muadzin / bilal",
  "khotib-penceramah":
    "Menjadi khotib / penceramah / petugas pembimbing keagamaan",
  "mengajar-ngaji": "Mengajar ngaji / ta'lim / membimbing kelompok belajar",
  lainnya: "Lainnya",
};
