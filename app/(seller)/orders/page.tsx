"use client";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebaseMessaging";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { db } from "../../../lib/firebase";

import { getAuth, onAuthStateChanged } from "firebase/auth";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Package,
  Search,
  ShoppingBag,
  TrendingUp,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// =========================
// CONSTANTS
// =========================

const ORDER_STATUSES = [
  "all",
  "fast",
  "fastaccepted",
  "pending",
  "accepted",
  "rejected",
  "delivered",
];

const PAGE_LIMIT = 5;

// =========================
// DATE HELPERS
// =========================

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const get7DaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  date.setHours(0, 0, 0, 0);
  return date;
};

const get30DaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getThisMonth = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// =========================
// STATUS COLORS
// =========================

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "accepted":
      return "bg-blue-100 text-blue-700";

    case "delivered":
      return "bg-green-100 text-green-700";

    case "rejected":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

// =========================
// ORDER CARD
// =========================

const OrderCard = memo(
  ({
    order,
    updateOrderStatus,
    productMap,
    expandedOrders,
    toggleOrder,
    compactView,
  }: any) => {
    const [confirmModal, setConfirmModal] = useState<{
      open: boolean;
      orderId: string;
      status: string;
      title: string;
      message: string;
    }>({
      open: false,
      orderId: "",
      status: "",
      title: "",
      message: "",
    });

    const [rejectModal, setRejectModal] = useState<{
      open: boolean;
      orderId: string;
      reason: string;
    }>({
      open: false,
      orderId: "",
      reason: "",
    });
    return (
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-white to-gray-50">
          <div className="flex flex-col xl:flex-row justify-between gap-5">
            <div>
              <div className="flex flex-col xl:flex-row justify-between gap-4 sm:gap-5">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 break-all">
                  {order.orderId}
                </h2>

                <span
                  className={`px-4 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(
                    order.status,
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-5 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User size={16} />

                  {order.customer?.name}
                </div>

                <div className="flex items-center gap-2">
                  <Clock3 size={16} />

                  {order.delivery?.slot}
                </div>

                <div>📞 {order.customer?.phone}</div>

                <div>💳 {order.paymentMethod}</div>
              </div>

              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                📍 {order.customer?.address}, {order.customer?.city}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Total Amount</p>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mt-1 break-words">
                ₹{order.analytics?.totalAmount || 0}
              </h2>

              <p className="text-sm text-gray-500 mt-3">
                {order.createdAt?.toDate
                  ? order.createdAt.toDate().toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* TOGGLE */}
        <div className="p-5 border-b bg-gray-50">
          <button
            onClick={() => toggleOrder(order.id)}
            className="w-full bg-white hover:bg-gray-100 transition-all rounded-2xl px-5 py-4 font-semibold flex items-center justify-between"
          >
            <span>View Products ({order.items?.length})</span>

            {expandedOrders[order.id] ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>

        {/* PRODUCTS */}
        {(!compactView || expandedOrders[order.id]) && (
          <div className="p-6 space-y-5">
            {order.items?.map((item: any, index: number) => {
              const product = productMap[item.productId];

              // Get image from product or order
              const rawImage =
                product?.images?.[0]?.url || product?.images?.[0] || item.image;

              const imageUrl =
                rawImage && typeof rawImage === "string"
                  ? `${rawImage}?tr=w-400,q-60,f-webp`
                  : null;

              return (
                <div
                  key={index}
                  className="border border-gray-100 rounded-3xl p-4 bg-gray-50"
                >
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
                    {/* IMAGE */}
                    <div className="relative w-full sm:w-48 lg:w-40 h-48 sm:h-40 rounded-2xl overflow-hidden bg-white mx-auto lg:mx-0">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={product?.name || "Product"}
                          fill
                          loading="lazy"
                          quality={60}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 192px, 160px"
                          className="object-cover"
                          unoptimized
                        />
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                            {product?.name}
                          </h2>

                          <p className="text-gray-500 mt-2 leading-relaxed">
                            {product?.description}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-400">Item Total</p>

                          <h2 className="text-3xl font-black text-gray-900">
                            ₹{item.price * item.quantity}
                          </h2>
                        </div>
                      </div>

                      {/* PRODUCT GRID */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5 sm:mt-6">
                        <div className="bg-white rounded-2xl p-4">
                          <p className="text-xs text-gray-400">Category</p>

                          <h3 className="font-semibold mt-2">
                            {product?.category}
                          </h3>
                        </div>

                        <div className="bg-white rounded-2xl p-3 sm:p-4 overflow-hidden">
                          <p className="text-xs text-gray-400">Unit</p>

                          <h3 className="font-semibold mt-2">
                            {product?.unit}
                          </h3>
                        </div>

                        <div className="bg-white rounded-2xl p-3 sm:p-4 overflow-hidden">
                          <p className="text-xs text-gray-400">Quantity</p>

                          <h3 className="font-semibold mt-2">
                            {item.quantity}
                          </h3>
                        </div>

                        <div className="bg-white rounded-2xl p-3 sm:p-4 overflow-hidden">
                          <p className="text-xs text-gray-400">Stock</p>

                          <h3 className="font-semibold mt-2">
                            {product?.status?.stock}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* REJECTION */}
        {order.rejectionReason && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <h3 className="font-bold text-red-600 mb-2">Rejection Reason</h3>

              <p className="text-red-500 text-sm">{order.rejectionReason}</p>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row flex-wrap gap-3">
          {(order.status === "pending" ||
            (order.delivery?.type === "fast" &&
              order.status !== "accepted" &&
              order.status !== "delivered")) && (
            <>
              <button
                onClick={() =>
                  setConfirmModal({
                    open: true,

                    orderId: order.id,

                    status: "accepted",

                    title: "Accept Order",

                    message: "Are you sure you want to accept this order?",
                  })
                }
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl text-sm sm:text-base font-semibold transition-all"
              >
                Accept Order
              </button>

              <button
                onClick={() =>
                  setRejectModal({
                    open: true,
                    orderId: order.id,
                    reason: "",
                  })
                }
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all"
              >
                Reject Order
              </button>
            </>
          )}

          {order.status === "accepted" && (
            <button
              onClick={() =>
                setConfirmModal({
                  open: true,

                  orderId: order.id,

                  status: "delivered",

                  title: "Mark Delivered",

                  message: "Are you sure this order has been delivered?",
                })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all"
            >
              Mark Delivered
            </button>
          )}
        </div>
        {/* CONFIRM MODAL */}
        {confirmModal.open && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900">
                {confirmModal.title}
              </h2>

              <p className="text-gray-500 mt-3 leading-relaxed">
                {confirmModal.message}
              </p>

              <div className="flex gap-3 mt-8">
                {/* CANCEL */}
                <button
                  onClick={() =>
                    setConfirmModal({
                      open: false,
                      orderId: "",
                      status: "",
                      title: "",
                      message: "",
                    })
                  }
                  className="flex-1 border border-gray-200 hover:bg-gray-100 py-3 rounded-2xl font-semibold transition-all"
                >
                  Cancel
                </button>

                {/* CONFIRM */}
                <button
                  onClick={async () => {
                    await updateOrderStatus(
                      confirmModal.orderId,
                      confirmModal.status,
                    );

                    setConfirmModal({
                      open: false,
                      orderId: "",
                      status: "",
                      title: "",
                      message: "",
                    });
                  }}
                  className={`flex-1 text-white py-3 rounded-2xl font-semibold transition-all ${
                    confirmModal.status === "accepted"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Yes Proceed
                </button>
              </div>
            </div>
          </div>
        )}
        {/* REJECT MODAL */}
        {rejectModal.open && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-2xl font-black text-gray-900">
                Reject Order
              </h2>

              <p className="text-gray-500 mt-3">
                Please provide a rejection reason.
              </p>

              <textarea
                value={rejectModal.reason}
                onChange={(e) =>
                  setRejectModal((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Enter rejection reason..."
                className="w-full mt-5 border border-gray-200 rounded-2xl p-4 outline-none resize-none h-32"
              />

              <div className="flex gap-3 mt-8">
                {/* CANCEL */}
                <button
                  onClick={() =>
                    setRejectModal({
                      open: false,
                      orderId: "",
                      reason: "",
                    })
                  }
                  className="flex-1 border border-gray-200 hover:bg-gray-100 py-3 rounded-2xl font-semibold transition-all"
                >
                  Cancel
                </button>

                {/* CONFIRM */}
                <button
                  disabled={!rejectModal.reason.trim()}
                  onClick={async () => {
                    await updateOrderStatus(
                      rejectModal.orderId,
                      "rejected",
                      rejectModal.reason,
                    );

                    setRejectModal({
                      open: false,
                      orderId: "",
                      reason: "",
                    });
                  }}
                  className={`flex-1 py-3 rounded-2xl font-semibold text-white transition-all ${
                    rejectModal.reason.trim()
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

OrderCard.displayName = "OrderCard";

// =========================
// MAIN PAGE
// =========================

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [sellerId, setSellerId] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("all");

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [lastDoc, setLastDoc] = useState<any>(null);

  const [hasMore, setHasMore] = useState(true);

  const [dateFilter, setDateFilter] = useState("today");

  const [productMap, setProductMap] = useState<any>({});

  const [compactView, setCompactView] = useState(true);

  const [expandedOrders, setExpandedOrders] = useState<any>({});

  const fetchingRef = useRef(false);

  const [authLoading, setAuthLoading] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const firstLoadRef = useRef(true);

  const seenOrders = useRef(new Set<string>());

  const vibrationRef = useRef<NodeJS.Timeout | null>(null);

  const [showRingModal, setShowRingModal] = useState(false);

  // =========================
  // VIBRATION HELPERS
  // =========================

  const startVibration = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([500, 300, 500, 300]);

      vibrationRef.current = setInterval(() => {
        navigator.vibrate([500, 300, 500, 300]);
      }, 2000);
    }
  }, []);

  const stopVibration = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }

    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }
  }, []);

  const stopRinging = useCallback(() => {
    audioRef.current?.pause();

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    stopVibration();

    setShowRingModal(false);
  }, [stopVibration]);

  // =========================
  // CACHE CLEANUP
  // =========================

  useEffect(() => {
    const cacheTime = localStorage.getItem("products_cache_time");

    const now = Date.now();

    if (!cacheTime || now - Number(cacheTime) > 86400000) {
      localStorage.removeItem("products_cache");

      localStorage.setItem("products_cache_time", now.toString());
    }
  }, []);

  // =========================
  // SEARCH DEBOUNCE
  // =========================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // =========================
  // AUTH
  // =========================

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // NOT LOGGED IN
      if (!user) {
        router.replace("/login");

        return;
      }

      // LOGGED IN
      setSellerId(user.uid);

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // =========================
  // INIT AUDIO + UNLOCK AUTOPLAY
  // =========================

  useEffect(() => {
 audioRef.current = new Audio("/sounds/order.mp3");
audioRef.current.loop = true;
audioRef.current.volume = 1;
audioRef.current.muted = false;

    // Unlock audio on first user interaction (mobile/Chrome autoplay policy)
  const unlockAudio = async () => {
  try {
    await audioRef.current?.play();

    setTimeout(() => {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }, 100);
  } catch (err) {
    console.log(err);
  }
};

    document.addEventListener("click", unlockAudio, { once: true });
    document.addEventListener("touchstart", unlockAudio, { once: true });

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);

      audioRef.current?.pause();

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      stopVibration();
    };
  }, [stopVibration]);

  // =========================
  // REALTIME LISTENER FOR NEW ORDERS (RINGS UNTIL STOPPED)
  // =========================

  useEffect(() => {
    if (!sellerId) return;

    // Reset first-load flag whenever sellerId changes
    firstLoadRef.current = true;
    seenOrders.current = new Set<string>();

    const q = query(
      collection(db, "purchases"),
      where("sellerIds", "array-contains", sellerId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // First load: just remember existing pending orders, don't ring
      if (firstLoadRef.current) {
        snapshot.forEach((d) => {
          seenOrders.current.add(d.id);
        });

        firstLoadRef.current = false;
        return;
      }

      let newOrderDetected = false;

      snapshot.docChanges().forEach((change) => {
        if (
          change.type === "added" &&
          !seenOrders.current.has(change.doc.id)
        ) {
          seenOrders.current.add(change.doc.id);
          newOrderDetected = true;
        }
      });

      if (newOrderDetected) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;

          audioRef.current.play().catch((err) => {
            console.error("Audio play failed:", err);
          });
        }

        startVibration();

        setShowRingModal(true);
      }
    });

    return () => unsubscribe();
  }, [sellerId, startVibration]);

  
useEffect(() => {
  if (!sellerId) return;

  requestPermission();
}, [sellerId]);

useEffect(() => {
  if (!messaging) return;

  const unsubscribe = onMessage(messaging, (payload) => {
  console.log(payload);

  audioRef.current?.play().catch(() => {});

  navigator.vibrate?.([500, 300, 500]);
});

  return unsubscribe;
}, []);
const requestPermission = async () => {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") return;

  const token = await getToken(messaging!, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
  });

  console.log("FCM Token:", token);

  const q = query(
    collection(db, "sellers"),
    where("firebaseUid", "==", sellerId),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    console.log("Seller not found");
    return;
  }

  await updateDoc(snap.docs[0].ref, {
    fcmToken: token,
  });

  console.log("FCM token saved");
};

  // =========================
  // TOGGLE ORDER
  // =========================

  const toggleOrder = (id: string) => {
    setExpandedOrders((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // =========================
  // FETCH PRODUCTS
  // =========================

  const fetchMissingProducts = async (ordersData: any[]) => {
    try {
      const cachedProducts = JSON.parse(
        localStorage.getItem("products_cache") || "{}",
      );

      const missingIds = new Set<string>();

      ordersData.forEach((order) => {
        order.items?.forEach((item: any) => {
          if (item.productId && !cachedProducts[item.productId]) {
            missingIds.add(item.productId);
          }
        });
      });

      if (missingIds.size === 0) {
        setProductMap(cachedProducts);

        return;
      }

      const idsArray = [...missingIds];

      const updatedMap = {
        ...cachedProducts,
      };

      for (let i = 0; i < idsArray.length; i += 10) {
        const batch = idsArray.slice(i, i + 10);

        const q = query(
          collection(db, "products"),
          where("productId", "in", batch),
        );

        const snapshot = await getDocs(q);

        snapshot.forEach((doc) => {
          const product = doc.data();

          updatedMap[product.productId] = product;
        });
      }

      localStorage.setItem("products_cache", JSON.stringify(updatedMap));

      setProductMap(updatedMap);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // FETCH ORDERS
  // =========================

  const fetchOrders = useCallback(
    async (initial = false) => {
      try {
        if (!sellerId) return;

        if (fetchingRef.current) return;

        fetchingRef.current = true;

        if (initial) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const constraints: any[] = [];

        constraints.push(where("sellerIds", "array-contains", sellerId));

        let startDate: Date | null = null;

        if (dateFilter === "today") {
          startDate = getStartOfToday();
        }

        if (dateFilter === "7days") {
          startDate = get7DaysAgo();
        }

        if (dateFilter === "30days") {
          startDate = get30DaysAgo();
        }

        if (dateFilter === "month") {
          startDate = getThisMonth();
        }

        if (startDate) {
          constraints.push(
            where("createdAt", ">=", Timestamp.fromDate(startDate)),
          );
        }

        constraints.push(orderBy("createdAt", "desc"));

        if (!initial && lastDoc) {
          constraints.push(startAfter(lastDoc));
        }

        constraints.push(limit(PAGE_LIMIT));

        const q = query(collection(db, "purchases"), ...constraints);

        const snapshot = await getDocs(q);

        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHasMore(snapshot.docs.length === PAGE_LIMIT);

        if (snapshot.docs.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }

        setOrders((prev) => (initial ? ordersData : [...prev, ...ordersData]));

        await fetchMissingProducts(ordersData);
      } catch (err) {
        console.error(err);
      } finally {
        fetchingRef.current = false;

        setLoading(false);

        setLoadingMore(false);
      }
    },
    [sellerId, lastDoc, dateFilter],
  );

  // =========================
  // FETCH ON LOAD
  // =========================

  useEffect(() => {
    if (!sellerId) return;

    setOrders([]);

    setLastDoc(null);

    fetchOrders(true);
  }, [sellerId, dateFilter]);

  // =========================
  // UPDATE STATUS
  // =========================

  const updateOrderStatus = async (
    orderId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    try {
      const orderRef = doc(db, "purchases", orderId);

      await updateDoc(orderRef, {
        status,

        updatedAt: serverTimestamp(),

        rejectionReason: status === "rejected" ? rejectionReason : "",

        ...(status === "delivered" && {
          paymentStatus: "paid",
        }),
      });

      stopRinging();

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,

              status,

              ...(status === "delivered" && {
                paymentStatus: "paid",
              }),
            };
          }

          return order;
        }),
      );
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // FILTERED ORDERS
  // =========================

  const filteredOrders = useMemo(() => {
    return (
      orders
        .filter((order: any) => {
          const matchesSearch =
            order.orderId
              ?.toLowerCase()
              .includes(debouncedSearch.toLowerCase()) ||
            order.customer?.name
              ?.toLowerCase()
              .includes(debouncedSearch.toLowerCase());

          const isFast = order.delivery?.type === "fast";

          const isFastAccepted = isFast && order.status === "accepted";

          const matchesStatus =
            selectedStatus === "all"
              ? true
              : selectedStatus === "fast"
                ? isFast &&
                  order.status !== "accepted" &&
                  order.status !== "delivered"
                : selectedStatus === "fastaccepted"
                  ? isFastAccepted
                  : order.status === selectedStatus;

          return matchesSearch && matchesStatus;
        })

        // PRIORITY SORTING
        .sort((a: any, b: any) => {
          const aFastAccepted =
            a.delivery?.type === "fast" && a.status === "accepted";

          const bFastAccepted =
            b.delivery?.type === "fast" && b.status === "accepted";

          // FAST ACCEPTED ALWAYS TOP
          if (aFastAccepted && !bFastAccepted) return -1;

          if (!aFastAccepted && bFastAccepted) return 1;

          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        })
    );
  }, [orders, debouncedSearch, selectedStatus]);

  // =========================
  // ANALYTICS
  // =========================

  const analytics = useMemo(() => {
    return {
      totalOrders: filteredOrders.length,

      totalRevenue: filteredOrders.reduce(
        (sum, order) => sum + (order.analytics?.totalAmount || 0),
        0,
      ),

      todayOrders: orders.filter((order) => {
        const orderDate = order.createdAt?.toDate()?.toDateString();

        return orderDate === new Date().toDateString();
      }).length,

      pending: orders.filter((o) => o.status === "pending").length,

      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  }, [filteredOrders, orders]);

  // =========================
  // AUTH LOADING
  // =========================

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-5" />

          <h2 className="text-2xl font-black">Checking Authentication...</h2>
        </div>
      </div>
    );
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading Orders...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-3 py-4 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto overflow-x-hidden">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-tight">
            Orders Dashboard
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-500 mt-2">
            Manage and track all seller orders
          </p>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
            <TrendingUp className="mb-3" />

            <p className="text-sm text-gray-500">Revenue</p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2 break-words">
              ₹{analytics.totalRevenue}
            </h2>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
            <ShoppingBag className="mb-3" />

            <p className="text-sm text-gray-500">Orders</p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2 break-words">
              {analytics.totalOrders}
            </h2>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
            <CalendarDays className="mb-3" />

            <p className="text-sm text-gray-500">Today Orders</p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2 break-words">
              {analytics.todayOrders}
            </h2>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
            <Clock3 className="mb-3" />

            <p className="text-sm text-gray-500">Pending</p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2 break-words">
              {analytics.pending}
            </h2>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm overflow-hidden">
            <Package className="mb-3" />

            <p className="text-sm text-gray-500">Delivered</p>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2 break-words">
              {analytics.delivered}
            </h2>
          </div>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm mb-8">
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-5 justify-between">
            {/* SEARCH */}
            <div className="relative w-full xl:w-96">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-4 rounded-2xl border border-gray-200 outline-none text-sm sm:text-base"
              />
            </div>

            {/* DATE FILTERS */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                {
                  label: "Today",
                  value: "today",
                },
                {
                  label: "Last 7 Days",
                  value: "7days",
                },
                {
                  label: "Last 30 Days",
                  value: "30days",
                },
                {
                  label: "This Month",
                  value: "month",
                },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setDateFilter(item.value)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl whitespace-nowrap text-sm sm:text-base font-semibold transition-all ${
                    dateFilter === item.value
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* STATUS */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto mt-5 sm:mt-6 pb-2 scrollbar-hide">
            {ORDER_STATUSES.map((status) => {
              const count = orders.filter((o) => {
                const isFast = o.delivery?.type === "fast";

                // FAST PENDING
                if (status === "fast") {
                  return (
                    isFast &&
                    o.status !== "accepted" &&
                    o.status !== "delivered"
                  );
                }

                // FAST ACCEPTED
                if (status === "fastaccepted") {
                  return isFast && o.status === "accepted";
                }

                // ALL
                if (status === "all") return true;

                return o.status === status;
              }).length;

              const isFast = status === "fast";

              const isFastAccepted = status === "fastaccepted";

              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`relative overflow-hidden px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl whitespace-nowrap text-sm sm:text-base font-semibold flex items-center gap-2 transition-all duration-300 border shrink-0 ${
                    isFast
                      ? selectedStatus === status
                        ? "bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white border-orange-400 shadow-[0_0_30px_rgba(255,115,0,0.45)] scale-105"
                        : "bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 text-orange-700 border-orange-200 hover:scale-105"
                      : isFastAccepted
                        ? selectedStatus === status
                          ? "bg-gradient-to-r from-[#00C896] to-[#00E6A7] text-black border-[#00E6A7] shadow-[0_0_30px_rgba(0,230,167,0.35)] scale-105"
                          : "bg-gradient-to-r from-[#DFFFF5] to-[#EFFFF9] text-[#00A876] border-[#B8FFE9] hover:scale-105"
                        : selectedStatus === status
                          ? "bg-[#2EE6A6] text-black border-transparent"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {/* GLOW */}
                  {(isFast || isFastAccepted) && (
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  )}

                  {/* ICON */}
                  {isFast && <span className="relative text-lg">⚡</span>}

                  {isFastAccepted && (
                    <span className="relative text-lg">🚀</span>
                  )}

                  <span className="capitalize relative">
                    {status === "fast"
                      ? "Fast Delivery"
                      : status === "fastaccepted"
                        ? "Fast Accepted"
                        : status}
                  </span>

                  <span
                    className={`relative px-2 py-1 rounded-full text-xs ${
                      isFast || isFastAccepted ? "bg-white/20" : "bg-black/10"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* VIEW MODE */}
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setCompactView(!compactView)}
              className="bg-black text-white px-5 py-3 rounded-2xl font-semibold"
            >
              {compactView ? "Expand Orders" : "Compact View"}
            </button>
          </div>
        </div>

        {/* ORDERS */}
        <div className="space-y-8">
          {filteredOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              updateOrderStatus={updateOrderStatus}
              productMap={productMap}
              expandedOrders={expandedOrders}
              toggleOrder={toggleOrder}
              compactView={compactView}
            />
          ))}
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-[32px] p-14 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              No Orders Found
            </h2>

            <p className="text-gray-500 mt-2">Try changing your filters</p>
          </div>
        )}

        {/* LOAD MORE */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => fetchOrders(false)}
              disabled={loadingMore}
              className="bg-black hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold transition-all"
            >
              {loadingMore ? "Loading..." : "Load More Orders"}
            </button>
          </div>
        )}
      </div>

      {/* RING MODAL */}
      {showRingModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 w-[90%] max-w-md text-center">
            <div className="text-7xl animate-bounce">🔔</div>

            <h1 className="text-3xl font-black mt-5">New Order Received</h1>

            <p className="text-gray-500 mt-3">
              A customer has placed a new order.
            </p>

            <button
              onClick={stopRinging}
              className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold w-full"
            >
              Stop Ringing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}