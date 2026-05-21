"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../../../components/Navbar";
import Image from "next/image";

import { useRouter } from "next/navigation";

import {
  Search,
  Filter,
  Calendar,
  Package,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";

import { auth, db } from "../../../../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [sortBy, setSortBy] =
    useState("Newest");

  const [showFilters, setShowFilters] =
    useState(false);

  // =========================
  // AUTH + FETCH ORDERS
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          // NOT LOGGED IN
          if (!user) {
            router.replace("/customer/signin");
            return;
          }

          // GET CUSTOMER
          const customerRef = doc(
            db,
            "customers",
            user.uid
          );

          const customerSnap =
            await getDoc(customerRef);

          // CUSTOMER NOT FOUND
          if (!customerSnap.exists()) {
            router.replace("/customer/signin");
            return;
          }

          const customerData =
            customerSnap.data();

          // WRONG ROLE
          if (
            customerData.role !== "customer"
          ) {
            router.replace("/customer/signin");
            return;
          }

          // BLOCKED
          if (customerData.isBlocked) {
            router.replace("/customer/signin");
            return;
          }

          // =========================
          // FETCH CUSTOMER ORDERS
          // =========================

          const ordersRef = collection(
            db,
            "customers",
            user.uid,
            "orders"
          );

          const ordersQuery = query(
            ordersRef,
            orderBy("createdAt", "desc")
          );

          const ordersSnap =
            await getDocs(ordersQuery);

          const orderRefs =
            ordersSnap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

          // =========================
          // FETCH PURCHASE DETAILS
          // =========================

          const purchasePromises =
            orderRefs.map(async (order: any) => {
              try {
                const purchaseRef = doc(
                  db,
                  "purchases",
                  order.purchaseId
                );

                const purchaseSnap =
                  await getDoc(
                    purchaseRef
                  );

                if (
                  purchaseSnap.exists()
                ) {
                  return {
                    firebaseId:
                      purchaseSnap.id,
                    ...purchaseSnap.data(),
                  };
                }

                return null;
              } catch (error) {
                console.error(error);
                return null;
              }
            });

          const purchases =
            await Promise.all(
              purchasePromises
            );

          const validOrders =
            purchases.filter(Boolean);

          setOrders(validOrders as any[]);
        } catch (error) {
          console.error(error);

          router.replace(
            "/customer/signin"
          );
        } finally {
          setCheckingAuth(false);
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // =========================
  // FILTERS
  // =========================

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // SEARCH

    if (search.trim()) {
      filtered = filtered.filter(
        (order) => {
          const searchText =
            search.toLowerCase();

          const orderIdMatch =
            order.orderId
              ?.toLowerCase()
              ?.includes(searchText);

          const customerMatch =
            order.customer?.address
              ?.toLowerCase()
              ?.includes(searchText);

          const productMatch =
            order.items?.some(
              (product: any) =>
                product.name
                  ?.toLowerCase()
                  ?.includes(
                    searchText
                  )
            );

          return (
            orderIdMatch ||
            customerMatch ||
            productMatch
          );
        }
      );
    }

    // STATUS

    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (order) =>
          order.status
            ?.toLowerCase() ===
          statusFilter.toLowerCase()
      );
    }

    // PAYMENT

    if (paymentFilter !== "All") {
      filtered = filtered.filter(
        (order) =>
          order.paymentMethod
            ?.toLowerCase() ===
          paymentFilter.toLowerCase()
      );
    }

    // SORTING

    if (sortBy === "Highest Amount") {
      filtered.sort(
        (a, b) =>
          (b.analytics
            ?.totalAmount || 0) -
          (a.analytics
            ?.totalAmount || 0)
      );
    }

    if (sortBy === "Lowest Amount") {
      filtered.sort(
        (a, b) =>
          (a.analytics
            ?.totalAmount || 0) -
          (b.analytics
            ?.totalAmount || 0)
      );
    }

    return filtered;
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
    sortBy,
  ]);

  // =========================
  // AUTH LOADING
  // =========================

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold">
          Checking account...
        </div>
      </div>
    );
  }

  // =========================
  // PAGE LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold">
          Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 pb-28 overflow-x-hidden">
      <Navbar />

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg">
                <ShoppingBag size={22} />
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  My Orders
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  Track and manage all your purchases
                </p>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Total Orders
              </p>

              <h2 className="text-2xl font-black mt-1">
                {orders.length}
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 px-5 py-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Showing
              </p>

              <h2 className="text-2xl font-black mt-1">
                {filteredOrders.length}
              </h2>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="bg-white border border-gray-200 rounded-3xl p-3 shadow-sm mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Search size={20} />
            </div>

            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="flex-1 bg-transparent outline-none text-sm sm:text-base"
            />

            <button
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-black text-white font-semibold text-sm"
            >
              <Filter size={18} />
              Filters
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-10 sm:p-14 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <Package size={40} />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black">
              No Orders Found
            </h2>

            <p className="text-gray-500 mt-3">
              You have not placed
              any orders yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(
              (order, index) => (
                <div
                  key={index}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* HEADER */}
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        <Package size={14} />
                        Order ID
                      </div>

                      <h2 className="text-lg sm:text-xl font-black mt-2 break-all">
                        {
                          order.orderId
                        }
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* STATUS */}
                      <div
                        className={`px-5 py-3 rounded-2xl text-sm font-bold ${
                          order.status ===
                          "delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status ===
                              "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : order.status ===
                              "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {
                          order.status
                        }
                      </div>

                      {/* PAYMENT STATUS */}
                      <div
                        className={`px-5 py-3 rounded-2xl text-sm font-bold ${
                          order.paymentStatus ===
                          "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        Payment:{" "}
                        {
                          order.paymentStatus
                        }
                      </div>

                      {/* TOTAL */}
                      <div className="bg-gray-100 rounded-2xl px-5 py-3">
                        <p className="text-xs text-gray-500">
                          Total Amount
                        </p>

                        <p className="text-xl font-black">
                          ₹
                          {
                            order
                              .analytics
                              ?.totalAmount
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS */}
                  <div className="p-5 sm:p-6">
                    <div className="space-y-4">
                      {order.items?.map(
                        (
                          product: any
                        ) => (
                          <div
                            key={
                              product.productId
                            }
                            className="flex gap-4 bg-gray-50 rounded-3xl p-4 border border-gray-100"
                          >
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                              <Image
                                src={
                                  product.image
                                    ? `${product.image}?tr=w-300,h-300,q-60,f-webp`
                                    : "/fallback.png"
                                }
                                alt={
                                  product.name
                                }
                                fill
                                sizes="120px"
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1">
                              <h3 className="text-base sm:text-lg font-black">
                                {
                                  product.name
                                }
                              </h3>

                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold">
                                  Qty:{" "}
                                  {
                                    product.quantity
                                  }
                                </div>

                                <div className="bg-white px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold">
                                  ₹
                                  {
                                    product.price
                                  }{" "}
                                  each
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                Total
                              </p>

                              <h2 className="text-xl font-black mt-2">
                                ₹
                                {product.price *
                                  product.quantity}
                              </h2>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div className="border-t border-gray-100 bg-gray-50 p-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                          Delivery Slot
                        </p>

                        <p className="text-base font-bold mt-2">
                          {
                            order
                              .delivery
                              ?.slot
                          }
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                          Payment Method
                        </p>

                        <p className="text-base font-bold mt-2 uppercase">
                          {
                            order.paymentMethod
                          }
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl border border-gray-100 p-4">
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                          Items
                        </p>

                        <p className="text-base font-bold mt-2">
                          {
                            order.items
                              ?.length
                          }{" "}
                          Products
                        </p>
                      </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 mt-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                        Delivery Address
                      </p>

                      <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">
                        {
                          order.customer
                            ?.address
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}