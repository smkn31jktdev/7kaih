import { useState } from "react";

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReasonModal({ isOpen, onClose, onSubmit }: ReasonModalProps) {
  const [reasonText, setReasonText] = useState("");

  const handleSubmit = () => {
    if (!reasonText.trim()) return;
    onSubmit(reasonText);
    setReasonText("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl transform transition-transform">
        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Input Alasan Ketidakhadiran
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mengapa Anda tidak berada di sekolah hari ini?
          </label>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Contoh: Saya sedang sakit / Izin menghadiri acara keluarga..."
            className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent min-h-[120px] resize-none text-sm text-gray-800"
          ></textarea>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={reasonText.trim() === ""}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--secondary)] hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kirim Alasan
          </button>
        </div>
      </div>
    </div>
  );
}
