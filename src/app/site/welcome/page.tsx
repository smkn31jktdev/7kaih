"use client";

import { useRouter } from "next/navigation";
import {
  UserCog,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

export default function WelcomePage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleNavigation = (role: "admin" | "student") => {
    if (role === "admin") {
      router.push("/site/private/admin/login");
    } else {
      router.push("/site/student/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 md:p-6 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-5xl">
        {/* Header Section */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <h1 className="welcome-title text-4xl md:text-5xl font-extrabold mb-3">
            WELCOME
          </h1>
          <p className="text-base md:text-lg text-gray-700 font-medium">
            Selamat Datang, Silakan pilih akun anda
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 px-2 md:px-4">
          {/* Admin Card */}
          <div
            onClick={() => handleNavigation("admin")}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
            className="group cursor-pointer transform transition-all duration-500 hover:scale-102"
          >
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-transparent card admin transition-all duration-300">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 overlay opacity-0 transition-opacity duration-300"></div>

              <div className="relative p-6 md:p-8">
                {/* Icon Container */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 glow rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="relative icon-bg rounded-full p-5 md:p-6 transform group-hover:rotate-6 transition-transform duration-300">
                      <UserCog className="w-10 h-10 md:w-14 md:h-14 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="text-xl md:text-2xl font-semibold mb-3 text-center group-hover:text-indigo-600 transition-colors duration-300"
                  style={{ color: "var(--foreground)" }}
                >
                  Masuk sebagai Admin
                </h2>

                {/* Description */}

                {/* Button */}
                <div className="flex items-center justify-center">
                  <div
                    className="flex items-center font-semibold group-hover:opacity-80 transition-opacity text-xs md:text-sm"
                    style={{ color: "var(--btn)" }}
                  >
                    <span className="mr-2">Masuk Sekarang</span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform duration-300 ${
                        hoveredCard === "admin" ? "translate-x-2" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-2 bottom-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </div>

          {/* Student Card */}
          <div
            onClick={() => handleNavigation("student")}
            onMouseEnter={() => setHoveredCard("student")}
            onMouseLeave={() => setHoveredCard(null)}
            className="group cursor-pointer transform transition-all duration-500 hover:scale-102"
          >
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-transparent card student transition-all duration-300">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 overlay opacity-0 transition-opacity duration-300"></div>

              <div className="relative p-6 md:p-8">
                {/* Icon Container */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 glow rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <div className="relative icon-bg rounded-full p-5 md:p-6 transform group-hover:rotate-6 transition-transform duration-300">
                      <GraduationCap className="w-10 h-10 md:w-14 md:h-14 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="text-xl md:text-2xl font-semibold mb-3 text-center group-hover:text-pink-600 transition-colors duration-300"
                  style={{ color: "var(--foreground)" }}
                >
                  Masuk sebagai Siswa
                </h2>

                {/* Button */}
                <div className="flex items-center justify-center">
                  <div
                    className="flex items-center font-semibold group-hover:opacity-80 transition-opacity text-xs md:text-sm"
                    style={{ color: "var(--secondary)" }}
                  >
                    <span className="mr-2">Masuk Sekarang</span>
                    <ArrowRight
                      className={`w-4 h-4 transition-transform duration-300 ${
                        hoveredCard === "student" ? "translate-x-2" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-2 bottom-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 animate-fade-in-delayed">
          <div className="flex justify-center mb-4">
            <button
              type="button"
              aria-label="Kembali ke Beranda"
              onClick={() => router.push("/")}
              className="back-btn inline-flex items-center text-sm font-medium px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </button>
          </div>

          <p className="text-sm text-gray-600">
            Gerakan Tujuh Kebiasaan Anak Indonesia Hebat
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.3s both;
        }

        /* Card color hooks that read from :root variables in globals.css */
        .card {
          --overlay-color: rgba(99, 102, 241, 0.06); /* fallback */
        }

        .card.admin {
          /* use primary-ish --btn/--highlight as base for admin */
          --overlay-color: color-mix(in srgb, var(--btn) 12%, transparent);
          --glow-color: color-mix(in srgb, var(--btn) 40%, transparent);
          --accent-gradient-from: var(--btn);
          --accent-gradient-to: var(--highlight);
        }

        .card.student {
          /* use secondary for student */
          --overlay-color: color-mix(
            in srgb,
            var(--secondary) 12%,
            transparent
          );
          --glow-color: color-mix(in srgb, var(--secondary) 40%, transparent);
          --accent-gradient-from: var(--secondary);
          --accent-gradient-to: var(--highlight);
        }

        /* overlay that appears on hover */
        .overlay {
          background: linear-gradient(
            135deg,
            var(--accent-gradient-from, #7c3aed) 0%,
            var(--accent-gradient-to, #ec4899) 100%
          );
        }

        /* glow behind the icon */
        .glow {
          background: var(--glow-color, rgba(124, 58, 237, 0.4));
        }

        /* icon background uses a gradient derived from variables */
        .icon-bg {
          background: linear-gradient(
            135deg,
            var(--accent-gradient-from, #7c3aed),
            var(--accent-gradient-to, #ec4899)
          );
        }

        /* bottom accent bar */
        .bottom-accent {
          background: linear-gradient(
            90deg,
            var(--accent-gradient-from, #7c3aed),
            var(--accent-gradient-to, #ec4899)
          );
        }

        /* Welcome title should use root variables for a consistent brand gradient */
        .welcome-title {
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          background-image: linear-gradient(
            90deg,
            var(--btn, #0070f3) 0%,
            var(--highlight, #29b6f6) 50%,
            var(--primary, #ffc107) 100%
          );
        }

        /* Back button */
        .back-btn {
          --btn-color: var(--btn, #0070f3);
          background: transparent;
          color: var(--btn-color);
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: transform 200ms ease, box-shadow 200ms ease,
            background-color 200ms ease, color 200ms ease;
          will-change: transform, box-shadow;
          cursor: pointer;
        }

        .back-btn:hover,
        .back-btn:focus {
          background: var(--btn-color);
          color: #fff;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px
            color-mix(in srgb, var(--btn-color) 18%, transparent);
        }

        .back-btn:focus {
          outline: 3px solid color-mix(in srgb, var(--btn-color) 22%, white 80%);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
