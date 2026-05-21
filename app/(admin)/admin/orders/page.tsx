"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  limit,
  startAfter,
} from "firebase/firestore";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  auth,
  db,
} from "@/lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import Image from "next/image";

import {
  Download,
  RefreshCcw,
  Search,
  User,
} from "lucide-react";

// =========================
// CONSTANTS
// =========================

const ORDER_STATUSES = [
  "all",
  "pending",
  "accepted",
  "rejected",
  "delivered",
];

// =========================
// HELPERS
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

const get7DaysAgo = () => {
  const date = new Date();

  date.setDate(date.getDate() - 7);

  return date;
};

const get30DaysAgo = () => {
  const date = new Date();

  date.setDate(date.getDate() - 30);

  return date;
};

// =========================
// PAGE
// =========================

export default function AdminOrdersPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);

  const [productsMap, setProductsMap] = useState<any>({});

  const [sellers, setSellers] = useState<any[]>([]);

  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [sellerFilter, setSellerFilter] = useState("all");

  const [dateFilter, setDateFilter] = useState("all");

  const [expandedOrders, setExpandedOrders] = useState<any>({});
const [lastOrderDoc, setLastOrderDoc] =
  useState<any>(null);

const [hasMoreOrders, setHasMoreOrders] =
  useState(true);

const [loadingMoreOrders, setLoadingMoreOrders] =
  useState(false);
  // =========================
  // ADMIN AUTH CHECK
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          // NOT LOGGED IN
          if (!user) {
            router.push("/admin-login");

            return;
          }

          // CHECK ADMINS COLLECTION
          const adminDoc = await getDoc(
            doc(db, "admins", user.uid)
          );

          // NOT ADMIN
          if (!adminDoc.exists()) {
            router.push("/");

            return;
          }

          const adminData = adminDoc.data();

          // ROLE CHECK
          if (adminData.role !== "admin") {
            router.push("/");

            return;
          }

          // ✅ AUTHORIZED
          setAuthorized(true);

          // FETCH DATA
          fetchData();

        } catch (err) {
          console.error(err);

          router.push("/");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // CACHE CLEANUP
  // =========================

  useEffect(() => {
    if (!authorized) return;

    const cacheTime = localStorage.getItem(
      "admin_products_cache_time"
    );

    const now = Date.now();

    if (
      !cacheTime ||
      now - Number(cacheTime) > 86400000
    ) {
      localStorage.removeItem(
        "admin_products_cache"
      );

      localStorage.setItem(
        "admin_products_cache_time",
        now.toString()
      );
    }
  }, [authorized]);
// =========================
// FORMAT DATE
// =========================

const formatDate = (
  date: any
) => {
  try {
    if (!date)
      return "No Date";

    // FIRESTORE TIMESTAMP
    if (date?.toDate) {
      return date
        .toDate()
        .toLocaleString();
    }

    return new Date(
      date
    ).toLocaleString();
  } catch {
    return "Invalid Date";
  }
};
  // =========================
  // FETCH DATA
  // =========================

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
const cache =
  localStorage.getItem(
    "admin_orders_cache"
  );

const cacheTime =
  localStorage.getItem(
    "admin_orders_cache_time"
  );

if (cache && cacheTime) {
  const isExpired =
    Date.now() -
      Number(cacheTime) >
    1000 * 60 * 5;

  if (!isExpired) {
    const parsed =
      JSON.parse(cache);

    setOrders(parsed);

    setFilteredOrders(parsed);

    setLoading(false);

    return;
  }
}
    // ORDERS ONLY
const ordersQuery = query(
  collection(db, "purchases"),
  orderBy("createdAt", "desc"),
  limit(20)
);

const ordersSnapshot =
  await getDocs(ordersQuery);

    const ordersData =
      ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
// SAVE LAST DOC
const lastVisible =
  ordersSnapshot.docs[
    ordersSnapshot.docs.length - 1
  ];

setLastOrderDoc(lastVisible);

// HAS MORE
setHasMoreOrders(
  ordersSnapshot.docs.length === 20
);
    setOrders(ordersData);

    setFilteredOrders(ordersData);

    localStorage.setItem(
  "admin_orders_cache",
  JSON.stringify(ordersData)
);

localStorage.setItem(
  "admin_orders_cache_time",
  Date.now().toString()
);

    // SELLERS
const sellersSnapshot = await getDocs(
  query(
    collection(db, "sellers"),
    limit(50)
  )
);

    const sellersData =
      sellersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    setSellers(sellersData);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, []);
