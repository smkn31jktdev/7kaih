"use client";

import { useState, useEffect } from "react";
import { Menu, User, LayoutDashboard, LogOut } from "lucide-react";

interface BKNavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function BKNavbar({
  onToggleSidebar,
  onToggleMobileSidebar,
}: BKNavbarProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>("Guru Piket");
  const [userEmail, setUserEmail] = useState<string | null>(
    "piket@sekolah.sch.id",
  );
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    try {
      // Assuming piket authentication uses piketUser and piketToken in localStorage
      const raw = localStorage.getItem("piketUser");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.nama) setUserName(parsed.nama);
        if (parsed.email) setUserEmail(parsed.email);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const mainContent = document.querySelector("main");
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => mainContent.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`flex items-center justify-between px-6 py-4 transition-all duration-300 sticky top-0 z-30 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <button
        onClick={() => {
          if (window.innerWidth < 768) {
            onToggleMobileSidebar?.();
          } else {
            onToggleSidebar?.();
          }
        }}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm transition-all duration-200 cursor-pointer ${
          isScrolled
            ? "bg-white border-gray-100 hover:shadow-md hover:bg-gray-50 text-gray-600"
            : "bg-white/50 border-gray-200/50 hover:bg-white hover:border-gray-200 text-gray-500 hover:text-gray-700"
        }`}
        aria-label="Toggle Sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="relative">
        <button
          onClick={toggleProfileDropdown}
          aria-label="User menu"
          className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full hover:bg-gray-50/50 transition-all duration-200 focus:outline-none cursor-pointer group"
        >
          <div className="text-right hidden sm:block mr-2">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {userName}
            </p>
            <p className="text-xs text-gray-500">Guru Piket</p>
          </div>
          <div className="w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white group-hover:ring-[var(--secondary)]/20 transition-all">
            <User className="w-5 h-5" />
          </div>
        </button>

        {/* Dropdown Menu */}
        <div
          id="profile-dropdown"
          className={`absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transform transition-all duration-200 origin-top-right ${
            isProfileDropdownOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
          }`}
          role="menu"
        >
          <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Signed in as
            </p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>

          <div className="px-2 space-y-1">
            <a
              href="/site/private/bk"
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[var(--secondary)] rounded-xl transition-colors duration-200 gap-3 font-medium"
            >
              <LayoutDashboard className="w-4 h-4" />
              Beranda
            </a>
          </div>

          <div className="border-t border-gray-100 my-2 pt-2 px-2">
            <button
              onClick={() => {
                localStorage.removeItem("piketUser");
                localStorage.removeItem("piketToken");
                window.location.href = "/site/private/piket/login";
              }}
              className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 gap-3 font-medium"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
}
