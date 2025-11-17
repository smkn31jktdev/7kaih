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
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Highlight active menu based on current pathname
  const pathname = usePathname();

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
  }, [pathname, openMenus]);

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

  const renderMenuItem = (item: (typeof menuItems)[0]) => {
    const isOpen = openMenus.includes(item.id);
    const Icon = item.icon;
    const isActive = !item.hasSubmenu && pathname === item.href;

    return (
      <div key={item.id} className="mb-1">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center px-3" : "justify-between px-6"
          } py-3 ${
            isActive ? "bg-white/10 text-white font-semibold" : "text-white"
          } hover:text-white hover:bg-white/10 hover:scale-105 hover:shadow-md transition-all duration-200 cursor-pointer rounded-md group border-b border-white/10 ${
            item.hasSubmenu ? "" : ""
          }`}
          onClick={() => (item.hasSubmenu ? toggleMenu(item.id) : null)}
          title={isCollapsed ? item.label : undefined}
        >
          <Link
            href={item.hasSubmenu ? "#" : item.href}
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "flex-1"
            }`}
            onClick={(e) => item.hasSubmenu && e.preventDefault()}
          >
            <Icon
              className={`w-5 h-5 ${
                isCollapsed ? "" : "mr-3"
              } text-white group-hover:text-white`}
            />
            {!isCollapsed && (
              <>
                <span className="font-medium text-sm">{item.label}</span>
              </>
            )}
          </Link>
          {item.hasSubmenu && !isCollapsed && (
            <div className="ml-2">
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </div>
          )}
        </div>

        {item.hasSubmenu && isOpen && item.submenu && !isCollapsed && (
          <div className="ml-12 mb-2 transition-all duration-300 ease-in-out">
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
                const subActive = pathname === subItem.href;
                return (
                  <Link
                    key={index}
                    href={subItem.href}
                    className={`block px-6 py-2 text-sm ${
                      subActive
                        ? "bg-white/10 text-white font-semibold"
                        : "text-white"
                    } hover:text-white hover:bg-white/10 hover:scale-105 transition-all duration-200 rounded-md`}
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
          {/* Admin Menu Section */}
          <div className="mb-8">
            {!isCollapsed && (
              <div className="px-6 mb-4 bg-[var(--secondary)] rounded-lg py-2 backdrop-blur-sm">
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Admin Menu
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
