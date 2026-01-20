export const BELAJAR_DESKRIPSI_MAP: Record<string, string> = {
  "membaca-kitab-suci": "Membaca kitab suci ( sesuai Agama yang dianutnya )",
  "membaca-buku-bacaan": "Membaca buku bacaan / novel / hobby / sejarah dsb.",
  "membaca-buku-pelajaran": "Membaca buku mata pelajaran",
  "mengerjakan-tugas": "Mengerjakan tugas / PR",
};

export const BELAJAR_OPTIONS = [
  { value: "", label: "Pilih jenis kegiatan belajar..." },
  ...Object.entries(BELAJAR_DESKRIPSI_MAP).map(([key, description]) => ({
    value: key,
    label: description,
  })),
];
