"use client";

import { ArrowLeft, MessageCircleHeart } from "lucide-react";
import { Aduan } from "@/app/types/aduan";

interface ChatHeaderProps {
  activeAduan: Aduan | null;
  isCreatingNew: boolean;
  onGoBack: () => void;
}

export default function ChatHeader({
  activeAduan,
  isCreatingNew,
  onGoBack,
}: ChatHeaderProps) {
  return (
    <header
      className={`bg-slate-50 px-4 py-3 sm:px-8 sm:py-4 z-20 items-center shrink-0 border-b border-gray-200/80 ${
        activeAduan || isCreatingNew ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onGoBack}
          className="p-2 -ml-2 rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-inner border border-slate-300">
          <MessageCircleHeart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
            Curhat Dong
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 font-medium">
            Aman & Rahasia
          </p>
        </div>
      </div>
    </header>
  );
}
