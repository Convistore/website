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
        href: "/admin",
        icon: LayoutDashboard,
      },

      {
        name: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
    ],
  },

  {
    title: "Management",
    items: [
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
    ],
  },
];

// =========================
// SIDEBAR
// =========================

export default function AdminSidebar() {
  const pathname =
    usePathname();

  const router =
    useRouter();

  // =========================
  // LOGOUT
  // =========================

  const handleLogout =
    async () => {
      try {
        await signOut(auth);

        alert(
          "✅ Logged out successfully"
        );

        router.push(
          "/admin-login"
        );

      } catch (err) {
        console.error(err);

        alert(
          "Logout failed"
        );
      }
    };

  return (
    <aside className="w-[290px] h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
      {/* LOGO */}

      <div className="h-24 px-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
            <Shield size={24} />
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
      </div>

      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-8">
          {navItems.map(
            (
              section,
              sectionIndex
            ) => (
              <div
                key={
                  sectionIndex
                }
              >
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 mb-3">
                  {
                    section.title
                  }
                </h2>

                <div className="space-y-2">
                  {section.items.map(
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
                          prefetch={
                            true
                          }
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

                          <div className="flex-1">
                            <p className="font-semibold">
                              {
                                item.name
                              }
                            </p>
                          </div>

                          {active && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </Link>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* FOOTER */}

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-lg">
              A
            </div>

            <div>
              <h3 className="font-bold">
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
            <LogOut size={18} />

            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}