"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Aduan } from "@/app/types/aduan";
import { fetchAduan, sendAduan } from "./ChatLogic";
import ChatHeader from "./ChatHeader";
import ChatList from "./ChatList";
import ChatThread from "./ChatThread";

export default function RoomChat() {
  const router = useRouter();

  const [aduanList, setAduanList] = useState<Aduan[]>([]);
  const [activeAduan, setActiveAduan] = useState<Aduan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAduan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAduan();
      setAduanList(data);

      setActiveAduan((prev) => {
        if (!prev) return null;
        const updated = data.find((a) => a.ticketId === prev.ticketId);
        if (updated) {
          if (
            updated.messages.length !== prev.messages.length ||
            updated.status !== prev.status
          ) {
            return updated;
          }
        }
        return prev;
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data aduan";
      console.error("Gagal memuat data aduan:", msg);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAduan();
  }, [loadAduan]);

  useEffect(() => {
    scrollToBottom();
  }, [activeAduan?.messages, isCreatingNew]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAduan();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadAduan]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    setSending(true);
    setErrorMsg(null);
    try {
      const result = await sendAduan(inputValue.trim(), activeAduan?.ticketId);

      setInputValue("");

      if (result.success) {
        await loadAduan();

        if (isCreatingNew && result.aduan) {
          setIsCreatingNew(false);
          setActiveAduan(result.aduan as Aduan);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim aduan";
      setErrorMsg(msg);
    } finally {
      setSending(false);
    }
  };

  const openThread = (aduan: Aduan) => {
    setIsCreatingNew(false);
    setActiveAduan(aduan);
  };

  const startNewAduan = () => {
    setActiveAduan(null);
    setIsCreatingNew(true);
  };

  const goBackToList = () => {
    setActiveAduan(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-[100dvh] bg-slate-50 font-poppins overflow-hidden">
      <ChatHeader
        activeAduan={activeAduan}
        isCreatingNew={isCreatingNew}
        onGoBack={() => router.back()}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <ChatList
          aduanList={aduanList}
          activeAduan={activeAduan}
          isCreatingNew={isCreatingNew}
          loading={loading}
          onStartNew={startNewAduan}
          onOpenThread={openThread}
        />

        <ChatThread
          activeAduan={activeAduan}
          isCreatingNew={isCreatingNew}
          inputValue={inputValue}
          sending={sending}
          messagesEndRef={messagesEndRef}
          onBackToList={goBackToList}
          onInputValueChange={setInputValue}
          onSendMessage={handleSendMessage}
        />
      </div>

      {errorMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="ml-3 font-bold">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
