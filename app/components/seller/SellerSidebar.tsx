// components/seller/SellerSidebar.tsx

"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";

import { useState } from "react";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

// =========================
// NAVIGATION
// =========================

const navItems = [
  {
    name: "Dashboard",
    href: "/add-product",
    icon: LayoutDashboard,
  },

  {
    name: "Products",
    href: "/my-products",
    icon: ShoppingCart,
  },

  {
    name: "Orders",
    href: "/orders",
    icon: Package,
  },

  {
    name: "Settings",
    href: "/account",
    icon: Settings,
  },
];

// =========================
// COMPONENT
// =========================

export default function SellerSidebar() {
  const pathname = usePathname();

  const router = useRouter();

  const [mobileMenu, setMobileMenu] =
    useState(false);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      alert(
        "✅ Logged out successfully",
      );

      router.push("/login");
    } catch (err) {
      console.error(err);

      alert("Logout failed");
    }
  };

  return (
    <>
      {/* ========================= */}
      {/* TOP NAVBAR */}
      {/* ========================= */}

      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="h-16 lg:h-20 px-4 lg:px-6 flex items-center justify-between">
          {/* LEFT */}

          <div className="flex items-center gap-3">
            {/* MOBILE MENU */}

            <button
              onClick={() =>
                setMobileMenu(
                  !mobileMenu,
                )
              }
              className="lg:hidden w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shadow-md"
            >
              {mobileMenu ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}
            </button>

            {/* LOGO */}

            <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
              <ShieldCheck
                size={22}
              />
            </div>

            {/* TEXT */}

            <div>
              <h1 className="text-lg lg:text-2xl font-black text-gray-900 leading-none">
                Seller Panel
              </h1>

              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                Store Management
              </p>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}

          <div className="hidden lg:flex items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex
                    items-center
                    gap-2
                    px-5
                    py-3
                    rounded-2xl
                    font-semibold
                    transition-all
                    duration-200
                    ${
                      active
                        ? "bg-black text-white shadow-lg"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  <Icon size={18} />

                  <span>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-3">
            {/* PROFILE */}

            <div className="hidden sm:flex items-center gap-3 bg-gray-100 rounded-2xl px-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                S
              </div>

              <div className="hidden md:block">
                <h3 className="text-sm font-bold text-gray-900 leading-none">
                  Seller
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Store Access
                </p>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              className="bg-black hover:opacity-90 text-white px-4 lg:px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut size={18} />

              <span className="hidden sm:block">
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* ========================= */}
        {/* MOBILE MENU */}
        {/* ========================= */}

        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all
            duration-300
            ${
              mobileMenu
                ? "max-h-[500px] opacity-100 border-t border-gray-100"
                : "max-h-0 opacity-0 pointer-events-none"
            }
          `}
        >
          <div
            className={`
              p-4
              space-y-3
              bg-white
              ${
                mobileMenu
                  ? "block"
                  : "hidden"
              }
            `}
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileMenu(
                      false,
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-4
                    px-4
                    py-4
                    rounded-2xl
                    font-semibold
                    transition-all
                    duration-200
                    ${
                      active
                        ? "bg-black text-white"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                    }
                  `}
                >
                  <Icon size={20} />

                  <span>
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {/* MOBILE PROFILE */}

            <div className="bg-gray-50 rounded-3xl p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">
                  S
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    Seller Account
                  </h3>

                  <p className="text-sm text-gray-500">
                    Store Access
                  </p>
                </div>
              </div>

              <button
                onClick={
                  handleLogout
                }
                className="mt-4 w-full bg-black text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <LogOut size={18} />

                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}