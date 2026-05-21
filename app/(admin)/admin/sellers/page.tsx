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
  BadgeCheck,
  Ban,
  CheckCircle2,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

// =========================
// PAGE
// =========================

export default function AdminSellersPage() {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [sellers, setSellers] =
    useState<any[]>([]);

  const [orders, setOrders] =
    useState<any[]>([]);

  const [products, setProducts] =
    useState<any[]>([]);

  const [filteredSellers, setFilteredSellers] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  // =========================
  // BAN MODAL
  // =========================

  const [banModal, setBanModal] =
    useState<any>({
      open: false,
      sellerId: "",
    });

  const [banReason, setBanReason] =
    useState("");
const [lastSellerDoc, setLastSellerDoc] =
  useState<any>(null);

const [hasMoreSellers, setHasMoreSellers] =
  useState(true);

const [loadingMore, setLoadingMore] =
  useState(false);
  // =========================
  // ADMIN AUTH CHECK
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

            // CHECK ADMINS COLLECTION
            const adminDoc =
              await getDoc(
                doc(
                  db,
                  "admins",
                  user.uid
                )
              );

            // NOT ADMIN
            if (
              !adminDoc.exists()
            ) {
              router.push("/");

              return;
            }

            const adminData =
              adminDoc.data();

            // ROLE CHECK
            if (
              adminData.role !==
              "admin"
            ) {
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

    const cacheTime =
      localStorage.getItem(
        "admin_sellers_cache_time"
      );

    const now = Date.now();

    if (
      !cacheTime ||
      now -
        Number(cacheTime) >
        86400000
    ) {
      localStorage.removeItem(
        "admin_sellers_cache"
      );

      localStorage.setItem(
        "admin_sellers_cache_time",
        now.toString()
      );
    }
  }, [authorized]);

  // =========================
  // FETCH DATA
  // =========================

  const fetchData =
    useCallback(async () => {
      try {
        setLoading(true);
const cache =
  localStorage.getItem(
    "admin_sellers_full_cache"
  );

const cacheTime =
  localStorage.getItem(
    "admin_sellers_full_cache_time"
  );

if (cache && cacheTime) {
  const isExpired =
    Date.now() -
      Number(cacheTime) >
    1000 * 60 * 5;

  if (!isExpired) {
    const parsed =
      JSON.parse(cache);

    setSellers(
      parsed.sellers || []
    );

    setFilteredSellers(
      parsed.sellers || []
    );

    setOrders(
      parsed.orders || []
    );

    setProducts(
      parsed.products || []
    );

    setLoading(false);

    return;
  }
}
        // CACHE
        const cachedSellers =
          JSON.parse(
            localStorage.getItem(
              "admin_sellers_cache"
            ) || "[]"
          );

        if (
          cachedSellers.length > 0
        ) {
          setSellers(
            cachedSellers
          );

          setFilteredSellers(
            cachedSellers
          );
        }

        // SELLERS
 const sellersQuery = query(
  collection(db, "sellers"),
  orderBy("createdAt", "desc"),
  limit(20)
);

const sellersSnapshot =
  await getDocs(sellersQuery);

const sellersData =
  sellersSnapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data(),
    })
  );

// SAVE LAST DOC
const lastVisible =
  sellersSnapshot.docs[
    sellersSnapshot.docs.length - 1
  ];

setLastSellerDoc(lastVisible);

// HAS MORE
setHasMoreSellers(
  sellersSnapshot.docs.length === 20
);
        // ORDERS
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
      limit(200)
    )
  );

        const ordersData =
          ordersSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        // PRODUCTS
      const productsSnapshot =
  await getDocs(
    query(
      collection(
        db,
        "products"
      ),
      limit(300)
    )
  );

        const productsData =
          productsSnapshot.docs.map(
            (doc) => ({
              id: doc.id,
              ...doc.data(),
            })
          );

        // SAVE
        localStorage.setItem(
          "admin_sellers_cache",
          JSON.stringify(
            sellersData
          )
        );

        setSellers(
          sellersData
        );

        setFilteredSellers(
          sellersData
        );

        setOrders(
          ordersData
        );

        setProducts(
          productsData
        );
