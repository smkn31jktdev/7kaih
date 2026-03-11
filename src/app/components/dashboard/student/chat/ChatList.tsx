"use client";

import { MessageCircleHeart, Plus, Loader2, ChevronRight } from "lucide-react";
import { Aduan } from "@/app/types/aduan";
import { getStatusColor, getStatusBadge, formatDate } from "./ChatLogic";

interface ChatListProps {
  aduanList: Aduan[];
  activeAduan: Aduan | null;
  isCreatingNew: boolean;
  loading: boolean;
  onStartNew: () => void;
  onOpenThread: (aduan: Aduan) => void;
}

export default function ChatList({
  aduanList,
  activeAduan,
  isCreatingNew,
  loading,
  onStartNew,
  onOpenThread,
}: ChatListProps) {
  return (
    <div
      className={`w-full md:w-1/3 lg:w-[420px] bg-white flex flex-col transition-all duration-300 absolute md:relative z-10 h-full border-r border-gray-300 shadow-[2px_0_8px_rgba(0,0,0,0.02)] ${
        activeAduan || isCreatingNew
          ? "-translate-x-full md:translate-x-0"
          : "translate-x-0"
      }`}
    >
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-hide">
        {/* Layanan Aduan Siswa Card & Buat Laporan Baru */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="w-full bg-gradient-to-br from-slate-100 to-gray-200 rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="w-10 h-10 bg-teal-100 text-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-[15px] mb-2 tracking-wide">
              Layanan Aduan Siswa
            </h3>
            <p className="text-[12px] text-gray-600 leading-relaxed font-medium px-2">
              Ruang aman untuk berbagi cerita, keluh kesah, atau melaporkan
              kendala. Jangan ragu, privasimu adalah prioritas kami.
            </p>
          </div>

          <button
            onClick={onStartNew}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] transition-all shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)] ${
              isCreatingNew
                ? "bg-[var(--secondary)] text-white ring-2 ring-offset-2 ring-[var(--secondary)]/40 translate-y-[-1px]"
                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/30"
            }`}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            Buat Laporan Baru
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center text-gray-500 mb-6 font-medium text-xs">
          <hr className="flex-1 border-gray-300" />
          <span className="px-4 tracking-wide text-[11px] text-gray-600">
            Histori Laporan
          </span>
          <hr className="flex-1 border-gray-300" />
        </div>

        {/* Histori List */}
        {loading && aduanList.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : aduanList.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Belum ada histori laporan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {aduanList.map((aduan) => {
              const lastMsg = aduan.messages[aduan.messages.length - 1];
              const isActive = activeAduan?.ticketId === aduan.ticketId;
              return (
                <div
                  key={aduan.ticketId}
                  onClick={() => onOpenThread(aduan)}
                  className={`w-full rounded-2xl p-4 text-left transition-all cursor-pointer group flex items-center justify-between shadow-sm border ${
                    isActive
                      ? "border-[var(--secondary)] bg-teal-50/50 translate-x-1 ring-1 ring-[var(--secondary)]/30"
                      : "bg-gray-200/70 hover:bg-gray-300/80 border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-[11px] font-medium text-gray-600">
                        {aduan.ticketId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md ${getStatusColor(
                          aduan.status,
                        ).replace(
                          "border",
                          isActive ? "border-teal-200" : "border-transparent",
                        )}`}
                        style={{
                          backgroundColor:
                            aduan.status === "pending"
                              ? "#fde68a"
                              : aduan.status === "diteruskan"
                                ? "#bae6fd"
                                : aduan.status === "ditindaklanjuti"
                                  ? "#fed7aa"
                                  : "#bbf7d0",
                          color:
                            aduan.status === "pending"
                              ? "#92400e"
                              : aduan.status === "diteruskan"
                                ? "#0369a1"
                                : aduan.status === "ditindaklanjuti"
                                  ? "#c2410c"
                                  : "#15803d",
                        }}
                      >
                        {getStatusBadge(aduan.status)}
                      </span>
                    </div>
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? "text-teal-950" : "text-gray-800"
                      }`}
                    >
                      {lastMsg?.message || "Laporan baru"}
                    </p>
                    <p
                      className={`text-[11px] mt-3 ${
                        isActive ? "text-teal-700 font-medium" : "text-gray-500"
                      }`}
                    >
                      {formatDate(aduan.createdAt)}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 transition-transform ${
                      isActive
                        ? "text-[var(--secondary)]"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
