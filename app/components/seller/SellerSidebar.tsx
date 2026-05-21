// components/seller/SellerSidebar.tsx

"use client";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { signOut } from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";

// =========================
// NAVIGATION
// =========================

const navItems = [
  {
    title: "Main",
    items: [
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
    ],
  },

  {
    title: "Management",
    items: [
      {
        name: "Orders",
        href: "/orders",
        icon: Package,
      },
    ],
  },

  {
    title: "System",
    items: [
      {
        name: "Settings",
        href: "/account",
        icon: Settings,
      },
    ],
  },
];

// =========================
// SIDEBAR
// =========================

export default function SellerSidebar() {
  const pathname = usePathname();

  const router = useRouter();

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      alert("✅ Logged out successfully");

      router.push("/login");
    } catch (err) {
      console.error(err);

      alert("Logout failed");
    }
  };

  return (
    <aside className="w-[290px] h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
      {/* HEADER */}

      <div className="h-24 px-6 border-b border-gray-100 flex items-center">
        <div className="flex items-center gap-3">
          {/* ICON */}

          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>

          {/* TEXT */}

          <div>
            <h1 className="text-2xl font-black text-gray-900">Seller</h1>

            <p className="text-sm text-gray-500">Store Panel</p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-8">
          {navItems.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {/* TITLE */}

              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">
                {section.title}
              </h2>

              {/* ITEMS */}

              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  const active = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={true}
                      className={`
                            flex items-center gap-4
                            px-4 py-4
                            rounded-2xl
                            transition-all duration-200
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
                        <Icon size={22} />
                      </div>

                      {/* TEXT */}

                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                      </div>

                      {/* ACTIVE DOT */}

                      {active && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-3xl p-4">
          {/* PROFILE */}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">
              S
            </div>

            <div>
              <h3 className="font-bold">Seller Account</h3>

              <p className="text-sm text-gray-500">Store Access</p>
            </div>
          </div>

          {/* LOGOUT */}

          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-black hover:opacity-90 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
