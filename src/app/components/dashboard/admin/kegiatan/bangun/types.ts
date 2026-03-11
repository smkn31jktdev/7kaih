export interface BangunEntry {
  tanggal: string;
  jamBangun: string;
  berdoa: boolean;
}

export interface BangunStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: BangunEntry[];
}
