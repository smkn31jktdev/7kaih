export interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  walas: string;
  email?: string;
  password: string;
  isOnline?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentLoginInput {
  nisn: string;
  password: string;
}
