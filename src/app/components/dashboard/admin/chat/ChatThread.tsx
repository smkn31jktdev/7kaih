"use client";

import React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Send,
  Loader2,
  Clock,
  Forward,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Aduan, AduanStatus } from "@/app/types/aduan";
import {
  getStatusColor,
  getStatusLabel,
  formatTimestamp,
  formatDate,
} from "./LogicChat";

interface ChatThreadProps {
  activeAduan: Aduan | null;
  inputValue: string;
  sending: boolean;
  actionLoading: boolean;
  myRole: string;
  canForward: boolean;
  canTindaklanjuti: boolean;
  canSelesai: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBackToList: () => void;
  onInputValueChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onHandleAction: (action: string) => void;
}

export default function ChatThread({
  activeAduan,
  inputValue,
  sending,
  actionLoading,
  myRole,
  canForward,
  canTindaklanjuti,
  canSelesai,
  messagesEndRef,
  onBackToList,
  onInputValueChange,
  onSendMessage,
  onHandleAction,
}: ChatThreadProps) {
  const getStatusIcon = (status: AduanStatus) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3.5 h-3.5" />;
      case "diteruskan":
        return <Forward className="w-3.5 h-3.5" />;
      case "ditindaklanjuti":
        return <AlertCircle className="w-3.5 h-3.5" />;
      case "selesai":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`flex-1 bg-white flex flex-col h-full absolute md:relative w-full z-10 transition-transform duration-300 ${
        activeAduan ? "translate-x-0" : "translate-x-full md:translate-x-0"
      }`}
    >
      {/* Default Empty State for Desktop */}
      {!activeAduan ? (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white flex-col">
          <Inbox className="w-16 h-16 text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            Pilih aduan untuk melihat percakapan
          </p>
        </div>
      ) : (
        <>
          {/* Thread Header */}
          <div className="bg-gray-200/80 px-4 py-3 sm:px-8 sm:py-5 border-b border-gray-300 flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              {/* Mobile Back Button */}
              <div className="flex items-center gap-2 md:hidden mb-1.5">
                <button
                  onClick={onBackToList}
                  className="text-gray-600 hover:text-gray-900 p-1 -ml-1 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Kembali
                </span>
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {activeAduan.namaSiswa}{" "}
                <span className="text-sm font-normal text-gray-500">
                  ({activeAduan.kelas})
                </span>
              </h2>
              <p className="text-[13px] text-gray-600 font-medium mt-0.5">
                {activeAduan.ticketId} &middot;{" "}
                {formatDate(activeAduan.createdAt)}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-md shadow-sm border ${getStatusColor(
                activeAduan.status,
              )}`}
              style={{
                backgroundColor:
                  activeAduan.status === "pending"
                    ? "#fde68a"
                    : activeAduan.status === "diteruskan"
                      ? "#bae6fd"
                      : activeAduan.status === "ditindaklanjuti"
                        ? "#fed7aa"
                        : "#bbf7d0",
                color:
                  activeAduan.status === "pending"
                    ? "#92400e"
                    : activeAduan.status === "diteruskan"
                      ? "#0369a1"
                      : activeAduan.status === "ditindaklanjuti"
                        ? "#c2410c"
                        : "#15803d",
              }}
            >
              {getStatusIcon(activeAduan.status)}
              {getStatusLabel(activeAduan.status)}
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white space-y-6 scrollbar-hide">
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 mb-6 max-w-sm mx-auto shadow-sm text-center">
              <p className="text-xs text-blue-500 mb-1 font-semibold uppercase tracking-wider">
                Aduan ditujukan dari:
              </p>
              <p className="font-bold text-blue-950 text-base">
                {activeAduan.namaSiswa}{" "}
                <span className="font-medium text-blue-700">
                  ({activeAduan.kelas})
                </span>
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium bg-blue-100/50 inline-block px-3 py-1 rounded-full">
                Guru Wali: {activeAduan.walas}
              </p>
            </div>

            {activeAduan.messages.map((msg, idx) => {
              const isAdmin = msg.role !== "student";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${
                    isAdmin ? "items-end" : "items-start"
                  }`}
                >
                  <span className="text-[11px] text-gray-500 mb-1.5 px-1 font-semibold">
                    {isAdmin ? (
                      <>
                        {msg.from} (
                        {msg.role === "guru_wali"
                          ? "Guru Wali"
                          : msg.role === "guru_bk"
                            ? "Guru BK"
                            : "Super Admin"}
                        )
                      </>
                    ) : (
                      <>{msg.from} (Siswa)</>
                    )}
                  </span>

                  <div
                    className={`max-w-[85%] sm:max-w-[65%] px-6 py-4 rounded-[20px] text-[15px] font-medium leading-relaxed shadow-sm ${
                      isAdmin
                        ? "bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white rounded-tr-sm"
                        : "bg-gray-200 text-gray-800 rounded-tl-sm border border-gray-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 px-2 font-medium">
                    {msg.timestamp ? formatTimestamp(msg.timestamp) : ""}
                  </span>
                </div>
              );
            })}

            {/* Status completion banner */}
            {activeAduan.status === "selesai" && (
              <div className="mx-auto max-w-sm mt-8 bg-green-50/80 border border-green-200 rounded-2xl p-4 text-center shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-1 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Selesai Ditangani</span>
                </div>
                <p className="text-xs text-green-600 font-medium">
                  Laporan ini telah ditandai selesai dan ditutup.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          {activeAduan.status !== "selesai" && (
            <div className="bg-white shrink-0 mb-0 border-t border-gray-100">
              {/* Action Buttons */}
              {(canForward || canTindaklanjuti || canSelesai) && (
                <div className="px-4 py-3 flex flex-wrap gap-2 justify-center bg-gray-50/80 border-b border-gray-100/50">
                  {canForward && (
                    <>
                      <button
                        onClick={() => onHandleAction("teruskan_bk")}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        <Forward className="w-3.5 h-3.5" />
                        Teruskan ke Guru BK
                      </button>
                      <button
                        onClick={() => onHandleAction("teruskan_superadmin")}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors disabled:opacity-50"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Teruskan ke Super Admin
                      </button>
                    </>
                  )}
                  {canTindaklanjuti && (
                    <button
                      onClick={() => onHandleAction("tindaklanjuti")}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors disabled:opacity-50"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Tindak Lanjut
                    </button>
                  )}
                  {canSelesai && (
                    <button
                      onClick={() => onHandleAction("selesai")}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Selesai
                    </button>
                  )}
                  {actionLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />
                  )}
                </div>
              )}

              <div className="p-4 sm:p-6 pb-6 sm:pb-8">
                <form
                  onSubmit={onSendMessage}
                  className="flex items-end gap-3 sm:gap-4 w-full mx-auto"
                >
                  <div className="flex-1 bg-[#F1F3F5] rounded-[30px] overflow-hidden transition-all focus-within:bg-[#E8ECEF] group">
                    <textarea
                      rows={1}
                      value={inputValue}
                      onChange={(e) => {
                        onInputValueChange(e.target.value);
                        e.target.style.height = "56px";
                        e.target.style.height = `${Math.min(
                          e.target.scrollHeight,
                          120,
                        )}px`;
                      }}
                      placeholder={`Balas sebagai ${myRole}...`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSendMessage(e as unknown as React.FormEvent);
                          e.currentTarget.style.height = "56px";
                        }
                      }}
                      className="w-full bg-transparent resize-none outline-none text-[15px] text-gray-800 placeholder-slate-400 font-medium px-6 pt-[18px] pb-[16px] leading-[22px] scrollbar-hide"
                      style={{ height: "56px" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue.trim() || sending}
                    className={`w-[56px] h-[56px] flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim() && !sending
                        ? "bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-white hover:shadow-lg hover:scale-[1.02] active:scale-95 shadow-[0_4px_10px_-4px_rgba(8,145,178,0.5)]"
                        : "bg-[#F1F3F5] text-slate-400 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send
                        className="w-[22px] h-[22px] -ml-[2px]"
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
