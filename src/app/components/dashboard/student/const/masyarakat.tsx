export const BERMASYARAKAT_DESKRIPSI_MAP: Record<string, string> = {
  "membersihkan-tempat-ibadah": "Membersihkan tempat ibadah",
  "membersihkan-got-jalanan": "Membersihkan got / jalanan umum",
  "merawat-tanaman": "Merawat tanaman / penghijauan di tempat umum",
  "petugas-ibadah":
    "Menjadi petugas pelayan beribadah / imam / muadzin / bilal",
  "khotib-penceramah":
    "Menjadi khotib / penceramah / petugas pembimbing keagamaan",
  "mengajar-ngaji": "Mengajar ngaji / ta'lim / membimbing kelompok belajar",
};

export const BERMASYARAKAT_OPTIONS = [
  { value: "", label: "Pilih jenis kegiatan bermasyarakat..." },
  ...Object.values(BERMASYARAKAT_DESKRIPSI_MAP).map((description) => ({
    value: description,
    label: description,
  })),
  { value: "Lainnya", label: "Lainnya (Tuliskan sendiri)" },
];
