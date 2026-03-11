"use client";

import { UserCircle2, Loader2, ChevronRight } from "lucide-react";
import { Aduan } from "@/app/types/aduan";
import { getStatusColor, getStatusBadge, formatDate } from "./LogicChat";

interface ChatListProps {
  aduanList: Aduan[];
  activeAduan: Aduan | null;
  loading: boolean;
  adminNama: string;
  isSuperAdmin: boolean;
  onOpenThread: (aduan: Aduan) => void;
}

export default function ChatList({
  aduanList,
  activeAduan,
  loading,
  adminNama,
  isSuperAdmin,
  onOpenThread,
}: ChatListProps) {
  return (
    <div
      className={`w-full md:w-1/3 lg:w-[420px] bg-white flex flex-col transition-all duration-300 absolute md:relative z-10 h-full border-r border-gray-300 shadow-[2px_0_8px_rgba(0,0,0,0.02)] ${
        activeAduan ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      }`}
    >
      <div className="p-4 sm:p-6 overflow-y-auto flex-1 scrollbar-hide">
        {/* Info Card */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="w-full bg-gradient-to-br from-slate-100 to-gray-200 rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)]">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-[15px] mb-2 tracking-wide">
              {loading
                ? "Memuat..."
                : isSuperAdmin
                  ? "Super Admin"
                  : `Guru Wali — ${adminNama}`}
            </h3>
            <p className="text-[12px] text-gray-600 leading-relaxed font-medium px-2">
              Pantau dan tindaklanjuti laporan atau aduan siswa dengan sigap.
              Kerahasiaan diutamakan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white rounded-xl border-2 border-gray-100 p-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
              <p className="text-xl font-bold text-gray-900">
                {aduanList.filter((a) => a.status !== "selesai").length}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Laporan Aktif
              </p>
            </div>
            <div className="bg-white rounded-xl border-2 border-gray-100 p-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
              <p className="text-xl font-bold text-gray-900">
                {aduanList.length}
              </p>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                Total Aduan
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center text-gray-500 mb-6 font-medium text-xs">
          <hr className="flex-1 border-gray-300" />
          <span className="px-4 tracking-wide text-[11px] text-gray-600">
            Daftar Aduan Masuk
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
            <p className="text-gray-500 text-sm">Belum ada aduan masuk.</p>
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

                    <div className="flex items-center gap-2 mb-1.5">
                      <UserCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {aduan.namaSiswa} ({aduan.kelas})
                      </span>
                    </div>

                    <p
                      className={`text-[13px] font-semibold truncate ${
                        isActive ? "text-teal-950" : "text-gray-800"
                      }`}
                    >
                      {lastMsg?.message || "Laporan baru"}
                    </p>
                    <p
                      className={`text-[10px] mt-2 ${
                        isActive ? "text-teal-700 font-medium" : "text-gray-500"
                      }`}
                    >
                      {formatDate(aduan.createdAt)} &middot;{" "}
                      {aduan.messages.length} pesan
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
