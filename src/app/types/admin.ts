export interface Admin {
  id: string;
  nama: string;
  email: string;
  password: string; // hashed
  fotoProfil?: string; // URL path ke foto profil, e.g. "/uploads/profil/admin_xxx.jpg"
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminRegisterInput {
  nama: string;
  email: string;
  password: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}
