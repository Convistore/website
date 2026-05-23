"use client";

import Navbar from "../../components/Navbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { db, auth } from "../../../lib/firebase";

import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import Footer from "@/app/components/Footer";




const FETCH_LIMIT = 7;

const CACHE_TIME = 1000 * 60 * 5; // 5 mins cache

const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Groceries",
  "Dairy",
  "Meat",
  "Bakery",
  "Electronics",
  "Fashion",
  "Others",
];

export default function SellerPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [hasMore, setHasMore] =
    useState(true);

  const [lastDoc, setLastDoc] =
    useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const observer = useRef();


  const sortedSellers = useMemo(() => {
  return [...sellers].sort((a, b) => {
    // Always pin Mongso on top
    if (a.sellerName === "Mongso") return -1;
    if (b.sellerName === "Mongso") return 1;

    return 0;
  });
}, [sellers]);
  // =========================
  // FETCH SELLERS
  // =========================

  const fetchSellers = async (
    loadMore = false
  ) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

    let q;

if (loadMore && lastDoc) {
  q = query(
    collection(db, "sellers"),
    startAfter(lastDoc),
    limit(FETCH_LIMIT)
  );
} else {
  q = query(
    collection(db, "sellers"),
    limit(FETCH_LIMIT)
  );
}

      const snapshot = await getDocs(q);

      const sellerList = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      );

      const lastVisible =
        snapshot.docs[
          snapshot.docs.length - 1
        ];

      setLastDoc(lastVisible);

      if (
        snapshot.docs.length <
        FETCH_LIMIT
      ) {
        setHasMore(false);
      }

      if (loadMore) {
        setSellers((prev) => {
          const merged = [
            ...prev,
            ...sellerList,
          ];

          const unique = Array.from(
            new Map(
              merged.map((s) => [
                s.firebaseUid,
                s,
              ])
            ).values()
          );

          localStorage.setItem(
            "sellers_cache",
            JSON.stringify(unique)
          );

          localStorage.setItem(
            "sellers_cache_time",
            Date.now().toString()
          );

          return unique;
        });
      } else {
        const unique = Array.from(
          new Map(
            sellerList.map((s) => [
              s.firebaseUid,
              s,
            ])
          ).values()
        );

        setSellers(unique);

        localStorage.setItem(
          "sellers_cache",
          JSON.stringify(unique)
        );

        localStorage.setItem(
          "sellers_cache_time",
          Date.now().toString()
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // =========================
  // CUSTOMER AUTH CHECK
  // =========================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            // NOT LOGGED IN
            if (!user) {
              localStorage.removeItem(
                "customer_data"
              );

              router.replace(
                "/customer/signin"
              );

              return;
            }

            // CHECK CACHE FIRST
            const cachedCustomer =
              localStorage.getItem(
                "customer_data"
              );

            if (cachedCustomer) {
              const parsed =
                JSON.parse(
                  cachedCustomer
                );

              // VALID CACHE
              if (
                parsed?.uid === user.uid &&
                parsed?.role ===
                  "customer" &&
                !parsed?.isBlocked
              ) {
                setCheckingAuth(false);
                return;
              }
            }

            // FIRESTORE FETCH
            const customerRef = doc(
              db,
              "customers",
              user.uid
            );

            const customerSnap =
              await getDoc(
                customerRef
              );

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
                "customer" ||
              customerData.isBlocked
            ) {
              router.replace(
                "/customer/signin"
              );

              return;
            }

            // SAVE CACHE
            localStorage.setItem(
              "customer_data",
              JSON.stringify({
                uid: user.uid,
                role:
                  customerData.role,
                isBlocked:
                  customerData.isBlocked,
              })
            );
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
  // CACHE SELLERS
  // =========================

  useEffect(() => {
    const cached =
      localStorage.getItem(
        "sellers_cache"
      );

    const cacheTime =
      localStorage.getItem(
        "sellers_cache_time"
      );

    // USE CACHE
    if (cached && cacheTime) {
      const isExpired =
        Date.now() -
          Number(cacheTime) >
        CACHE_TIME;

      if (!isExpired) {
        setSellers(
          JSON.parse(cached)
        );

        setLoading(false);

        return;
      }
    }

    // FETCH ONLY IF NO CACHE
    fetchSellers();
  }, []);

  // =========================
  // FILTERS
  // =========================

  const filteredSellers =
    useMemo(() => {
    return sortedSellers.filter(
        (seller) => {
          const matchesSearch =
            seller.shopName
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              ) ||
            seller.sellerName
              ?.toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesStatus =
            statusFilter === "All"
              ? true
              : seller.status ===
                statusFilter;

          const matchesCategory =
            categoryFilter ===
            "All"
              ? true
              : seller.categories?.includes(
                  categoryFilter
                );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory
          );
        }
      );
    }, [
      sellers,
      search,
      statusFilter,
      categoryFilter,
    ]);

  // =========================
  // INFINITE SCROLL
  // =========================

  const lastSellerRef = (
    node
  ) => {
    if (loadingMore) return;

    if (observer.current)
      observer.current.disconnect();

    observer.current =
      new IntersectionObserver(
        (entries) => {
          if (
            entries[0]
              .isIntersecting &&
            hasMore
          ) {
            fetchSellers(true);
          }
        },
        { threshold: 1 }
      );

    if (node)
      observer.current.observe(
        node
      );
  };

  const handleSellerClick = (seller) => {
    if (seller.sellerName === "Mongso") {
      router.push(`/sellerpage/mongso/${seller.firebaseUid}`);
    } else {
      router.push(`/sellerpage/${seller.firebaseUid}`);
    }
  };

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-sm border border-gray-100">
      <div className="relative h-48 sm:h-56 md:h-60 bg-gray-200" />
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-7 w-24 rounded-full bg-gray-200" />
          <div className="h-7 w-28 rounded-full bg-gray-200" />
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-10 w-28 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );

  if (loading && sellers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }
