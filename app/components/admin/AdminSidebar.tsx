// components/admin/AdminSidebar.tsx

"use client";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
} from "@/lib/firebase";

import {
  LayoutDashboard,
  ShoppingCart,
  Store,
  LogOut,
  Shield,
  User,
  Flag,
  Menu,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

// =========================
// NAVIGATION
// =========================

const navItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },

  {
    name: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },

  {
    name: "Sellers",
    href: "/admin/sellers",
    icon: Store,
  },

  {
    name: "Customers",
    href: "/admin/customers",
    icon: User,
  },

  {
    name: "Requests",
    href: "/admin/productRequests",
    icon: Shield,
  },

  {
    name: "Reports",
    href: "/admin/report",
    icon: Flag,
  },
];

// =========================
// COMPONENT
// =========================

export default function AdminSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [mobileMenu, setMobileMenu] =
    useState(false);

  // =========================
  // PREVENT BODY SCROLL
  // =========================

  useEffect(() => {
    if (mobileMenu) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "auto";
    }

    return () => {
      document.body.style.overflow =
        "auto";
    };
  }, [mobileMenu]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        alert(
          "✅ Logged out successfully",
        );

        router.push(
          "/admin-login",
        );
      } catch (err) {
        console.error(err);

        alert(
          "Logout failed",
        );
      }
    };

  // =========================
  // NAV ITEMS
  // =========================

  const NavItems = () => (
    <div className="space-y-2">
      {navItems.map((item) => {
        const Icon =
          item.icon;

        const active =
          pathname ===
          item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={
              true
            }
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
              transition-all
              duration-200
              group
              ${
                active
                  ? "bg-black text-white shadow-lg"
                  : "hover:bg-gray-100 text-gray-700"
              }
            `}
          >
            {/* ICON */}

            <div
              className={`
                ${
                  active
                    ? "text-white"
                    : "text-gray-500 group-hover:text-black"
                }
              `}
            >
              <Icon
                size={
                  22
                }
              />
            </div>

            {/* TEXT */}

            <div className="flex-1">
              <p className="font-semibold">
                {
                  item.name
                }
              </p>
            </div>

            {/* ACTIVE DOT */}

            {active && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ========================= */}
      {/* TOP NAVBAR */}
      {/* ========================= */}

      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="h-16 md:h-20 px-4 md:px-6 flex items-center justify-between">
          {/* LEFT */}

          <div className="flex items-center gap-3">
            {/* MOBILE MENU */}

            <button
              onClick={() =>
                setMobileMenu(
                  true,
                )
              }
              className="md:hidden w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center shadow-md"
            >
              <Menu
                size={
                  22
                }
              />
            </button>

            {/* LOGO */}

            <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
              <Shield
                size={
                  22
                }
              />
            </div>

            {/* TEXT */}

            <div>
              <h1 className="text-lg md:text-2xl font-black text-gray-900 leading-none">
                Admin Panel
              </h1>

              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Control Center
              </p>
            </div>
          </div>

          {/* DESKTOP NAV */}

          <div className="hidden md:flex items-center gap-3">
            {navItems.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  pathname ===
                  item.href;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
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
                    <Icon
                      size={
                        18
                      }
                    />

                    <span>
                      {
                        item.name
                      }
                    </span>
                  </Link>
                );
              },
            )}
          </div>

          {/* RIGHT */}

          <div className="flex items-center gap-3">
            {/* PROFILE */}

            <div className="hidden sm:flex items-center gap-3 bg-gray-100 rounded-2xl px-3 py-2">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                A
              </div>

              <div className="hidden lg:block">
                <h3 className="text-sm font-bold text-gray-900 leading-none">
                  Admin
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Full Access
                </p>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={
                handleLogout
              }
              className="bg-black hover:opacity-90 text-white px-4 md:px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogOut
                size={
                  18
                }
              />

              <span className="hidden sm:block">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================= */}
      {/* MOBILE OVERLAY */}
      {/* ========================= */}

      <div
        onClick={() =>
          setMobileMenu(
            false,
          )
        }
        className={`
          md:hidden
          fixed
          inset-0
          bg-black/40
          backdrop-blur-sm
          z-40
          transition-all
          duration-300
          ${
            mobileMenu
              ? "opacity-100 visible"
              : "opacity-0 invisible"
          }
        `}
      />

      {/* ========================= */}
      {/* MOBILE DRAWER */}
      {/* ========================= */}

      <aside
        className={`
          md:hidden
          fixed
          top-0
          left-0
          h-screen
          w-[300px]
          bg-white
          z-50
          flex
          flex-col
          transition-all
          duration-300
          shadow-2xl
          ${
            mobileMenu
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* DRAWER HEADER */}

        <div className="h-20 px-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
              <Shield
                size={
                  24
                }
              />
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Admin
              </h1>

              <p className="text-sm text-gray-500">
                Control Panel
              </p>
            </div>
          </div>

          {/* CLOSE */}

          <button
            onClick={() =>
              setMobileMenu(
                false,
              )
            }
            className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center"
          >
            <X
              size={
                20
              }
            />
          </button>
        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto p-4">
          <NavItems />
        </div>

        {/* FOOTER */}

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-4">
            {/* PROFILE */}

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-md">
                A
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Administrator
                </h3>

                <p className="text-sm text-gray-500">
                  Full Access
                </p>
              </div>
            </div>

            {/* LOGOUT */}

            <button
              onClick={
                handleLogout
              }
              className="mt-4 w-full bg-black hover:opacity-90 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <LogOut
                size={
                  18
                }
              />

              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}