"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Aduan } from "@/app/types/aduan";
import {
  fetchAduanList,
  updateAduanStatus,
  sendResponse,
} from "../../admin/chat/LogicChat";
import BKSidebar from "../layout/sidebar";
import ChatHeader from "../../admin/chat/ChatHeader";
import ChatList from "../../admin/chat/ChatList";
import ChatThread from "../../admin/chat/ChatThread";

export default function BKRoomChat() {
  const [aduanList, setAduanList] = useState<Aduan[]>([]);
  const [activeAduan, setActiveAduan] = useState<Aduan | null>(null);
  const [adminNama, setAdminNama] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSidebarCollapsed, _setIsSidebarCollapsed] = useState(false);
  void _setIsSidebarCollapsed;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadAduan = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAduanList();
      setAduanList(data.aduan);
      setAdminNama(data.adminNama);
      setIsSuperAdmin(data.isSuperAdmin);

      setActiveAduan((prev) => {
        if (!prev) return null;
        const updated = data.aduan.find((a) => a.ticketId === prev.ticketId);
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
  }, [activeAduan?.messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAduan();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadAduan]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || !activeAduan) return;

    setSending(true);
    try {
      await sendResponse(activeAduan.ticketId, inputValue.trim());
      setInputValue("");
      await loadAduan();
      scrollToBottom();
    } catch {
      console.error("Gagal mengirim balasan");
    } finally {
      setSending(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!activeAduan || actionLoading) return;

    setActionLoading(true);
    try {
      await updateAduanStatus(activeAduan.ticketId, action);
      await loadAduan();
    } catch {
      console.error("Gagal mengubah status");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (aduan: Aduan) => {
    setActiveAduan(aduan);
  };

  const goBackToList = () => {
    setActiveAduan(null);
    loadAduan();
  };

  const getMyRole = (aduan: Aduan): string => {
    if (isSuperAdmin) return "Super Admin";
    if (aduan.walas === adminNama) return "Guru Wali";
    return "Guru BK";
  };

  const isGuruWali = (aduan: Aduan) => aduan.walas === adminNama;

  const myRole = activeAduan ? getMyRole(activeAduan) : "";
  const canForward = activeAduan
    ? isGuruWali(activeAduan) && activeAduan.status === "pending"
    : false;
  const canTindaklanjuti = activeAduan
    ? (isSuperAdmin || !isGuruWali(activeAduan)) &&
      (activeAduan.status === "diteruskan" || activeAduan.status === "pending")
    : false;
  const canSelesai = activeAduan
    ? activeAduan.status === "ditindaklanjuti" ||
      (isSuperAdmin && activeAduan.status !== "selesai")
    : false;

  return (
    <div className="flex flex-row h-screen max-h-[100dvh] bg-slate-50 font-poppins overflow-hidden">
      <BKSidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <ChatHeader
          activeAduan={activeAduan}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <ChatList
            aduanList={aduanList}
            activeAduan={activeAduan}
            loading={loading}
            adminNama={adminNama}
            isSuperAdmin={isSuperAdmin}
            onOpenThread={openDetail}
          />

          <ChatThread
            activeAduan={activeAduan}
            inputValue={inputValue}
            sending={sending}
            actionLoading={actionLoading}
            myRole={myRole}
            canForward={canForward}
            canTindaklanjuti={canTindaklanjuti}
            canSelesai={canSelesai}
            messagesEndRef={messagesEndRef}
            onBackToList={goBackToList}
            onInputValueChange={setInputValue}
            onSendMessage={handleSendMessage}
            onHandleAction={handleAction}
          />
        </div>
      </div>
    </div>
  );
}
