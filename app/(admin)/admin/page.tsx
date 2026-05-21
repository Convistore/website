"use client";

import {
  collection,
  getDocs,
  query,
  doc,
  getDoc,
  limit,
  orderBy,
} from "firebase/firestore";

import {
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

import {
  DollarSign,
  ShoppingCart,
  Users,
  Clock3,
  TrendingUp,
  Package,
  Store,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// =========================
// CACHE SETTINGS
// =========================

const CACHE_TIME =
  1000 * 60 * 5; // 5 mins

const ORDERS_LIMIT = 100;
const PRODUCTS_LIMIT = 100;
const SELLERS_LIMIT = 50;

// =========================
// TYPES
// =========================

type OrderType = {
  analytics?: {
    totalAmount?: number;
  };

  status?: string;

  createdAt?: any;

  sellerIds?: string[];

  items?: any[];
};

type ProductType = {
  productId?: string;

  name?: string;

  images?: string[];

  sellerId?: string;

  category?: string;

  unit?: string;

  price?: number;
};

type UserType = {
  role?: string;

  name?: string;
};

type SellerType = {
  firebaseUid?: string;

  sellerName?: string;

  shopName?: string;

  sellerImage?: string;

  sellerId?: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [orders, setOrders] =
    useState<OrderType[]>([]);

  const [users, setUsers] =
    useState<UserType[]>([]);

  const [products, setProducts] =
    useState<ProductType[]>([]);

  const [sellers, setSellers] =
    useState<SellerType[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  // =========================
  // ADMIN AUTH + CACHE
  // =========================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            // NOT LOGGED IN
            if (!user) {
              router.push(
                "/admin-login"
              );

              return;
            }

            // ADMIN CACHE
            const cachedAdmin =
              localStorage.getItem(
                "admin_auth"
              );

            if (cachedAdmin) {
              const parsed =
                JSON.parse(
                  cachedAdmin
                );

              if (
                parsed.uid ===
                  user.uid &&
                parsed.role ===
                  "admin"
              ) {
                setAuthorized(true);
              }
            }

            // VERIFY ADMIN
            const adminDoc =
              await getDoc(
                doc(
                  db,
                  "admins",
                  user.uid
                )
              );

            if (
              !adminDoc.exists()
            ) {
              router.push("/");

              return;
            }

            const adminData =
              adminDoc.data();

            if (
              adminData.role !==
              "admin"
            ) {
              router.push("/");

              return;
            }

            // SAVE ADMIN CACHE
            localStorage.setItem(
              "admin_auth",
              JSON.stringify({
                uid: user.uid,
                role:
                  adminData.role,
              })
            );

            setAuthorized(true);

            // =========================
            // DASHBOARD CACHE
            // =========================

            const cachedDashboard =
              localStorage.getItem(
                "admin_dashboard_cache"
              );

            const cacheTime =
              localStorage.getItem(
                "admin_dashboard_cache_time"
              );

            if (
              cachedDashboard &&
              cacheTime
            ) {
              const isExpired =
                Date.now() -
                  Number(
                    cacheTime
                  ) >
                CACHE_TIME;

              if (!isExpired) {
                const parsed =
                  JSON.parse(
                    cachedDashboard
                  );

                setOrders(
                  parsed.orders || []
                );

                setUsers(
                  parsed.users || []
                );

                setProducts(
                  parsed.products ||
                    []
                );

                setSellers(
                  parsed.sellers ||
                    []
                );

                setLoading(false);

                return;
              }
            }

            // =========================
            // OPTIMIZED FETCHES
            // =========================

            const ordersSnapshot =
              await getDocs(
                query(
                  collection(
                    db,
                    "purchases"
                  ),
                  orderBy(
                    "createdAt",
                    "desc"
                  ),
                  limit(
                    ORDERS_LIMIT
                  )
                )
              );

            const customersSnapshot =
              await getDocs(
                query(
                  collection(
                    db,
                    "customers"
                  ),
                  limit(100)
                )
              );

            const productsSnapshot =
              await getDocs(
                query(
                  collection(
                    db,
                    "products"
                  ),
                  limit(
                    PRODUCTS_LIMIT
                  )
                )
              );

            const sellersSnapshot =
              await getDocs(
                query(
                  collection(
                    db,
                    "sellers"
                  ),
                  limit(
                    SELLERS_LIMIT
                  )
                )
              );

            const ordersData =
              ordersSnapshot.docs.map(
                (doc) =>
                  doc.data() as OrderType
              );

            const usersData =
              customersSnapshot.docs.map(
                (doc) =>
                  doc.data() as UserType
              );

            const productsData =
              productsSnapshot.docs.map(
                (doc) =>
                  doc.data() as ProductType
              );

            const sellersData =
              sellersSnapshot.docs.map(
                (doc) =>
                  doc.data() as SellerType
              );

            setOrders(ordersData);

            setUsers(usersData);

            setProducts(
              productsData
            );

            setSellers(sellersData);

            // SAVE CACHE
            localStorage.setItem(
              "admin_dashboard_cache",
              JSON.stringify({
                orders:
                  ordersData,
                users:
                  usersData,
                products:
                  productsData,
                sellers:
                  sellersData,
              })
            );

            localStorage.setItem(
              "admin_dashboard_cache_time",
              Date.now().toString()
            );
          } catch (err) {
            console.error(err);

            router.push("/");
          } finally {
            setLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, []);

  // =========================
  // ANALYTICS
  // =========================

  const analytics = useMemo(() => {
    const deliveredOrders =
      orders.filter(
        (order) =>
          order.status?.toLowerCase() ===
          "delivered"
      );

    const totalSales =
      deliveredOrders.reduce(
        (sum, order) =>
          sum +
          (order.analytics
            ?.totalAmount || 0),
        0
      );

    const todayOrders =
      orders.filter((order) => {
        if (!order.createdAt)
          return false;

        const orderDate =
          order.createdAt
            .toDate()
            .toDateString();

        return (
          orderDate ===
          new Date().toDateString()
        );
      }).length;

    const pendingOrders =
      orders.filter(
        (o) =>
          o.status?.toLowerCase() ===
          "pending"
      ).length;

    const deliveredCount =
      deliveredOrders.length;

    return {
      totalSales,

      todayOrders,

      pendingOrders,

      deliveredCount,
    };
  }, [orders]);

  // =========================
  // REVENUE CHART
  // =========================

  const revenueChartData =
    useMemo(() => {
      const grouped: any = {};

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status?.toLowerCase() ===
            "delivered"
        );

      deliveredOrders.forEach(
        (order) => {
          if (
            !order.createdAt
          )
            return;

          const date =
            order.createdAt
              .toDate()
              .toLocaleDateString();

          if (!grouped[date]) {
            grouped[date] = 0;
          }

          grouped[date] +=
            order.analytics
              ?.totalAmount ||
            0;
        }
      );

      return Object.keys(
        grouped
      ).map((date) => ({
        date,

        revenue:
          grouped[date],
      }));
    }, [orders]);

  // =========================
  // TOP PRODUCTS
  // =========================

  const topProducts =
    useMemo(() => {
      const productSalesMap: any =
        {};

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status?.toLowerCase() ===
            "delivered"
        );

      deliveredOrders.forEach(
        (order) => {
          order.items?.forEach(
            (item: any) => {
              if (
                !productSalesMap[
                  item.productId
                ]
              ) {
                productSalesMap[
                  item.productId
                ] = 0;
              }

              productSalesMap[
                item.productId
              ] +=
                item.quantity ||
                0;
            }
          );
        }
      );

      return products
        .map((product) => ({
          ...product,

          sold:
            productSalesMap[
              product.productId
            ] || 0,
        }))
        .filter(
          (product: any) =>
            product.sold > 0
        )
        .sort(
          (a: any, b: any) =>
            b.sold - a.sold
        )
        .slice(0, 5);
    }, [products, orders]);

  // =========================
  // TOP SELLERS
  // =========================

  const topSellers =
    useMemo(() => {
      const sellerRevenueMap: any =
        {};

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status?.toLowerCase() ===
            "delivered"
        );

      deliveredOrders.forEach(
        (order) => {
          const sellerUid =
            order.sellerIds?.[0];

          if (!sellerUid)
            return;

          if (
            !sellerRevenueMap[
              sellerUid
            ]
          ) {
            sellerRevenueMap[
              sellerUid
            ] = 0;
          }

          sellerRevenueMap[
            sellerUid
          ] +=
            order.analytics
              ?.totalAmount ||
            0;
        }
      );

      return Object.entries(
        sellerRevenueMap
      )
        .map(
          ([uid, revenue]) => {
            const seller =
              sellers.find(
                (s) =>
                  s.firebaseUid ===
                  uid
              );

            return {
              uid,

              revenue,

              sellerName:
                seller?.sellerName ||
                "Unknown Seller",

              shopName:
                seller?.shopName ||
                "Unknown Shop",

              sellerImage:
                seller?.sellerImage ||
                "",
            };
          }
        )
        .sort(
          (a: any, b: any) =>
            b.revenue -
            a.revenue
        )
        .slice(0, 5);
    }, [orders, sellers]);

  // =========================
  // LOADING
  // =========================

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Checking Admin Access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">Admin Dashboard</h1>

          <p className="text-gray-500 mt-2 text-lg">
            Platform analytics overview
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          {/* SALES */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <DollarSign className="mb-3" />

            <p className="text-sm text-gray-500">Total Sales</p>

            <h2 className="text-3xl font-black mt-2">
              ₹{analytics.totalSales}
            </h2>
          </div>

          {/* USERS */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <Users className="mb-3" />

            <p className="text-sm text-gray-500">Total Users</p>

            <h2 className="text-3xl font-black mt-2">{users.length}</h2>
          </div>

          {/* TODAY ORDERS */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <ShoppingCart className="mb-3" />

            <p className="text-sm text-gray-500">Today Orders</p>

            <h2 className="text-3xl font-black mt-2">
              {analytics.todayOrders}
            </h2>
          </div>

          {/* PENDING */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <Clock3 className="mb-3" />

            <p className="text-sm text-gray-500">Pending Orders</p>

            <h2 className="text-3xl font-black mt-2">
              {analytics.pendingOrders}
            </h2>
          </div>
{/* DELIVERED */}
<div className="bg-white rounded-3xl p-5 shadow-sm">
  <Package className="mb-3" />

  <p className="text-sm text-gray-500">
    Delivered Orders
  </p>

  <h2 className="text-3xl font-black mt-2">
    {analytics.deliveredCount}
  </h2>
</div>
          {/* PRODUCTS */}
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <Package className="mb-3" />

            <p className="text-sm text-gray-500">Products</p>

            <h2 className="text-3xl font-black mt-2">{products.length}</h2>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* REVENUE CHART */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Revenue Chart</h2>

                <p className="text-gray-500 mt-1">Daily revenue</p>
              </div>

              <TrendingUp />
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="date" />

                  <YAxis />

                  <Tooltip />

                  <Line type="monotone" dataKey="revenue" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP SELLERS */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black">Top Sellers</h2>

                <p className="text-gray-500 mt-1">Highest revenue</p>
              </div>

              <Store />
            </div>

            <div className="space-y-4">
              {topSellers.map((seller: any, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-4">
                    {seller.sellerImage && (
                      <img
                        src={`${seller.sellerImage}?tr=w-100,q-60,f-webp`}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )}

                    <div>
                      <p className="text-sm text-gray-400">
                        Seller #{index + 1}
                      </p>

                      <h3 className="font-bold mt-1">{seller.sellerName}</h3>

                      <p className="text-sm text-gray-500">{seller.shopName}</p>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black">₹{seller.revenue}</h2>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">Top Products</h2>

              <p className="text-gray-500 mt-1">Best selling products</p>
            </div>

            <Package />
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
            {topProducts.map((product: any, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-3xl overflow-hidden bg-gray-50"
              >
                {/* IMAGE */}
                <div className="relative h-52 bg-white">
                  {product.images?.[0] && (
                    <img
                      src={`${product.images[0]}?tr=w-500,q-60,f-webp`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* INFO */}
                <div className="p-4">
                  <h3 className="font-bold text-lg line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-gray-500 text-sm mt-2">
                    Sold: {product.sold}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">₹{product.price}</p>

                  <p className="text-gray-400 text-xs mt-1">
                    {product.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
