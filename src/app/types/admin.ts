export interface Admin {
  id: string;
  nama: string;
  email: string;
  password: string; // hashed
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
