"use client";

import Link from "next/link";

import {
  ShoppingBag,
  Package,
  Sparkles,
  Menu,
  X,
  Info,
  Phone,
  Store,
  User,
  LogOut,
  Trophy,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import { auth, db } from "../../lib/firebase";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();

  const pathname =
    usePathname();

  const isMongsoPage =
    pathname?.includes(
      "/sellerpage/mongso/"
    );

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [customer, setCustomer] =
    useState<any>(null);

  // =========================
  // CUSTOMER AUTH CHECK
  // =========================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user) {
              router.replace(
                "/customer/signin"
              );

              return;
            }

            const customerRef = doc(
              db,
              "customers",
              user.uid
            );

            const customerSnap =
              await getDoc(customerRef);

            if (
              !customerSnap.exists()
            ) {
              router.replace(
                "/customer/signin"
              );

              return;
            }

            const customerData =
              customerSnap.data();

            if (
              customerData.role !==
              "customer"
            ) {
              router.replace(
                "/customer/signin"
              );

              return;
            }

            if (
              customerData.isBlocked
            ) {
              router.replace(
                "/customer/signin"
              );

              return;
            }

            setCustomer({
              uid: user.uid,
              ...customerData,
            });
          } catch (error) {
            console.error(error);

            router.replace(
              "/customer/signin"
            );
          } finally {
            setCheckingAuth(false);
          }
        }
      );

    return () => unsubscribe();
  }, [router]);

  // =========================
  // LOCK BODY SCROLL
  // =========================

  useEffect(() => {
    document.body.style.overflow =
      menuOpen
        ? "hidden"
        : "auto";

    return () => {
      document.body.style.overflow =
        "auto";
    };
  }, [menuOpen]);

  // =========================
  // LOGOUT
  // =========================

  const handleLogout =
    async () => {
      try {
        localStorage.removeItem(
          "cart"
        );

        await signOut(auth);

        router.replace(
          "/customer/signin"
        );
      } catch (error) {
        console.error(error);

        alert("Logout failed");
      }
    };

  // =========================
  // THEME
  // =========================

  const theme = isMongsoPage
    ? {
        nav: "bg-black/90 border-red-950 backdrop-blur-2xl",
        logoBg:
          "bg-red-600 text-white",
        logoText:
          "text-white",
        accent:
          "text-red-500",
        subText:
          "text-zinc-500",
        navHover:
          "hover:bg-[#111]",
        profile:
          "bg-[#0D0D0D] border-zinc-800 hover:bg-[#111]",
        requestBtn:
          "bg-red-600 text-white hover:bg-red-500",
        menuBtn:
          "bg-[#111] hover:bg-[#181818] text-white",
        mobilePanel:
          "bg-black border-l border-zinc-900",
        mobileCard:
          "bg-[#0D0D0D]",
      }
    : {
        nav: "bg-white/90 border-gray-200 backdrop-blur-xl",
        logoBg:
          "bg-[#2EE6A6] text-[#0F172A]",
        logoText:
          "text-[#0F172A]",
        accent:
          "text-[#2EE6A6]",
        subText:
          "text-gray-500",
        navHover:
          "hover:bg-[#F1F5F9]",
        profile:
          "bg-[#F8FAFC] border-gray-200 hover:bg-[#EEF2F7]",
        requestBtn:
          "bg-[#2EE6A6] text-[#0F172A] hover:brightness-95",
        menuBtn:
          "bg-gray-100 hover:bg-gray-200 text-[#0F172A]",
        mobilePanel:
          "bg-white",
        mobileCard:
          "bg-[#F8FAFC]",
      };

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <div
        className={`w-full h-[72px] flex items-center justify-center border-b ${
          isMongsoPage
            ? "bg-black border-zinc-900 text-zinc-400"
            : "bg-white border-gray-200 text-[#0F172A]"
        }`}
      >
        <div className="text-sm font-medium tracking-wide">
          Checking account...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${theme.nav}`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-[72px] flex items-center justify-between">

   {/* LEFT */}
{/* LEFT */}
<Link
  href="/"
  className="flex items-center"
>
  {/* LOGO */}
  <div className="relative w-40 h-40   sm:w-40 sm:h-440 md:w-44 md:h-4 lg:w-50 lg:h-50  transition-all duration-300 group-hover:scale-105">
    <Image
      src="/ConviLogo.png"
      alt="Convi Logo"
      fill
      className="object-contain"
      priority
    />
  </div>
</Link>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-2">

            <NavLink
              href="/sellerpage"
              label="Sellers"
              icon={
                <Store
                  className={`w-4 h-4 ${theme.accent}`}
                />
              }
              hover={theme.navHover}
              text={theme.logoText}
            />

            <NavLink
              href="/customer/orders"
              label="Orders"
              icon={
                <Package
                  className={`w-4 h-4 ${theme.accent}`}
                />
              }
              hover={theme.navHover}
              text={theme.logoText}
            />

          

            <NavLink
              href="/customer/leaderboard"
              label="Leaderboard"
              icon={
                <Trophy
                  className={`w-4 h-4 ${theme.accent}`}
                />
              }
              hover={theme.navHover}
              text={theme.logoText}
            />
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            {/* PROFILE */}
            <Link
              href="/customer/profile"
              className={`hidden sm:flex items-center gap-3 transition-all px-3 py-2 rounded-2xl border ${theme.profile}`}
            >
              {customer?.photoURL ? (
                <img
                  src={
                    customer.photoURL
                  }
                  alt="profile"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${theme.logoBg}`}
                >
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className="hidden md:block text-left">
                <p
                  className={`text-sm font-medium line-clamp-1 ${theme.logoText}`}
                >
                  {customer?.name ||
                    "Customer"}
                </p>

                <p
                  className={`text-xs ${theme.subText}`}
                >
                  View Profile
                </p>
              </div>
            </Link>

            {/* REQUEST */}
            <Link
              href="/customer/request-product"
              className={`group px-4 py-2.5 rounded-2xl font-medium shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${theme.requestBtn}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />

                <span className="hidden md:block text-sm whitespace-nowrap tracking-wide">
                  Request Product
                </span>

                <span className="md:hidden text-sm">
                  Request
                </span>
              </div>
            </Link>

            {/* MOBILE MENU */}
            <button
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
              className={`lg:hidden w-11 h-11 rounded-2xl transition flex items-center justify-center ${theme.menuBtn}`}
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

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">

          {/* BACKDROP */}
          <div
            onClick={() =>
              setMenuOpen(false)
            }
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* PANEL */}
          <div
            className={`absolute top-0 right-0 h-full w-[85%] max-w-sm shadow-2xl flex flex-col animate-slide-in ${theme.mobilePanel}`}
          >

            {/* HEADER */}
            <div className="px-5 py-5 border-b border-zinc-800">
              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  {customer?.photoURL ? (
                    <img
                      src={
                        customer.photoURL
                      }
                      alt="profile"
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.logoBg}`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h2
                      className={`text-lg font-semibold ${theme.logoText}`}
                    >
                      {
                        customer?.name
                      }
                    </h2>

                    <p
                      className={`text-xs ${theme.subText}`}
                    >
                      {
                        customer?.email
                      }
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.menuBtn}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LINKS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">

              <MobileNavLink
                href="/customer/profile"
                icon={
                  <User
                    className={`w-5 h-5 ${theme.accent}`}
                  />
                }
                label="Profile"
                onClick={() =>
                  setMenuOpen(
                    false
                  )
                }
                theme={theme}
              />

              <MobileNavLink
                href="/sellerpage"
                icon={
                  <Store
                    className={`w-5 h-5 ${theme.accent}`}
                  />
                }
                label="Sellers"
                onClick={() =>
                  setMenuOpen(
                    false
                  )
                }
                theme={theme}
              />

              <MobileNavLink
                href="/customer/orders"
                icon={
                  <Package
                    className={`w-5 h-5 ${theme.accent}`}
                  />
                }
                label="Orders"
                onClick={() =>
                  setMenuOpen(
                    false
                  )
                }
                theme={theme}
              />
            </div>

            {/* FOOTER */}
            <div className="border-t border-zinc-800 p-5 space-y-3">

              <button
                onClick={
                  handleLogout
                }
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-2xl font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>

              <div
                className={`rounded-2xl p-4 ${theme.mobileCard}`}
              >
                <p
                  className={`text-sm font-semibold ${theme.logoText}`}
                >
                  ConviStore
                </p>

                <p
                  className={`text-xs mt-1 leading-relaxed ${theme.subText}`}
                >
                  Fast, local and
                  smart shopping
                  experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }

        @keyframes slide-in {
          from {
            transform: translateX(
              100%
            );
          }

          to {
            transform: translateX(
              0
            );
          }
        }

        .animate-slide-in {
          animation: slide-in
            0.28s ease-out;
        }
      `}</style>
    </>
  );
}

/* DESKTOP LINK */
function NavLink({
  href,
  icon,
  label,
  hover,
  text,
}: any) {
  return (
    <Link
      href={href}
      className={`group px-4 py-2.5 rounded-2xl transition-all duration-200 flex items-center gap-2 ${hover}`}
    >
      {icon}

      <span
        className={`font-medium text-sm ${text}`}
      >
        {label}
      </span>
    </Link>
  );
}

/* MOBILE LINK */
function MobileNavLink({
  href,
  icon,
  label,
  onClick,
  theme,
}: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-all duration-200 hover:bg-[#111]`}
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${theme.mobileCard}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className={`font-medium ${theme.logoText}`}
        >
          {label}
        </p>

        <p
          className={`text-xs mt-0.5 ${theme.subText}`}
        >
          Open{" "}
          {label.toLowerCase()}
        </p>
      </div>
    </Link>
  );
}