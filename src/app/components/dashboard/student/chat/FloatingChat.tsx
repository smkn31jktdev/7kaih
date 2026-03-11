"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FloatingChat() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/site/student/chat");
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[90]">
      <div className="group relative flex items-center justify-center">
        <div className="absolute right-full mr-4 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
          Pusat Bantuan & Aduan
          <div className="absolute top-1/2 -right-[5px] -translate-y-1/2 w-2.5 h-2.5 bg-white border-r border-t border-gray-100/80 transform rotate-45"></div>
        </div>

        <button
          onClick={handleClick}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--secondary)] to-teal-300 shadow-lg text-white hover:opacity-90 active:scale-95 transition-all outline-none focus:ring-4 focus:ring-teal-500/30"
          aria-label="Buka Pusat Aduan"
        >
          <MessageCircleQuestion
            className="w-8 h-8 drop-shadow-sm"
            strokeWidth={2.2}
          />
        </button>
      </div>
    </div>
  );
}
