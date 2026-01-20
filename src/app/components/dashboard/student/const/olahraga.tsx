// Constants for Olahraga section

export const OLAGRAGA_DESKRIPSI_MAP: Record<string, string> = {
  "senam-sekolah": "Senam di sekolah seminggu sekali",
  "senam-masyarakat": "Senam di masyarakat seminggu sekali",
  "walk-school": "Walk to school setiap hari",
  "ride-school": "Ride to school (sepeda ontel) setiap hari",
  "gym-renang": "Gym / renang seminggu sekali",
  "running-jogging": "Running / lari / jogging seminggu 2 (dua) kali",
  "olahraga-hobi": "Olah raga hobbi seminggu sekali",
  lainnya: "",
};

export const OLAGRAGA_OPTIONS = [
  { value: "", label: "Pilih jenis olahraga..." },
  {
    value: "senam-sekolah",
    label: "Senam di sekolah",
    description: "seminggu sekali",
  },
  {
    value: "senam-masyarakat",
    label: "Senam di masyarakat",
    description: "seminggu sekali",
  },
  { value: "walk-school", label: "Walk to school", description: "setiap hari" },
  {
    value: "ride-school",
    label: "Ride to school",
    description: "sepeda ontel setiap hari",
  },
  {
    value: "gym-renang",
    label: "Gym / renang",
    description: "seminggu sekali",
  },
  {
    value: "running-jogging",
    label: "Running / lari / jogging",
    description: "seminggu 2 (dua) kali",
  },
  {
    value: "olahraga-hobi",
    label: "Olah raga hobbi",
    description: "seminggu sekali",
  },
  { value: "lainnya", label: "Olah raga lainnya" },
];
