"use client";

import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  return (
    <header className="fixed left-0 top-0 z-50 w-full bg-gradient-to-b from-white/90 via-white/60 to-white/20 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="group relative flex items-center"
          aria-label="Anak Hebat home"
        >
          <div className="relative h-10 w-32 transition-transform duration-300 group-hover:scale-[1.02]">
            <Image
              src="/img/navbar.png"
              alt="Anak Hebat"
              fill
              priority
              sizes="(max-width: 768px) 128px, 192px"
              className="object-contain"
            />
          </div>
        </Link>

        <Link
          href="/site/welcome"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--btn)] bg-[var(--btn)] px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-100 transition duration-200 hover:bg-[var(--btn)]/90 hover:scale-105 hover:shadow-lg"
        >
          <span>Login</span>
          <span aria-hidden className="text-base">
            →
          </span>
        </Link>
      </nav>
    </header>
  );
};

export default Navbar;