// =========================
// LOAD MORE ORDERS
// =========================

const loadMoreOrders =
  async () => {
    try {
      if (
        !lastOrderDoc ||
        loadingMoreOrders
      )
        return;

      setLoadingMoreOrders(true);

      const nextQuery = query(
        collection(db, "purchases"),
        orderBy(
          "createdAt",
          "desc"
        ),
        startAfter(lastOrderDoc),
        limit(20)
      );

      const snapshot =
        await getDocs(nextQuery);

      const newOrders =
        snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      // UPDATE LAST DOC
      const lastVisible =
        snapshot.docs[
          snapshot.docs.length - 1
        ];

      setLastOrderDoc(
        lastVisible
      );

      // HAS MORE
      setHasMoreOrders(
        snapshot.docs.length === 20
      );

      // APPEND
      setOrders((prev) => [
        ...prev,
        ...newOrders,
      ]);

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMoreOrders(false);
    }
  };
  // =========================
  // FILTERS
  // =========================

  useEffect(() => {
    let updated = [...orders];

    // SEARCH
    if (search) {
      updated = updated.filter((order) => {
        return (
          order.orderId
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||

          order.customer?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||

          order.customer?.phone?.includes(
            search
          )
        );
      });
    }

    // STATUS
    if (statusFilter !== "all") {
      updated = updated.filter(
        (order) =>
          order.status === statusFilter
      );
    }

    // SELLER
    if (sellerFilter !== "all") {
      updated = updated.filter((order) =>
        order.sellerIds?.includes(
          sellerFilter
        )
      );
    }

    // DATE
    if (dateFilter !== "all") {
      const now = new Date();

      if (dateFilter === "7days") {
        updated = updated.filter(
          (order) =>
            order.createdAt?.toDate() >=
            get7DaysAgo()
        );
      }

      if (dateFilter === "30days") {
        updated = updated.filter(
          (order) =>
            order.createdAt?.toDate() >=
            get30DaysAgo()
        );
      }

      if (dateFilter === "today") {
        updated = updated.filter(
          (order) => {
            const orderDate =
              order.createdAt
                ?.toDate()
                ?.toDateString();

            return (
              orderDate ===
              now.toDateString()
            );
          }
        );
      }
    }

    setFilteredOrders(updated);

  }, [
    orders,
    search,
    statusFilter,
    sellerFilter,
    dateFilter,
  ]);

  // =========================
  // TOGGLE PRODUCTS
  // =========================

