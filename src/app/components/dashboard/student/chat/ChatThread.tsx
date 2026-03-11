"use client";

import React from "react";
import { ArrowLeft, Info, CheckCircle2, Send, Loader2 } from "lucide-react";
import { Aduan } from "@/app/types/aduan";
import { formatDate, formatTimestamp } from "./ChatLogic";

interface ChatThreadProps {
  activeAduan: Aduan | null;
  isCreatingNew: boolean;
  inputValue: string;
  sending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onBackToList: () => void;
  onInputValueChange: (val: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export default function ChatThread({
  activeAduan,
  isCreatingNew,
  inputValue,
  sending,
  messagesEndRef,
  onBackToList,
  onInputValueChange,
  onSendMessage,
}: ChatThreadProps) {
  return (
    <div
      className={`flex-1 bg-white flex flex-col h-full absolute md:relative w-full z-10 transition-transform duration-300 ${
        activeAduan || isCreatingNew
          ? "translate-x-0"
          : "translate-x-full md:translate-x-0"
      }`}
    >
      {/* Default Empty State for Desktop */}
      {!activeAduan && !isCreatingNew ? (
        <div className="hidden md:flex flex-1 items-center justify-center bg-white">
          {/* Blank state matching default */}
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
                {activeAduan ? activeAduan.ticketId : "Laporan Baru"}
              </h2>
              <p className="text-[13px] text-gray-600 font-medium mt-0.5">
                {activeAduan ? formatDate(activeAduan.createdAt) : "Hari ini"}
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white space-y-6 scrollbar-hide">
            {!activeAduan && isCreatingNew && (
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 mb-6 text-center max-w-lg mx-auto shadow-sm">
                <div className="flex items-center justify-center gap-2 text-blue-800 font-semibold mb-2">
                  <Info className="w-5 h-5" />
                  Mulai Laporan Baru
                </div>
                <p className="text-[13px] leading-relaxed text-blue-600/90">
                  Tuliskan aduan atau keluhan kamu di bawah. Laporan akan
                  dikirimkan ke guru wali kelas kamu terlebih dahulu.
                </p>
              </div>
            )}

            {activeAduan &&
              activeAduan.messages.map((msg, idx) => {
                const isStudent = msg.role === "student";
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex flex-col ${
                      isStudent ? "items-end" : "items-start"
                    }`}
                  >
                    {!isStudent && (
                      <span className="text-[11px] text-gray-500 mb-1.5 px-1 font-semibold">
                        {msg.from || "Staff"} (
                        {msg.role === "guru_wali"
                          ? "Guru Wali"
                          : msg.role === "guru_bk"
                            ? "Guru BK"
                            : "Admin"}
                        )
                      </span>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[65%] px-6 py-4 rounded-[20px] text-[15px] font-medium leading-relaxed shadow-sm ${
                        isStudent
                          ? "bg-gray-200 text-gray-800 rounded-tr-sm"
                          : "bg-gray-100/80 text-gray-800 rounded-tl-sm border border-gray-200"
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
            {activeAduan && activeAduan.status === "selesai" && (
              <div className="mx-auto max-w-sm mt-8 bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold text-sm">Selesai</span>
                </div>
                <p className="text-xs text-green-600">
                  Laporan ini telah ditandai selesai.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          {(!activeAduan || activeAduan.status !== "selesai") && (
            <div className="bg-white p-4 sm:p-6 pb-6 sm:pb-8 shrink-0 mb-0">
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
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    placeholder={
                      isCreatingNew && !activeAduan
                        ? "Tuliskan keluhan atau laporan baru..."
                        : "Ketik pesan..."
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage(e as any);
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
                      ? "bg-[#F1F3F5] text-slate-700 hover:bg-[#E8ECEF] active:scale-95 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]"
                      : "bg-[#F1F3F5] text-slate-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send
                      className="w-[22px] h-[22px] -ml-[2px]"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
