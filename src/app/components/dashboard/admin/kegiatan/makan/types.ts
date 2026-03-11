export interface MakanEntry {
  tanggal: string;
  jenisMakanan: string;
  jenisLaukSayur: string;
  makanSayurAtauBuah: boolean;
  minumSuplemen: boolean;
}

export interface MakanStudent {
  nisn: string;
  nama: string;
  kelas: string;
  entries: MakanEntry[];
}
