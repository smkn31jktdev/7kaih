"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SquareActivity,
  FileText,
  ChevronRight,
  X,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/site/student",
  },
  {
    id: "kegiatan",
    label: "Input Kegiatan",
    icon: SquareActivity,
    href: "/site/student/kegiatan",
  },
  {
    id: "dokumentasi",
    label: "Dokumentasi",
    icon: FileText,
    href: "/site/student/bukti",
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function StudentSidebar({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/site/student") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" />
      )}

      <aside
        id="mobile-sidebar"
        className={`fixed md:sticky top-0 h-screen flex flex-col justify-between bg-white border-r border-gray-100 transition-all duration-300 ease-in-out z-50 
          ${isCollapsed ? "w-20 px-3" : "w-72 px-6"} py-8
          ${isMobileOpen ? "left-0 shadow-2xl" : "-left-72 md:left-0"}
          `}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden scrollbar-none">
          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Logo Section */}
          <div
            className={`flex items-center justify-center mb-12 ${
              isMobileOpen ? "mt-4" : ""
            }`}
          >
            <Link
              href="/site/student"
              className="transition-transform duration-200 hover:scale-105"
            >
              {!isCollapsed ? (
                <div className="relative w-32 h-32">
                  <Image
                    src="/assets/img/7kaih.png"
                    alt="Anak Hebat"
                    fill
                    className="object-contain drop-shadow-sm"
                    priority
                  />
                </div>
              ) : (
                <div className="relative w-12 h-12">
                  <Image
                    src="/assets/img/7kaih.png"
                    alt="Anak Hebat"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 space-y-2">
            {!isCollapsed && (
              <p className="text-gray-400 text-[11px] uppercase tracking-wider font-bold px-4 mb-4">
                Menu Utama
              </p>
            )}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.id} href={item.href} className="block group">
                    <div
                      className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ease-out relative overflow-hidden ${
                        active
                          ? "bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/20"
                          : "text-gray-500 hover:bg-gray-50 hover:text-[var(--secondary)]"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={`w-[22px] h-[22px] flex-shrink-0 transition-transform duration-300 ${
                          active
                            ? "scale-110"
                            : "group-hover:scale-115 text-gray-400 group-hover:text-[var(--secondary)]"
                        }`}
                        strokeWidth={active ? 2.5 : 2}
                      />

                      {!isCollapsed && (
                        <span className="font-semibold tracking-wide flex-1 truncate">
                          {item.label}
                        </span>
                      )}

                      {!isCollapsed && active && (
                        <ChevronRight className="w-4 h-4 text-white/80 animate-pulse" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom logout or extra section could go here */}
          {!isCollapsed && (
            <div className="mt-auto px-4">
              <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-2xl p-4 border border-[var(--primary)]/20">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Butuh Bantuan?
                </p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Hubungi wali siswa jika mengalami kendala.
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
