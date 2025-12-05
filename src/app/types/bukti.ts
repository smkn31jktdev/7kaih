export interface Bukti {
  _id?: string;
  nisn: string;
  nama: string;
  kelas: string;
  bulan: string; // Format: YYYY-MM
  foto: string; // URL atau path ke foto (legacy/local)
  linkYouTube: string;
  // Field baru untuk deployment (menyimpan gambar di database)
  imageUrl?: string; // URL publik jika menggunakan external storage
  imageId?: string; // ID unik untuk gambar
  imageData?: string; // Base64 encoded image data
  imageMimeType?: string; // MIME type gambar (image/png, image/jpeg)
  createdAt: Date;
  updatedAt: Date;
}
