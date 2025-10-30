"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, SquareActivity, FileText, X } from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/site/student",
    hasSubmenu: false,
  },
  {
    id: "kegiatan",
    label: "Input Kegiatan",
    icon: SquareActivity,
    href: "/site/student/kegiatan",
    hasSubmenu: false,
  },
  {
    id: "dokumentasi",
    label: "Dokumentasi",
    icon: FileText,
    href: "/site/student/bukti",
    hasSubmenu: false,
  },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Handle swipe gestures
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;

    if (isLeftSwipe && isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileOpen && onMobileClose) {
        const sidebar = document.getElementById("mobile-sidebar");
        if (sidebar && !sidebar.contains(event.target as Node)) {
          onMobileClose();
        }
      }
    };

    if (isMobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMobileOpen, onMobileClose]);

  const pathname = usePathname();

  useEffect(() => {}, [pathname]);

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <div key={item.id} className="mb-1">
        <Link
          href={item.href}
          className={`flex items-center ${
            isCollapsed ? "justify-center px-3" : "px-6"
          } py-3 ${
            isActive ? "bg-white/10 text-white font-semibold" : "text-white"
          } hover:text-white hover:bg-white/10 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer rounded-md group border-b border-white/10`}
          title={isCollapsed ? item.label : undefined}
        >
          <Icon
            className={`w-5 h-5 ${
              isCollapsed ? "" : "mr-3"
            } text-white group-hover:text-white`}
          />
          {!isCollapsed && (
            <span className="font-medium text-sm">{item.label}</span>
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" />
      )}

      <div
        id="mobile-sidebar"
        className={`${
          isCollapsed ? "w-16" : "w-64"
        } bg-[var(--secondary)] h-screen overflow-y-auto overflow-x-hidden border-r border-white/6 transition-all duration-300 shadow-xl backdrop-blur-sm
        ${
          // Mobile positioning
          isMobileOpen
            ? "fixed left-0 top-0 z-50 md:relative md:z-auto"
            : "fixed -left-64 top-0 z-50 md:relative md:left-0 md:z-auto"
        } md:block`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {isMobileOpen && (
          <div className="flex items-center justify-between p-4 border-b border-white/20 md:hidden">
            <div className="relative w-15 h-15 flex-shrink-0">
              <Image
                src="/assets/img/7kaih.png"
                alt="Admin Logo"
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={onMobileClose}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        <div className="hidden md:flex items-center justify-center px-0 py-6 border-b border-white/20 bg-[var(--secondary)] backdrop-blur-sm">
          <div className="flex items-center justify-center w-full">
            <div
              className={`relative ${
                isCollapsed ? "w-10 h-10" : "w-24 h-24"
              } flex-shrink-0 mx-auto transition-all duration-300`}
            >
              <Image
                src="/assets/img/7kaih.png"
                alt="FreeLinkd Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-x-hidden">
          {/* Siswa Menu Section */}
          <div className="mb-8">
            {!isCollapsed && (
              <div className="px-6 mb-4 bg-[var(--secondary)] rounded-lg py-2 backdrop-blur-sm">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Menu Siswa
                </h3>
              </div>
            )}
            <div className="space-y-1">{menuItems.map(renderMenuItem)}</div>
          </div>
        </nav>
      </div>
    </>
  );
}
