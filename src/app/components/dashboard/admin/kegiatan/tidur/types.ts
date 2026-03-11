export interface TidurEntry {
  tanggal: string;
  jamTidur: string;
  berdoa: boolean;
}

export interface TidurStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: TidurEntry[];
}
