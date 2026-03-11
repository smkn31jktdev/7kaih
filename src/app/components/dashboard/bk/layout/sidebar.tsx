"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircleQuestion, X } from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Beranda",
    icon: LayoutDashboard,
    href: "/site/private/bk",
    hasSubmenu: false,
  },
  {
    id: "aduan-siswa",
    label: "Aduan Siswa (Chat)",
    icon: MessageCircleQuestion,
    href: "/site/private/bk/chat",
    hasSubmenu: false,
  },
];

interface BKSidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function BKSidebar({
  isCollapsed = false,
  isMobileOpen = false,
  onMobileClose,
}: BKSidebarProps) {
  const [, setOpenMenus] = useState<string[]>([]);
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

  const toggleMenu = (menuId: string) => {
    if (isCollapsed) return;
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId],
    );
  };

  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    menuItems.forEach((item) => {
      if (item.hasSubmenu && (item as { submenu?: { href: string }[] }).submenu) {
        const match = (item as { submenu?: { href: string }[] }).submenu!.some((si) =>
          pathname.startsWith(si.href),
        );
        if (match) {
          setOpenMenus((prev) => {
            if (!prev.includes(item.id)) return [...prev, item.id];
            return prev;
          });
        }
      }
    });
  }, [pathname]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/site/private/bk") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const Icon = item.icon;
    const active = !item.hasSubmenu && isActive(item.href);

    return (
      <div key={item.id} className="mb-1">
        <div
          onClick={() => (item.hasSubmenu ? toggleMenu(item.id) : null)}
          className={`flex items-center gap-4 px-4 py-3 cursor-pointer rounded-2xl transition-all duration-300 relative overflow-hidden group ${
            active
              ? "bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/20"
              : "text-gray-500 hover:bg-gray-50 hover:text-[var(--secondary)]"
          }`}
          title={isCollapsed ? item.label : undefined}
        >
          <Link
            href={item.hasSubmenu ? "#" : item.href}
            className="flex items-center flex-1 gap-4"
            onClick={(e) => {
              if (item.hasSubmenu) e.preventDefault();
            }}
          >
            <Icon
              className={`w-[22px] h-[22px] flex-shrink-0 transition-transform duration-300 ${
                active ? "scale-110" : "group-hover:scale-110"
              }`}
              strokeWidth={active ? 2.5 : 2}
            />

            {!isCollapsed && (
              <span className={`font-semibold tracking-wide flex-1 truncate`}>
                {item.label}
              </span>
            )}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
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
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          <div
            className={`flex items-center justify-center mb-10 ${
              isMobileOpen ? "mt-8" : ""
            }`}
          >
            <Link
              href="/site/private/bk"
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

          <div className="flex-1 space-y-2">
            {!isCollapsed && (
              <p className="text-gray-400 text-[11px] uppercase tracking-wider font-bold px-4 mb-4">
                Guru Piket Menu
              </p>
            )}
            <nav className="space-y-1.5">{menuItems.map(renderMenuItem)}</nav>
          </div>
        </div>
      </aside>
    </>
  );
}
