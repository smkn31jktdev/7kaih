export interface OlahragaEntry {
  tanggal: string;
  jenisOlahraga: string;
  deskripsi: string;
  waktu: string;
}

export interface OlahragaStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: OlahragaEntry[];
}