// =========================
  // LOADING SCREEN
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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
     <div
  onClick={() => router.push("/customer/leaderboard")}
  className="mt-4 flex cursor-pointer justify-center items-center gap-2  border border-yellow-300/40 bg-gradient-to-r from-yellow-100 via-white to-yellow-50 px-5 py-3 text-sm sm:text-base font-extrabold text-yellow-800 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
>
  🏆 Check Leaderboard
  <svg
    viewBox="0 0 16 16"
    fill="none"
    width="16"
    height="16"
  >
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
</div>
          
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-green-50/30 to-gray-50 pt-14 pb-20 sm:pt-16 sm:pb-24 px-4">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          
          <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold mb-5 sm:mb-6">
            🛒 Local marketplace
          </span>
       
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Nearby Sellers
          </h1>
          
          <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Fresh finds, fast delivery straight from your neighbourhood.
          </p>
          
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 -mt-10 sm:-mt-14 relative z-20">

        {/* CONTROLS - Sticky on desktop */}
        <div className="sticky top-0 sm:top-4 z-40 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl sm:rounded-3xl shadow-lg">
            
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search shops or sellers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 sm:h-14 pl-12 pr-4 bg-gray-100 rounded-xl sm:rounded-2xl text-sm sm:text-base font-medium focus:outline-none focus:ring-4 focus:ring-green-100 focus:bg-white transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex flex-wrap gap-2">
                {["All", "Open", "Closed"].map((status) => (
                  <button
                    key={status}
                    className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 ${
                      statusFilter === status
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md shadow-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5"
                    }`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 sm:h-14 px-4 bg-gray-100 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold focus:outline-none focus:ring-4 focus:ring-green-100 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COUNT */}
        <p className="mb-4 sm:mb-6 text-sm sm:text-base font-semibold text-gray-500">
          {filteredSellers.length} {filteredSellers.length === 1 ? "seller" : "sellers"} found
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredSellers.map((seller, index) => {
            const isLast = index === filteredSellers.length - 1;

            return (
              <div
                ref={isLast ? lastSellerRef : null}
                key={seller.firebaseUid}
                onClick={() => handleSellerClick(seller)}
                className="group cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                {/* IMAGE SECTION */}
                <div className="relative h-48 sm:h-56 md:h-60 overflow-hidden">
                  <Image
                    loading="lazy"
                    src={
                      seller.shopImage?.url
                        ? `${seller.shopImage.url}?tr=w-900,h-700,q-70,f-webp`
                        : "/fallback.png"
                    }
                    alt={seller.shopName || "Shop"}
                    fill
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* DARK OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* STATUS BADGE */}
                  <div
                    className={`absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold backdrop-blur-xl border ${
                      seller.status === "Open"
                        ? "bg-green-500/20 text-white border-white/20"
                        : "bg-black/40 text-white border-white/10"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        seller.status === "Open"
                          ? "bg-green-400 animate-pulse"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="hidden sm:inline">{seller.status}</span>
                    <span className="sm:hidden">{seller.status === "Open" ? "🟢" : "🔴"}</span>
                  </div>

                  {/* CATEGORY */}
                  {seller.categories?.[0] && (
                    <div className="absolute left-3 sm:left-4 bottom-16 sm:bottom-20 z-10 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white">
                      {seller.categories[0]}
                    </div>
                  )}

        
                 
                  {/* SHOP INFO OVERLAY */}
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-10">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
                      {seller.shopName}
                    </h2>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-4 sm:p-5">
                  {/* SELLER INFO */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-md">
                      <Image
                        loading="lazy"
                        src={
                          seller.sellerImage?.url
                            ? `${seller.sellerImage.url}?tr=w-120,h-120,q-60,f-webp`
                            : "/avatar.png"
                        }
                        alt={seller.sellerName || "Seller"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm sm:text-base font-bold text-gray-900">
                        {seller.sellerName}
                      </p>
                      <p className="mt-0.5 sm:mt-1 line-clamp-1 text-xs sm:text-sm text-gray-500">
                        📍 {seller.location?.fullAddress || "Location unavailable"}
                      </p>
                    </div>
                  </div>

                  {/* FEATURES */}
                  <div className="mt-4 sm:mt-5 flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="rounded-full bg-green-50 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-green-700">
                      Fast Delivery
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-gray-700">
                      COD
                    </span>
                  </div>

                  {/* FOOTER */}
                  <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-gray-100 pt-4 sm:pt-5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-xs sm:text-sm font-bold text-green-600">
                        <span className="hidden sm:inline">Active Store</span>
                        <span className="sm:hidden">Active</span>
                      </p>
                    </div>

                    <button className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-500 to-green-700 px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg transition-all hover:scale-105 hover:shadow-green-200 active:scale-95">
                      Visit
                      <svg viewBox="0 0 16 16" fill="none" width="14" height="14" className="sm:w-4 sm:h-4">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* EMPTY STATE */}
          {filteredSellers.length === 0 && (
            <div className="col-span-full rounded-2xl sm:rounded-3xl bg-white p-8 sm:p-12 md:p-16 text-center shadow-sm border border-gray-100">
              <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gray-100 text-3xl sm:text-4xl">
                🔍
              </div>
              <h3 className="mt-5 sm:mt-6 text-xl sm:text-2xl font-extrabold text-gray-900">
                No sellers found
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-500">
                Try changing your search or filters
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setCategoryFilter("All");
                }}
                className="mt-5 sm:mt-6 rounded-xl sm:rounded-2xl bg-green-600 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-extrabold text-white transition hover:bg-green-700 active:scale-95"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* LOADING MORE */}
        {loadingMore && (
          <div className="flex justify-center py-8 sm:py-12">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
          </div>
        )}

        {/* POPULAR STORES STRIP */}
        {sellers.length > 0 && (
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">Popular stores</h2>
              <div className="h-px flex-1 ml-4 bg-gradient-to-r from-green-200 to-transparent" />
            </div>
            
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {sellers.slice(0, 10).map((seller) => (
                <div
                  key={seller.firebaseUid}
                  className="flex-shrink-0 w-56 sm:w-64 flex items-center gap-3 sm:gap-4 bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 active:scale-95"
                  onClick={() => handleSellerClick(seller)}
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow">
                    <Image
                      loading="lazy"
                      src={seller.shopImage?.url ? `${seller.shopImage.url}?tr=w-100,h-100,q-50,f-webp` : "/fallback.png"}
                      alt={seller.shopName || "Shop"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm sm:text-base font-bold text-gray-900">{seller.shopName}</p>
                    <p className={`text-xs sm:text-sm font-bold mt-0.5 ${seller.status === "Open" ? "text-green-600" : "text-red-500"}`}>
                      {seller.status === "Open" ? "🟢 Open now" : "🔴 Closed"}
                    </p>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer/>

      {/* Hide scrollbar utility */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}