const toggleOrder = async (
  id: string,
  orderItems: any[]
) => {
  // CLOSE
  if (expandedOrders[id]) {
    setExpandedOrders(
      (prev: any) => ({
        ...prev,
        [id]: false,
      })
    );

    return;
  }

  try {
    // OPEN
    setExpandedOrders(
      (prev: any) => ({
        ...prev,
        [id]: true,
      })
    );

    // CHECK CACHE
    const missingIds =
      orderItems.filter(
        (item: any) =>
          !productsMap[
            item.productId
          ]
      );

    // NO NEED TO FETCH
    if (missingIds.length === 0)
      return;

    // FETCH ONLY REQUIRED PRODUCTS
    const updatedMap = {
      ...productsMap,
    };

    await Promise.all(
      missingIds.map(
        async (item: any) => {
          try {
            const productDoc =
              await getDoc(
                doc(
                  db,
                  "products",
                  item.productId
                )
              );

            if (
              productDoc.exists()
            ) {
              updatedMap[
                item.productId
              ] =
                productDoc.data();
            }
          } catch (error) {
            console.error(error);
          }
        }
      )
    );

    setProductsMap(updatedMap);

  } catch (error) {
    console.error(error);
  }
};

  // =========================
  // UPDATE STATUS
  // =========================

  const updateOrderStatus = async (
    orderId: string,
    status: string
  ) => {
    try {
      await updateDoc(
        doc(db, "purchases", orderId),
        {
          status,
          updatedAt: serverTimestamp(),
        }
      );

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id === orderId) {
            return {
              ...order,
              status,
            };
          }

          return order;
        })
      );

    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // EXPORT CSV
  // =========================

  const exportInvoices = () => {
    if (filteredOrders.length === 0)
      return;

    const rows = filteredOrders.map(
      (order) => ({
        OrderID: order.orderId,

        Customer:
          order.customer?.name,

        Phone:
          order.customer?.phone,

        Address: `${order.customer?.address}, ${order.customer?.city}`,

        Amount:
          order.analytics?.totalAmount,

        Status: order.status,

        Payment:
          order.paymentMethod,

        Date:
          order.createdAt
            ?.toDate()
            ?.toLocaleString(),
      })
    );

    const csv = [
      Object.keys(rows[0]).join(","),

      ...rows.map((row) =>
        Object.values(row).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download = "orders-report.csv";

    a.click();
  };

  // =========================
  // ANALYTICS
  // =========================

  const analytics = useMemo(() => {
    return {
      totalOrders:
        filteredOrders.length,

      revenue:
        filteredOrders.reduce(
          (sum, order) =>
            sum +
            (order.analytics
              ?.totalAmount || 0),
          0
        ),

      pending:
        filteredOrders.filter(
          (o) => o.status === "pending"
        ).length,

      delivered:
        filteredOrders.filter(
          (o) =>
            o.status === "delivered"
        ).length,
    };
  }, [filteredOrders]);

  // =========================
  // LOADING
  // =========================

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold">
        Checking Admin Access...
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              Orders Management
            </h1>

            <p className="text-gray-500 mt-2 text-lg">
              Manage all platform orders
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={fetchData}
              className="bg-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-sm"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>

            <button
              onClick={exportInvoices}
              className="bg-black text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>

            <h2 className="text-3xl font-black mt-2">
              {analytics.totalOrders}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Revenue</p>

            <h2 className="text-3xl font-black mt-2">₹{analytics.revenue}</h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>

            <h2 className="text-3xl font-black mt-2">{analytics.pending}</h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Delivered</p>

            <h2 className="text-3xl font-black mt-2">{analytics.delivered}</h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm mb-8">
          <div className="grid xl:grid-cols-4 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 outline-none"
              />
            </div>

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl border border-gray-200 outline-none"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* SELLERS */}
            <select
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl border border-gray-200 outline-none"
            >
              <option value="all">All Sellers</option>

              {sellers.map((seller) => (
                <option key={seller.firebaseUid} value={seller.firebaseUid}>
                  {seller.shopName}
                </option>
              ))}
            </select>

            {/* DATE */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl border border-gray-200 outline-none"
            >
              <option value="all">All Dates</option>

              <option value="today">Today</option>

              <option value="7days">Last 7 Days</option>

              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* ORDERS */}
        <div className="space-y-6">
          {filteredOrders.map((order: any) => {
            const seller = sellers.find(
              (s) => s.firebaseUid === order.sellerIds?.[0],
            );

            return (
              <div
                key={order.id}
                className="bg-white rounded-[32px] shadow-sm overflow-hidden"
              >
                {/* TOP */}
               <div className="p-6 border-b flex flex-col lg:flex-row justify-between gap-5">
  {/* LEFT */}
  <div>
    <div className="flex flex-wrap gap-3 items-center">
      <h2 className="text-2xl font-black">
        {order.orderId}
      </h2>

      <span
        className={`px-4 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(
          order.status
        )}`}
      >
        {order.status}
      </span>
    </div>

    <p className="text-sm text-gray-500 mt-3">
     {formatDate(order.createdAt)}
    </p>
  </div>

  {/* RIGHT */}
  <div className="text-left lg:text-right">
    <p className="text-sm text-gray-400">
      Total Amount
    </p>

    <h2 className="text-4xl font-black mt-2">
      ₹
      {
        order.analytics
          ?.totalAmount
      }
    </h2>

    <p className="text-sm text-gray-500 mt-3">
      {order.items?.length || 0} items
    </p>
  </div>
</div>

                {/* TOGGLE */}
                <div className="p-5 border-b bg-gray-50">
                  <button
                   onClick={() =>
  toggleOrder(
    order.id,
    order.items || []
  )
}
                    className="w-full bg-white hover:bg-gray-100 transition-all rounded-2xl px-5 py-4 font-semibold text-left"
                  >
                     {expandedOrders[order.id]
  ? "Hide Order Details"
  : `View Order Details (${order.items?.length})`}
                  </button>
                </div>

                {/* PRODUCTS */}
                {expandedOrders[order.id] && (
                  <div className="p-6 grid gap-4">
                    {/* CUSTOMER DETAILS */}
<div className="p-6 border-b bg-gray-50">
  <h3 className="text-lg font-black mb-5">
    Customer Details
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    
    {/* NAME */}
    <div className="bg-white rounded-2xl p-4 border">
      <p className="text-xs text-gray-500 uppercase font-semibold">
        Customer Name
      </p>

      <h2 className="text-lg font-black mt-2 break-words">
        {order.customer?.name ||
          "N/A"}
      </h2>
    </div>

    {/* PHONE */}
    <div className="bg-white rounded-2xl p-4 border">
      <p className="text-xs text-gray-500 uppercase font-semibold">
        Phone
      </p>

      <h2 className="text-lg font-black mt-2 break-words">
        {order.customer?.phone ||
          "N/A"}
      </h2>
    </div>

    {/* EMAIL */}
    <div className="bg-white rounded-2xl p-4 border">
      <p className="text-xs text-gray-500 uppercase font-semibold">
        Email
      </p>

      <h2 className="text-sm font-bold mt-2 break-all">
        {order.customer?.email ||
          "N/A"}
      </h2>
    </div>

    {/* PAYMENT */}
    <div className="bg-white rounded-2xl p-4 border">
      <p className="text-xs text-gray-500 uppercase font-semibold">
        Payment
      </p>

      <h2 className="text-lg font-black mt-2 uppercase">
        {order.paymentMethod ||
          "COD"}
      </h2>
    </div>
  </div>

  {/* ADDRESS */}
  <div className="mt-4 bg-white rounded-2xl p-5 border">
    <p className="text-xs text-gray-500 uppercase font-semibold">
      Delivery Address
    </p>

    <p className="mt-3 text-sm leading-relaxed text-gray-700 break-words">
      {order.customer?.address ||
        "No address"}
    </p>
  </div>

  {/* DELIVERY SLOT */}
  <div className="mt-4 bg-white rounded-2xl p-5 border">
    <p className="text-xs text-gray-500 uppercase font-semibold">
      Delivery Slot
    </p>

    <p className="mt-3 text-lg font-black text-gray-900">
      {order.delivery?.slot ||
        "N/A"}
    </p>
  </div>
</div>
                    {order.items?.map((item: any, index: number) => {
                      const product = productsMap[item.productId];

                      return (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-3xl p-4 flex flex-col md:flex-row gap-5"
                        >
                          {/* IMAGE */}
                          <div className="relative w-full md:w-36 h-36 rounded-2xl overflow-hidden bg-white">
                            {product?.images?.[0] && (
                              <Image
                                loading="lazy"
                                quality={60}
                                sizes="(max-width:768px) 100vw, 200px"
                                src={`${product.images[0]}?tr=w-400,q-60,f-webp`}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>

                          {/* DETAILS */}
                          <div className="flex-1">
                            <h2 className="text-2xl font-black">
                              {product?.name}
                            </h2>

                            <p className="text-gray-500 mt-2">
                              {product?.description}
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                              <div className="bg-white rounded-2xl p-4">
                                <p className="text-xs text-gray-400">
                                  Category
                                </p>

                                <h3 className="font-semibold mt-2">
                                  {product?.category}
                                </h3>
                              </div>

                              <div className="bg-white rounded-2xl p-4">
                                <p className="text-xs text-gray-400">Unit</p>

                                <h3 className="font-semibold mt-2">
                                  {product?.unit}
                                </h3>
                              </div>

                              <div className="bg-white rounded-2xl p-4">
                                <p className="text-xs text-gray-400">
                                  Quantity
                                </p>

                                <h3 className="font-semibold mt-2">
                                  {item.quantity}
                                </h3>
                              </div>

                              <div className="bg-white rounded-2xl p-4">
                                <p className="text-xs text-gray-400">Price</p>

                                <h3 className="font-semibold mt-2">
                                  ₹{item.price}
                                </h3>
                              </div>

                              <div className="bg-white rounded-2xl p-4">
                                <p className="text-xs text-gray-400">Stock</p>

                                <h3 className="font-semibold mt-2">
                                  {product?.stock}
                                </h3>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, "accepted")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, "rejected")}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === "accepted" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "delivered")}
                      className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY */}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-[32px] p-14 text-center shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              No Orders Found
            </h2>

            <p className="text-gray-500 mt-2">Try changing filters</p>
          </div>
        )}
      </div>
      {/* LOAD MORE */}
{hasMoreOrders &&
  filteredOrders.length > 0 && (
    <div className="flex justify-center mt-10">
      <button
        onClick={
          loadMoreOrders
        }
        disabled={
          loadingMoreOrders
        }
        className="bg-black hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-60"
      >
        {loadingMoreOrders
          ? "Loading..."
          : "Load More Orders"}
      </button>
    </div>
)}
    </div>
  );
}
