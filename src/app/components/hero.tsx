"use client";

import Image from "next/image";
import { useMemo } from "react";

interface HabitItem {
  label: string;
  src: string;
}

const HABITS: HabitItem[] = [
  { label: "Bangun Tepat Waktu", src: "/assets/img/bangun.png" },
  { label: "Beribadah", src: "/assets/img/beribadah.png" },
  { label: "Makan Sehat", src: "/assets/img/makan.png" },
  { label: "Olahraga", src: "/assets/img/olahraga.png" },
  { label: "Belajar", src: "/assets/img/belajar.png" },
  { label: "Berorganisasi", src: "/assets/img/organisasi.png" },
  { label: "Istirahat Cukup", src: "/assets/img/tidur.png" },
];

const Hero = () => {
  const positionedHabits = useMemo(() => {
    const radius = 148;
    const total = HABITS.length;

    return HABITS.map((habit, index) => {
      const angle = (360 / total) * index - 90;

      return {
        ...habit,
        angle,
        transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
      };
    });
  }, []);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-100 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -left-16 top-12 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl"
          aria-hidden
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-20 px-6 lg:flex-row">
        <div className="relative flex h-[320px] w-[320px] items-center justify-center lg:h-[420px] lg:w-[420px]">
          <div
            className="absolute inset-12 rounded-full border border-white/70 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 rounded-full border border-slate-200/70"
            aria-hidden="true"
          />

          {positionedHabits.map((habit, index) => (
            <div
              key={habit.label}
              className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2"
              style={{ transform: habit.transform }}
            >
              <div
                className="habit-pop flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white/90 shadow-lg shadow-blue-100 transition-transform duration-200 hover:scale-105"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Image
                  src={habit.src}
                  alt={habit.label}
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain"
                  priority
                />
              </div>
            </div>
          ))}

          <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-white/95 shadow-lg shadow-blue-100">
            <Image
              src="/assets/img/7kaih.png"
              alt="Ikon tujuh kebiasaan anak hebat"
              width={128}
              height={128}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>

        <div className="max-w-xl text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
            Penerapan Gerakan
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight bg-gradient-to-r from-[var(--highlight)] to-[var(--secondary)] bg-clip-text text-transparent sm:text-5xl lg:text-6xl animate-fade-in">
            Tujuh Kebiasaan Anak Indonesia Hebat
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            Kebiasaan kecil yang dilakukan secara konsisten mampu mengantar
            anak-anak Indonesia menjadi generasi yang sehat, cerdas, dan
            berakhlak mulia. Mulai perjalanan hebat ini bersama keluarga dan
            komunitas di seluruh nusantara.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