localStorage.setItem(
  "admin_sellers_full_cache",
  JSON.stringify({
    sellers: sellersData,
    orders: ordersData,
    products: productsData,
  })
);

localStorage.setItem(
  "admin_sellers_full_cache_time",
  Date.now().toString()
);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, []);

    // =========================
// LOAD MORE SELLERS
// =========================

const loadMoreSellers =
  async () => {
    try {
      if (
        !lastSellerDoc ||
        loadingMore
      )
        return;

      setLoadingMore(true);

      const nextQuery = query(
        collection(db, "sellers"),
        orderBy(
          "createdAt",
          "desc"
        ),
        startAfter(lastSellerDoc),
        limit(20)
      );

      const snapshot =
        await getDocs(nextQuery);

      const newSellers =
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

      setLastSellerDoc(
        lastVisible
      );

      // CHECK MORE
      setHasMoreSellers(
        snapshot.docs.length === 20
      );

      // APPEND
      setSellers((prev) => [
        ...prev,
        ...newSellers,
      ]);

      setFilteredSellers(
        (prev) => [
          ...prev,
          ...newSellers,
        ]
      );

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  };

  // =========================
  // FILTERS
  // =========================

  useEffect(() => {
    let updated = [
      ...sellers,
    ];

    // SEARCH
    if (search) {
      updated = updated.filter(
        (seller) => {
          return (
            seller.sellerName
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||

            seller.shopName
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||

            seller.email
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              )
          );
        }
      );
    }

    // STATUS
    if (
      statusFilter !== "all"
    ) {
      updated = updated.filter(
        (seller) => {
          if (
            statusFilter ===
            "verified"
          ) {
            return seller.isVerified;
          }

          if (
            statusFilter ===
            "banned"
          ) {
            return seller.isBanned;
          }

          if (
            statusFilter ===
            "approved"
          ) {
            return seller.isApproved;
          }

          return true;
        }
      );
    }

    setFilteredSellers(
      updated
    );

  }, [
    sellers,
    search,
    statusFilter,
  ]);

  // =========================
  // SELLER ANALYTICS
  // =========================

  const getSellerAnalytics = (
    sellerUid: string
  ) => {
    const sellerOrders =
      orders.filter(
        (order: any) =>
          order.sellerIds?.includes(
            sellerUid
          )
      );

    const revenue =
      sellerOrders.reduce(
        (
          sum: number,
          order: any
        ) =>
          sum +
          (order.analytics
            ?.totalAmount ||
            0),
        0
      );

    const sellerProducts =
      products.filter(
        (product: any) =>
          product.sellerId ===
          sellerUid
      );

    let totalSold = 0;

    sellerOrders.forEach(
      (order: any) => {
        order.items?.forEach(
          (item: any) => {
            if (
              item.sellerId ===
              sellerUid
            ) {
              totalSold +=
                item.quantity;
            }
          }
        );
      }
    );

    return {
      revenue,
      totalOrders:
        sellerOrders.length,
      totalProducts:
        sellerProducts.length,
      totalSold,
    };
  };

  // =========================
  // UPDATE SELLER
  // =========================

  const updateSeller =
    async (
      sellerId: string,
      data: any
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "sellers",
            sellerId
          ),
          {
            ...data,
            updatedAt:
              serverTimestamp(),
          }
        );

        setSellers((prev) =>
          prev.map((seller) => {
            if (
              seller.id ===
              sellerId
            ) {
              return {
                ...seller,
                ...data,
              };
            }

            return seller;
          })
        );

      } catch (err) {
        console.error(err);
      }
    };

  // =========================
  // HANDLE BAN
  // =========================

  const handleBanSeller =
    async () => {
      try {
        if (
          !banReason.trim()
        ) {
          alert(
            "Please enter ban reason"
          );

          return;
        }

        await updateSeller(
          banModal.sellerId,
          {
            isBanned: true,

            banReason,

            bannedAt:
              serverTimestamp(),
          }
        );

        setBanModal({
          open: false,
          sellerId: "",
        });

        setBanReason("");

      } catch (err) {
        console.error(err);
      }
    };

  // =========================
  // ANALYTICS
  // =========================

  const analytics =
    useMemo(() => {
      return {
        totalSellers:
          sellers.length,

        verified:
          sellers.filter(
            (s) =>
              s.isVerified
          ).length,

        approved:
          sellers.filter(
            (s) =>
              s.isApproved
          ).length,

        banned:
          sellers.filter(
            (s) =>
              s.isBanned
          ).length,
      };
    }, [sellers]);

  // =========================
  // LOADING
  // =========================

  if (
    loading ||
    !authorized
  ) {
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
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900">
            Sellers Management
          </h1>

          <p className="text-gray-500 mt-2 text-lg">
            Manage platform
            sellers
          </p>
        </div>

        {/* ANALYTICS */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <Users className="mb-3" />

            <p className="text-sm text-gray-500">
              Total Sellers
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                analytics.totalSellers
              }
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <BadgeCheck className="mb-3" />

            <p className="text-sm text-gray-500">
              Verified
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                analytics.verified
              }
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <CheckCircle2 className="mb-3" />

            <p className="text-sm text-gray-500">
              Approved
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                analytics.approved
              }
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <Ban className="mb-3" />

            <p className="text-sm text-gray-500">
              Banned
            </p>

            <h2 className="text-3xl font-black mt-2">
              {
                analytics.banned
              }
            </h2>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-[32px] p-5 shadow-sm mb-8">
          <div className="grid xl:grid-cols-2 gap-4">
            {/* SEARCH */}
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />

              <input
                type="text"
                placeholder="Search sellers..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 outline-none"
              />
            </div>

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="px-4 py-4 rounded-2xl border border-gray-200 outline-none"
            >
              <option value="all">
                All Sellers
              </option>

              <option value="verified">
                Verified
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="banned">
                Banned
              </option>
            </select>
          </div>
        </div>

        {/* SELLERS */}
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredSellers.map(
            (seller: any) => {
              const sellerAnalytics =
                getSellerAnalytics(
                  seller.firebaseUid
                );

              return (
                <div
                  key={seller.id}
                  className="bg-white rounded-[32px] shadow-sm overflow-hidden"
                >
                  {/* TOP */}
                  <div className="p-6 border-b">
                    <div className="flex flex-col md:flex-row gap-5 justify-between">
                      <div className="flex gap-5">
                        {/* IMAGE */}
                        <div className="relative w-24 h-24 rounded-3xl overflow-hidden bg-gray-100 shrink-0">
                          {seller.sellerImage && (
                            <Image
  loading="lazy"
  quality={60}
  sizes="150px"
  src={
  seller?.sellerImage?.url &&
  seller.sellerImage.url.startsWith("http")
    ? `${seller.sellerImage.url}?tr=w-200,h-200,q-60,f-webp`
    : "/avatar.png"
}
  alt="Seller"
  fill
  className="object-cover"
/>
                          )}
                        </div>

                        {/* INFO */}
                        <div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <h2 className="text-2xl font-black">
                              {
                                seller.sellerName
                              }
                            </h2>

                            {seller.isVerified && (
                              <ShieldCheck className="text-green-600" />
                            )}
                          </div>

                          <p className="text-gray-500 mt-1">
                            {
                              seller.shopName
                            }
                          </p>

                          <p className="text-sm text-gray-400 mt-3">
                            {
                              seller.email
                            }
                          </p>

                          <p className="text-sm text-gray-400 mt-1">
                            {
                              seller.phone
                            }
                          </p>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div className="flex flex-col gap-2 items-start md:items-end">
                        {seller.isApproved ? (
                          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                            Approved
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-bold">
                            Pending
                          </span>
                        )}

                        {seller.isBanned && (
                          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ANALYTICS */}
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <TrendingUp className="mb-2" />

                      <p className="text-xs text-gray-400">
                        Revenue
                      </p>

                      <h3 className="font-black text-xl mt-2">
                        ₹
                        {
                          sellerAnalytics.revenue
                        }
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <Store className="mb-2" />

                      <p className="text-xs text-gray-400">
                        Products
                      </p>

                      <h3 className="font-black text-xl mt-2">
                        {
                          sellerAnalytics.totalProducts
                        }
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <Users className="mb-2" />

                      <p className="text-xs text-gray-400">
                        Orders
                      </p>

                      <h3 className="font-black text-xl mt-2">
                        {
                          sellerAnalytics.totalOrders
                        }
                      </h3>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4">
                      <TrendingUp className="mb-2" />

                      <p className="text-xs text-gray-400">
                        Sold
                      </p>

                      <h3 className="font-black text-xl mt-2">
                        {
                          sellerAnalytics.totalSold
                        }
                      </h3>
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-3xl p-5">
                      <h3 className="font-bold text-lg">
                        Shop Location
                      </h3>

                      <p className="text-gray-600 mt-3 leading-relaxed">
                        {
                          seller.location
                            ?.address
                        }
                      </p>

                      <p className="text-sm text-gray-500 mt-2">
                        Landmark:{" "}
                        {
                          seller.location
                            ?.landmark
                        }
                      </p>

                      <p className="text-sm text-gray-500 mt-1">
                        Pincode:{" "}
                        {
                          seller.location
                            ?.pincode
                        }
                      </p>
                    </div>
                  </div>

                  {/* BAN REASON */}
                  {seller.isBanned &&
                    seller.banReason && (
                      <div className="px-6 pb-6">
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-5">
                          <h3 className="font-bold text-red-600 text-lg">
                            Ban Reason
                          </h3>

                          <p className="text-red-500 mt-3 leading-relaxed">
                            {
                              seller.banReason
                            }
                          </p>
                        </div>
                      </div>
                    )}

                  {/* ACTIONS */}
                  <div className="p-6 border-t bg-gray-50 flex flex-wrap gap-3">
                    {!seller.isApproved && (
                      <button
                        onClick={() =>
                          updateSeller(
                            seller.id,
                            {
                              isApproved:
                                true,
                            }
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
                      >
                        Approve Seller
                      </button>
                    )}

                    {!seller.isVerified && (
                      <button
                        onClick={() =>
                          updateSeller(
                            seller.id,
                            {
                              isVerified:
                                true,
                            }
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold"
                      >
                        Verify Seller
                      </button>
                    )}

                    {!seller.isBanned ? (
                      <button
                        onClick={() =>
                          setBanModal(
                            {
                              open: true,
                              sellerId:
                                seller.id,
                            }
                          )
                        }
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2"
                      >
                        <Ban size={18} />
                        Ban Seller
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          updateSeller(
                            seller.id,
                            {
                              isBanned:
                                false,

                              banReason:
                                "",

                              bannedAt:
                                null,
                            }
                          )
                        }
                        className="bg-black hover:opacity-90 text-white px-5 py-3 rounded-2xl font-semibold flex items-center gap-2"
                      >
                        <XCircle size={18} />
                        Unban Seller
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* EMPTY */}
        {filteredSellers.length ===
          0 && (
          <div className="bg-white rounded-[32px] p-14 text-center shadow-sm mt-8">
            <h2 className="text-2xl font-bold text-gray-900">
              No Sellers Found
            </h2>

            <p className="text-gray-500 mt-2">
              Try changing
              filters
            </p>
          </div>
        )}
{/* LOAD MORE */}
{hasMoreSellers &&
  filteredSellers.length > 0 && (
    <div className="flex justify-center mt-10">
      <button
        onClick={
          loadMoreSellers
        }
        disabled={loadingMore}
        className="bg-black hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-60"
      >
        {loadingMore
          ? "Loading..."
          : "Load More Sellers"}
      </button>
    </div>
)}
        {/* BAN MODAL */}
        {banModal.open && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-6 w-full max-w-lg">
              <h2 className="text-3xl font-black">
                Ban Seller
              </h2>

              <p className="text-gray-500 mt-2">
                Enter reason for
                banning this seller
              </p>

              {/* TEXTAREA */}
              <textarea
                value={banReason}
                onChange={(e) =>
                  setBanReason(
                    e.target.value
                  )
                }
                placeholder="Enter detailed reason..."
                className="w-full mt-6 border border-gray-200 rounded-2xl p-4 outline-none min-h-[150px]"
              />

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setBanModal(
                      {
                        open: false,
                        sellerId:
                          "",
                      }
                    );

                    setBanReason(
                      ""
                    );
                  }}
                  className="bg-gray-100 hover:bg-gray-200 px-5 py-3 rounded-2xl font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleBanSeller
                  }
                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-semibold"
                >
                  Ban Seller
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}