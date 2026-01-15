"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";

interface StudentNavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function StudentNavbar({
  onToggleSidebar,
  onToggleMobileSidebar,
}: StudentNavbarProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const mainContent = document.querySelector("main");
    if (!mainContent) return;

    const handleScroll = () => {
      setIsScrolled(mainContent.scrollTop > 10);
    };

    mainContent.addEventListener("scroll", handleScroll);
    return () => mainContent.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem("studentToken");
      if (!token) return;

      (async () => {
        try {
          const resp = await fetch("/api/auth/student/me", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!resp.ok) return;
          const json = await resp.json();
          const student = json?.student;
          if (student) {
            setUserName(student.nama || student.nisn);
            setUserEmail(student.email || student.nisn);
          }
        } catch {}
      })();
    } catch {}
  }, []);

  return (
    <div
      className={`flex items-center justify-between px-6 py-4 transition-all duration-300 sticky top-0 z-30 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Left side - Toggle button & Welcome */}
      <div className="flex items-center gap-4">
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
      </div>

      {/* Right side - User Profile & Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell (Optional addition for "Pro" look) */}
        <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 text-gray-500 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="relative">
          <button
            onClick={toggleProfileDropdown}
            className={`flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-200 cursor-pointer ${
              isProfileDropdownOpen ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-tr from-[var(--secondary)] to-[var(--highlight)] rounded-full flex items-center justify-center shadow-sm text-white border-2 border-white">
              <User className="w-4 h-4" />
            </div>

            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 leading-tight">
                {userName ? userName.split(" ")[0] : "Siswa"}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isProfileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 transform transition-all duration-200 origin-top-right ${
              isProfileDropdownOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Signed in as
              </p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userName || "Student"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userEmail || ""}
              </p>
            </div>

            <div className="px-2">
              <a
                href="/site/student"
                className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[var(--secondary)] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3 text-gray-500">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                Dashboard
              </a>
            </div>

            <div className="border-t border-gray-100 my-2 mx-2"></div>

            <div className="px-2 pb-2">
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("studentToken");
                    if (token) {
                      await fetch("/api/student/logout", {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${token}`, // Corrected Authorization header
                          "Content-Type": "application/json",
                        },
                      });
                    }
                  } catch (error) {
                    console.error("Logout error:", error);
                  }
                  localStorage.removeItem("studentToken");
                  localStorage.removeItem("studentUser");
                  window.location.href = "/site/student/login";
                }}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center mr-3 text-red-500">
                  <LogOut className="w-4 h-4" />
                </div>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isProfileDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsProfileDropdownOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
