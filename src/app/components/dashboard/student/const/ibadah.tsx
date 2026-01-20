export type BeribadahBooleanKey =
  | "berdoaUntukDiriDanOrtu"
  | "sholatFajar"
  | "sholatLimaWaktuBerjamaah"
  | "zikirSesudahSholat"
  | "sholatDhuha"
  | "sholatSunahRawatib";

export type BeribadahForm = {
  [key in BeribadahBooleanKey]: boolean;
} & {
  zakatInfaqSedekah: string;
};

export const BERIBADAH_BOOLEAN_FIELDS: Array<{
  key: BeribadahBooleanKey;
  label: string;
}> = [
  {
    key: "berdoaUntukDiriDanOrtu",
    label: "Berdoa untuk diri sendiri dan orang tua",
  },
  {
    key: "sholatFajar",
    label: "Sholat Fajar / Qoblal Subuh*",
  },
  {
    key: "sholatLimaWaktuBerjamaah",
    label: "Sholat 5 waktu berjamaah*",
  },
  {
    key: "zikirSesudahSholat",
    label: "Zikir dan doa sehabis sholat fardlu*",
  },
  {
    key: "sholatDhuha",
    label: "Sholat Dhuha*",
  },
  {
    key: "sholatSunahRawatib",
    label: "Sholat sunah rawatib*",
  },
];

export const createDefaultBeribadah = (): BeribadahForm => ({
  berdoaUntukDiriDanOrtu: false,
  sholatFajar: false,
  sholatLimaWaktuBerjamaah: false,
  zikirSesudahSholat: false,
  sholatDhuha: false,
  sholatSunahRawatib: false,
  zakatInfaqSedekah: "",
});
