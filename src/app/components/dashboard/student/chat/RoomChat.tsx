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
    } catch {
      console.error("Gagal memuat data aduan");
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
    } catch {
      console.error("Gagal mengirim aduan");
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
    </div>
  );
}
