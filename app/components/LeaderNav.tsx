"use client";

import Link from "next/link";
import {
  Crown,
  Trophy,
  Medal,
  Flame,
  ChevronRight,
  Menu,
  X,
  User,
} from "lucide-react";

import { useState, useEffect } from "react";

export default function LeaderNav() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  // LOCK SCROLL
  useEffect(() => {
    document.body.style.overflow =
      menuOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow =
        "auto";
    };
  }, [menuOpen]);

  return (
    <>
      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="sticky top-0 z-50 border-b border-[#D4AF37]/15 bg-black/85 backdrop-blur-2xl shadow-[0_10px_50px_rgba(212,175,55,0.08)]">

        {/* GOLD TOP LINE */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-[76px] flex items-center justify-between">

          {/* =========================
              LEFT
          ========================= */}
          <Link
            href="/"
            className="flex items-center gap-4 group"
          >
            {/* LOGO */}
            <div className="relative">

              {/* GLOW */}
              <div className="absolute inset-0 rounded-2xl bg-[#D4AF37]/30 blur-xl opacity-70 group-hover:opacity-100 transition-all duration-500" />

              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F8E7A1] via-[#D4AF37] to-[#8B6B1F] flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.45)] group-hover:scale-105 transition-all duration-300">
                <Crown className="w-5 h-5 text-black" />
              </div>
            </div>

            {/* BRAND */}
            <div className="leading-tight">
              <h1 className="text-[17px] md:text-[23px] font-semibold tracking-wide text-white">

                Leader
                <span className="text-[#D4AF37]">
                  Board
                </span>
              </h1>

              <p className="text-[11px] text-zinc-500 tracking-wide">
                Top ranked legends
              </p>
            </div>
          </Link>

          {/* =========================
              DESKTOP LINKS
          ========================= */}
          <div className="hidden lg:flex items-center gap-2">

            <NavItem
              href="/customer/leaderboard"
              icon={
                <Trophy className="w-4 h-4 text-[#D4AF37]" />
              }
              label="leaderboard"
            />

            <NavItem
              href="/"
              icon={
                <Medal className="w-4 h-4 text-[#D4AF37]" />
              }
              label="Sellers"
            />

            <NavItem
              href="/customer/orders"
              icon={
                <Flame className="w-4 h-4 text-[#D4AF37]" />
              }
              label="Orders"
            />
          </div>

          {/* =========================
              RIGHT
          ========================= */}
          <div className="flex items-center gap-3">

            <Link
  href="/customer/profile"
  className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B] hover:bg-[#111] hover:border-[#D4AF37]/35 transition-all duration-300 gold-shine"
>
  {/* PROFILE */}
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F8E7A1] via-[#D4AF37] to-[#8B6B1F] flex items-center justify-center">
    <User className="w-4 h-4 text-black" />
  </div>

  <div className="hidden md:block text-left">
    <p className="text-sm font-medium text-white">
      Elite User
    </p>

    <p className="text-xs text-zinc-500">
      View Profile
    </p>
  </div>
</Link>
          
          

            {/* MOBILE BUTTON */}
            <button
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
              className="lg:hidden w-11 h-11 rounded-2xl border border-[#D4AF37]/15 bg-[#111] hover:bg-[#181818] text-[#D4AF37] flex items-center justify-center transition-all"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* =========================
          MOBILE MENU
      ========================= */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">

          {/* BACKDROP */}
          <div
            onClick={() =>
              setMenuOpen(false)
            }
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* PANEL */}
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-black border-l border-[#D4AF37]/15 shadow-2xl animate-slide-in">

            {/* HEADER */}
            <div className="p-5 border-b border-[#D4AF37]/10">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F8E7A1] via-[#D4AF37] to-[#8B6B1F] flex items-center justify-center">
                    <Crown className="w-6 h-6 text-black" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      LeaderBoard
                    </h2>

                    <p className="text-xs text-zinc-500">
                      Rank higher daily
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="w-10 h-10 rounded-xl bg-[#111] hover:bg-[#181818] flex items-center justify-center text-[#D4AF37]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LINKS */}
            <div className="p-4 space-y-2">

              <MobileNavItem
                href="/customer/leaderboard"
                label="Leaderboard"
                icon={<Trophy className="w-5 h-5 text-[#D4AF37]" />}
                onClick={() =>
                  setMenuOpen(false)
                }
              />

              <MobileNavItem
                href="/customer/sellers"
                label="Sellers  "
                icon={<Medal className="w-5 h-5 text-[#D4AF37]" />}
                onClick={() =>
                  setMenuOpen(false)
                }
              />

              <MobileNavItem
                href="/customer/orders"
                label="Orders"
                icon={<Flame className="w-5 h-5 text-[#D4AF37]" />}
                onClick={() =>
                  setMenuOpen(false)
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================
          STYLES
      ========================= */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
          background: black;
        }

        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }

          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.28s ease-out;
        }

        .gold-shine {
          position: relative;
          overflow: hidden;
        }

        .gold-shine::before {
          content: "";
          position: absolute;
          top: 0;
          left: -120%;
          width: 80%;
          height: 100%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255,255,255,0.16),
            transparent
          );
          transition: 0.9s;
        }

        .gold-shine:hover::before {
          left: 140%;
        }
      `}</style>
    </>
  );
}

/* =========================
   DESKTOP NAV ITEM
========================= */
function NavItem({
  href,
  icon,
  label,
}: any) {
  return (
    <Link
      href={href}
      className="group px-4 py-2.5 rounded-2xl border border-transparent hover:border-[#D4AF37]/20 hover:bg-gradient-to-r hover:from-[#D4AF37]/10 hover:to-transparent transition-all duration-300 flex items-center gap-2"
    >
      {icon}

      <span className="text-sm font-medium text-white">
        {label}
      </span>
    </Link>
  );
}

/* =========================
   MOBILE NAV ITEM
========================= */
function MobileNavItem({
  href,
  icon,
  label,
  onClick,
}: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-[#0B0B0B] hover:bg-[#111] border border-[#D4AF37]/10 transition-all duration-300"
    >
      <div className="w-11 h-11 rounded-2xl bg-black border border-[#D4AF37]/10 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <p className="font-medium text-white">
          {label}
        </p>

        <p className="text-xs text-zinc-500">
          Open {label.toLowerCase()}
        </p>
      </div>
    </Link>
  );
}