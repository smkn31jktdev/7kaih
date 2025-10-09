"use client";

import { useState, useEffect } from "react";
import { Menu, User, LayoutDashboard, Wrench, Bot, LogOut } from "lucide-react";

interface AdminNavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
}

export default function AdminNavbar({
  onToggleSidebar,
  onToggleMobileSidebar,
}: AdminNavbarProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    // Load user from localStorage then fetch fresh data from server
    try {
      const raw = localStorage.getItem("adminUser");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const email = parsed?.email;
      if (!email) return;
      setUserEmail(email);

      // fetch fresh user data
      (async () => {
        try {
          const resp = await fetch("/api/auth/admin/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (!resp.ok) return;
          const json = await resp.json();
          const user = json?.user;
          if (user) {
            setUserName(user.username || user.name || user.email);
          }
        } catch {}
      })();
    } catch {}
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/6 shadow-sm relative bg-[var(--secondary)] backdrop-blur-sm">
      {/* Left side - Toggle button */}
      <button
        onClick={() => {
          if (window.innerWidth < 768) {
            onToggleMobileSidebar?.();
          } else {
            onToggleSidebar?.();
          }
        }}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-transparent hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/30 transition-transform duration-200 ease-out text-white/90"
        aria-label="Toggle Sidebar"
        aria-pressed="false"
        onMouseDown={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          btn.style.transform = "scale(0.96) rotate(-6deg)";
        }}
        onMouseUp={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          btn.style.transform = "";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          btn.style.transform = "";
        }}
        onTouchStart={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          btn.style.transform = "scale(0.96) rotate(-6deg)";
        }}
        onTouchEnd={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
          setTimeout(() => (btn.style.transform = ""), 80);
        }}
      >
        <Menu className="w-5 h-5 transition-transform duration-200 ease-out" />
      </button>

      {/* Right side - User Profile */}
      <div className="relative">
        <button
          onClick={toggleProfileDropdown}
          aria-label="User menu"
          aria-expanded={isProfileDropdownOpen}
          aria-controls="profile-dropdown"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent hover:bg-white/5 transition-transform duration-200 ease-out focus:outline-none"
        >
          {/* Avatar only */}
          <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </button>

        {/* Dropdown Menu */}
        <div
          id="profile-dropdown"
          className={`absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out ${
            isProfileDropdownOpen
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-2 scale-95 pointer-events-none"
          }`}
          role="menu"
        >
          {/* User Info - moved here (visible in dropdown) */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[var(--content)] rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-[var(--foreground)]" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {userName || "Admin"}
                </div>
                <div className="text-xs text-gray-500">
                  {userEmail || "Admin"}
                </div>
              </div>
            </div>
          </div>

          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <Wrench className="w-4 h-4 mr-3 text-gray-500" />
            Account settings
          </a>
          <a
            href="#"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <Bot className="w-4 h-4 mr-3 text-gray-500" />
            Chatbot Assistant
          </a>
          <div className="border-t border-gray-100 my-2"></div>
          <button
            onClick={() => {
              localStorage.removeItem("adminUser");
              // redirect to login
              window.location.href = "/site/personal/admin/login";
            }}
            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-3 text-gray-500" />
            Sign out
          </button>
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isProfileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileDropdownOpen(false)}
        />
      )}
    </div>
  );
}
