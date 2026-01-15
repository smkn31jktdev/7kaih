"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LaptopMinimal,
  Wrench,
  ChevronDown,
  ChevronRight,
  X,
  UserPlus,
  FileText,
  FileSpreadsheet,
  Eraser,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/site/private/admin",
    hasSubmenu: false,
  },
  {
    id: "rekap-data",
    label: "Rekap Data",
    icon: FileSpreadsheet,
    href: "/site/private/admin/sheets",
    hasSubmenu: false,
  },
  {
    id: "monitoring",
    label: "Monitoring",
    icon: LaptopMinimal,
    href: "/site/private/admin/kegiatan",
    hasSubmenu: true,
    submenu: [
      { label: "Bangun Pagi", href: "/site/private/admin/kegiatan/bangun" },
      {
        label: "Beribadah",
        href: "/site/private/admin/kegiatan/beribadah",
      },
      {
        label: "Makan Sehat",
        href: "/site/private/admin/kegiatan/makan",
      },
      {
        label: "Olahraga",
        href: "/site/private/admin/kegiatan/olahraga",
      },
      {
        label: "Belajar",
        href: "/site/private/admin/kegiatan/belajar",
      },
      {
        label: "Bermasyarakat",
        href: "/site/private/admin/kegiatan/bermasyarakat",
      },
      {
        label: "Tidur Cukup",
        href: "/site/private/admin/kegiatan/tidur",
      },
    ],
  },
  {
    id: "bukti-kegiatan",
    label: "Bukti Kegiatan",
    icon: FileText,
    href: "/site/private/admin/bukti",
    hasSubmenu: false,
  },
  {
    id: "user-profile",
    label: "Atur User",
    icon: UserPlus,
    href: "/admin/user",
    hasSubmenu: true,
    submenu: [
      { label: "Tambahkan Admin", href: "/site/private/admin/tambah-admin" },
      {
        label: "Tambahkan Siswa",
        href: "/site/private/admin/tambah-siswa",
      },
      {
        label: "Sheets Tambah Siswa",
        href: "/site/private/admin/tambah-siswa/excel",
      },
      {
        label: "Edit Siswa",
        href: "/site/private/admin/edit-siswa",
      },
    ],
  },
  {
    id: "settings",
    label: "Pengaturan Akun",
    icon: Wrench,
    href: "/site/private/admin/settings",
    hasSubmenu: false,
  },
  {
    id: "clear-data",
    label: "Hapus Data",
    icon: Eraser,
    href: "/site/private/admin/delete",
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
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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

  const toggleMenu = (menuId: string) => {
    if (isCollapsed) return; // Don't toggle in collapsed mode
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const pathname = usePathname();

  // Highlight active menu based on current pathname
  useEffect(() => {
    if (!pathname) return;

    // open the parent menu if a submenu matches the current path
    menuItems.forEach((item) => {
      if (item.hasSubmenu && item.submenu) {
        const match = item.submenu.some((si) => pathname.startsWith(si.href));
        if (match && !openMenus.includes(item.id)) {
          setOpenMenus((prev) => [...prev, item.id]);
        }
      }
    });
  }, [pathname]);

  // Decide visibility for special menu items (Tambah Admin)
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setIsSuperAdmin(false);
      return;
    }

    // Call the me endpoint to check the logged-in admin email
    (async () => {
      try {
        const res = await fetch("/api/auth/admin/me", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          setIsSuperAdmin(false);
          return;
        }
        const data = await res.json();
        if (data?.user?.email === "smkn31jktdev@gmail.com") {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch {
        setIsSuperAdmin(false);
      }
    })();
  }, []);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/site/private/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isOpen = openMenus.includes(item.id);
    const Icon = item.icon;
    const active = !item.hasSubmenu && isActive(item.href);
    const hasActiveChild =
      item.hasSubmenu &&
      item.submenu?.some((sub) => pathname?.startsWith(sub.href));

    return (
      <div key={item.id} className="mb-1">
        <div
          onClick={() => (item.hasSubmenu ? toggleMenu(item.id) : null)}
          className={`flex items-center gap-4 px-4 py-3 cursor-pointer rounded-2xl transition-all duration-300 relative overflow-hidden group ${
            active || (hasActiveChild && isCollapsed)
              ? "bg-[var(--secondary)] text-white shadow-lg shadow-[var(--secondary)]/20"
              : "text-gray-500 hover:bg-gray-50 hover:text-[var(--secondary)]"
          }`}
          title={isCollapsed ? item.label : undefined}
        >
          {/* Active Indicator Strip (Optional, removed for cleaner look, relying on bg color) */}

          <Link
            href={item.hasSubmenu ? "#" : item.href}
            className="flex items-center flex-1 gap-4"
            onClick={(e) => {
              if (item.hasSubmenu) e.preventDefault();
            }}
          >
            <Icon
              className={`w-[22px] h-[22px] flex-shrink-0 transition-transform duration-300 ${
                active || (hasActiveChild && isCollapsed)
                  ? "scale-110"
                  : "group-hover:scale-110"
              }`}
              strokeWidth={active ? 2.5 : 2}
            />

            {!isCollapsed && (
              <span className={`font-semibold tracking-wide flex-1 truncate`}>
                {item.label}
              </span>
            )}
          </Link>

          {/* Chevron for submenu */}
          {item.hasSubmenu && !isCollapsed && (
            <div
              className={`transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              } ${
                active || hasActiveChild
                  ? "text-white/80"
                  : "text-gray-400 group-hover:text-[var(--secondary)]"
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Submenu Items */}
        {item.hasSubmenu && isOpen && item.submenu && !isCollapsed && (
          <div className="mt-1 ml-4 space-y-1 relative">
            {/* Connective line */}
            <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gray-100" />

            {item.submenu
              .filter((subItem) => {
                // Hide Tambahkan Admin link unless the logged-in email is the special one
                if (
                  subItem.href === "/site/private/admin/tambah-admin" &&
                  !isSuperAdmin
                ) {
                  return false;
                }
                return true;
              })
              .map((subItem, index) => {
                const subActive =
                  pathname === subItem.href ||
                  pathname?.startsWith(subItem.href + "/");
                return (
                  <Link
                    key={index}
                    href={subItem.href}
                    className={`block pl-6 pr-4 py-2.5 text-sm rounded-r-xl transition-all duration-200 border-l-2 ${
                      subActive
                        ? "border-[var(--secondary)] text-[var(--secondary)] font-semibold bg-[var(--secondary)]/5"
                        : "border-transparent text-gray-500 hover:text-[var(--secondary)] hover:bg-gray-50"
                    }`}
                  >
                    {subItem.label}
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    );
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
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Logo Section */}
          <div
            className={`flex items-center justify-center mb-10 ${
              isMobileOpen ? "mt-8" : ""
            }`}
          >
            <Link
              href="/site/private/admin"
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
                Admin Menu
              </p>
            )}
            <nav className="space-y-1.5">{menuItems.map(renderMenuItem)}</nav>
          </div>
        </div>
      </aside>
    </>
  );
}
