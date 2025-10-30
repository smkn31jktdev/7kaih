export interface Kebiasaan {
  id: string;
  nisn: string;
  tanggal: string;
  nama: string;
  kelas: string;

  // Bangun Pagi
  bangunPagi: {
    jam: string;
    membacaDanBangunTidur: boolean;
  };

  // Tidur
  tidur: {
    jam: string;
    membacaDanMasTidur: boolean;
  };

  // Beribadah
  beribadah: {
    berdoaUntukDiriDanOrtu: boolean;
    sholatFajar: boolean;
    sholatLimaWaktuBerjamaah: boolean;
    zikirSesudahSholat: boolean;
    sholatDhuha: boolean;
    sholatSunahRawatib: boolean;
    zakatInfaqSedekah: string;
  };

  // Makan Sehat
  makanSehat: {
    jenisMakanan: string;
    jenisLaukSayur: string;
    makanSayurAtauBuah: boolean;
    minumSuplemen: boolean;
  };

  // Olahraga
  olahraga: {
    jenisOlahraga: string;
    deskripsi: string;
    waktu: string; // menyimpan durasi dalam menit
  };

  // Bermasyarakat
  bermasyarakat: {
    deskripsi: string;
    tempat: string;
    waktu: string;
    paraf: boolean;
  };

  // Belajar
  belajar: {
    yaAtauTidak: boolean;
    deskripsi: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
