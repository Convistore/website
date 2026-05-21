"use client";

import Image from "next/image";
import Navbar from "../../../components/Navbar";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  startAfter,
} from "firebase/firestore";
import { auth } from "../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const PRODUCTS_LIMIT = 8;
const PLATFORM_FEE = 0;

/* ─── Safe URL builder for Next.js Image ─── */
const buildImageUrl = (
  url: string | null | undefined,
  transforms: string,
  fallback: string
) => {
  if (!url || typeof url !== "string" || url.trim() === "") return fallback;
  const separator = url.includes("?") ? "&" : "?";
  if (url.startsWith("http") || url.startsWith("/")) {
    return `${url}${separator}${transforms}`;
  }
  if (!url.startsWith("http") && !url.startsWith("/")) {
    return `https://${url}${separator}${transforms}`;
  }
  return fallback;
};

/* ─── tiny helper ─── */
const fmt = (n: number) => Number(n).toLocaleString("en-IN");

export default function SellerShopPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [cart, setCart] = useState<any>({});
  const [showCart, setShowCart] = useState(false);

  // 🚚 Delivery state - Only Same-Day (map) delivery available
  const [selectedDelivery, setSelectedDelivery] = useState("map");

  const observer = useRef<any>(null);

  /// =========================
  // CACHE SETTINGS
  // =========================
  const CACHE_TIME = 1000 * 60 * 5; // 5 mins

  // =========================
  // FETCH SELLER
  // =========================
  const fetchSeller = async () => {
    try {
      const cachedSeller = localStorage.getItem(`seller_${sellerId}`);
      const sellerCacheTime = localStorage.getItem(`seller_cache_time_${sellerId}`);

      if (cachedSeller && sellerCacheTime) {
        const isExpired = Date.now() - Number(sellerCacheTime) > CACHE_TIME;
        if (!isExpired) {
          setSeller(JSON.parse(cachedSeller));
          return;
        }
      }

      const sellerQuery = query(
        collection(db, "sellers"),
        where("firebaseUid", "==", sellerId),
        limit(1)
      );

      const sellerSnap = await getDocs(sellerQuery);

      if (!sellerSnap.empty) {
        const sellerData = {
          id: sellerSnap.docs[0].id,
          ...sellerSnap.docs[0].data(),
        };

        setSeller(sellerData);

        localStorage.setItem(`seller_${sellerId}`, JSON.stringify(sellerData));
        localStorage.setItem(`seller_cache_time_${sellerId}`, Date.now().toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // FETCH PRODUCTS
  // =========================
  const fetchProducts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const cachedProducts = localStorage.getItem(`products_${sellerId}`);
      const productsCacheTime = localStorage.getItem(`products_cache_time_${sellerId}`);

      if (!loadMore && cachedProducts && productsCacheTime) {
        const isExpired = Date.now() - Number(productsCacheTime) > CACHE_TIME;
        if (!isExpired) {
          setProducts(JSON.parse(cachedProducts));
          setLoading(false);
          return;
        }
      }

      let productQuery;
      if (loadMore && lastDoc) {
        productQuery = query(
          collection(db, "products"),
          where("sellerId", "==", sellerId),
          startAfter(lastDoc),
          limit(PRODUCTS_LIMIT)
        );
      } else {
        productQuery = query(
          collection(db, "products"),
          where("sellerId", "==", sellerId),
          limit(PRODUCTS_LIMIT)
        );
      }

      const productSnap = await getDocs(productQuery);
      const productList = productSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastVisible = productSnap.docs[productSnap.docs.length - 1];
      setLastDoc(lastVisible);

      if (productSnap.docs.length < PRODUCTS_LIMIT) {
        setHasMore(false);
      }

      if (loadMore) {
        setProducts((prev) => {
          const merged = [...prev, ...productList];
          const uniqueProducts = Array.from(
            new Map(merged.map((product) => [product.id, product])).values()
          );

          localStorage.setItem(`products_${sellerId}`, JSON.stringify(uniqueProducts));
          localStorage.setItem(`products_cache_time_${sellerId}`, Date.now().toString());
          return uniqueProducts;
        });
      } else {
        setProducts(productList);
        localStorage.setItem(`products_${sellerId}`, JSON.stringify(productList));
        localStorage.setItem(`products_cache_time_${sellerId}`, Date.now().toString());
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          localStorage.removeItem("customer_data");
          router.replace("/customer/signin");
          return;
        }

        const cachedCustomer = localStorage.getItem("customer_data");
        if (cachedCustomer) {
          const parsed = JSON.parse(cachedCustomer);
          if (
            parsed?.uid === user.uid &&
            parsed?.role === "customer" &&
            !parsed?.isBlocked
          ) {
            setCheckingAuth(false);
            return;
          }
        }

        const customerRef = doc(db, "customers", user.uid);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
          router.replace("/customer/signin");
          return;
        }

        const customerData = customerSnap.data();
        if (customerData.role !== "customer" || customerData.isBlocked) {
          router.replace("/customer/signin");
          return;
        }

        localStorage.setItem(
          "customer_data",
          JSON.stringify({
            uid: user.uid,
            role: customerData.role,
            isBlocked: customerData.isBlocked,
          })
        );
      } catch (error) {
        console.error(error);
        router.replace("/customer/signin");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // =========================
  // INITIAL FETCH
  // =========================
  useEffect(() => {
    if (sellerId) {
      fetchSeller();
      fetchProducts();
    }
  }, [sellerId]);

  // =========================
  // CART & DELIVERY STORAGE
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));

    // Only accept "map" as valid delivery option now
    const savedDelivery = localStorage.getItem("delivery_preference");
    if (savedDelivery === "map") setSelectedDelivery(savedDelivery);
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("delivery_preference", selectedDelivery);
  }, [selectedDelivery]);

  // =========================
  // CART FUNCTIONS
  // =========================
  const addItem = (id: string) => {
    setCart((prev: any) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removeItem = (id: string) => {
    setCart((prev: any) => {
      const updated = { ...prev };
      if (updated[id] > 1) {
        updated[id] -= 1;
      } else {
        delete updated[id];
      }
      return updated;
    });
  };

  // =========================
  // FILTER PRODUCTS
  // =========================
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" ? true : product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // =========================
  // CART ITEMS
  // =========================
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      if (!product) return null;
      return { ...product, qty };
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.qty * item.price,
    0
  );

  // 🚚 Calculate delivery fee - Only Same-Day (map) delivery
  const getDeliveryCharge = () => {
    if (!seller?.deliverySettings?.map || cartItems.length === 0) return 0;
    
    const mapOption = seller.deliverySettings.map;
    return mapOption?.enabled ? Number(mapOption.charge || 0) : 0;
  };

  const deliveryFee = getDeliveryCharge();
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.qty, 0);
  const finalTotal = subtotal + deliveryFee + PLATFORM_FEE;

  // 🚚 Get available delivery options - Only Same-Day (map)
  const getAvailableDeliveryOptions = () => {
    if (!seller?.deliverySettings?.map?.enabled) return [];
    
    return [{
      id: "map",
      label: "Same-Day Delivery",
      charge: seller.deliverySettings.map.charge || 0,
      desc: "Today by 9 PM",
    }];
  };

  // =========================
  // INFINITE SCROLL
  // =========================
  const lastProductRef = (node: any) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchProducts(true);
        }
      },
      { threshold: 1 }
    );
    if (node) observer.current.observe(node);
  };

  // =========================
  // PRODUCT SKELETON
  // =========================
  const ProductSkeleton = () => (
    <div className="animate-pulse bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-sm border border-gray-100">
      <div className="relative w-full h-32 sm:h-40 bg-gray-200 rounded-xl sm:rounded-2xl" />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );

  // =========================
  // AUTH LOADING
  // =========================
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold">Checking account...</div>
      </div>
    );
  }

  // =========================
  // LOADING
  // =========================
  if (loading && !seller) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        <Navbar />
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-5">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="h-32 sm:h-48 bg-gray-200 animate-pulse" />
            <div className="p-4 sm:p-6 flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // SELLER NOT FOUND
  // =========================
  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
        <div className="text-center">
          <div className="text-5xl mb-3">😕</div>
          <h2 className="text-xl font-bold text-gray-900">Seller not found</h2>
          <button
            onClick={() => router.back()}
            className="mt-5 px-6 py-3 bg-green-600 text-white rounded-2xl font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const deliveryOptions = getAvailableDeliveryOptions();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-32 overflow-x-hidden">
      <Navbar />

      {/* =========================
          MAIN CONTAINER
      ========================= */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pt-3 sm:pt-5">
        {/* =========================
            SELLER HEADER
        ========================= */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
          {/* BANNER - FIXED URL */}
          <div className="relative h-28 sm:h-40 md:h-52 lg:h-60 w-full">
            <Image
              loading="lazy"
              src={buildImageUrl(
                seller.shopImage?.url,
                "w-1200,h-400,q-60,f-webp",
                "/fallback.png"
              )}
              alt={seller.shopName || "Shop"}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl border ${
                seller.status === "Open"
                  ? "bg-green-500/20 text-white border-white/20"
                  : "bg-black/40 text-white border-white/10"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    seller.status === "Open"
                      ? "bg-green-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />
                {seller.status === "Open" ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          {/* INFO - FIXED URL */}
          <div className="p-3 sm:p-5 md:p-6 flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden flex-shrink-0">
              <Image
                loading="lazy"
                src={buildImageUrl(
                  seller.sellerImage?.url,
                  "w-120,h-120,q-50,f-webp",
                  "/avatar.png"
                )}
                alt={seller.sellerName || "Seller"}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate">
                {seller.shopName}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
                📍 {seller.location?.fullAddress || "Location unavailable"}
              </p>
              {seller.categories?.[0] && (
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  {seller.categories[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* =========================
            SEARCH + FILTER
        ========================= */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 sm:h-14 px-4 bg-white border border-gray-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-green-100"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-12 sm:h-14 px-4 bg-white border border-gray-200 rounded-2xl text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-green-100"
          >
            {["All", "Vegetables", "Fruits", "Groceries", "Dairy", "Meat", "Bakery", "Others"].map(
              (cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              )
            )}
          </select>
        </div>

        {/* =========================
            PRODUCTS - FIXED URL
        ========================= */}
        <div className="mt-5 sm:mt-7 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredProducts.map((product: any, index: number) => {
            const qty = cart[product.id] || 0;
            const isLast = index === filteredProducts.length - 1;
            const isAvailable = product.status?.isAvailable !== false && product.stock > 0;

            return (
              <div
                ref={isLast ? lastProductRef : null}
                key={product.id}
                className="group bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
              >
                {/* IMAGE */}
                <div className="relative w-full h-28 sm:h-40 md:h-44 overflow-hidden rounded-xl sm:rounded-2xl bg-gray-100">
                  <Image
                    loading="lazy"
                    src={buildImageUrl(
                      product.images?.[0],
                      "w-500,h-500,q-60,f-webp",
                      "/fallback.png"
                    )}
                    alt={product.name || "Product"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-red-500 px-3 py-1 rounded-full">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div className="mt-3">
                  <h3 className="text-[13px] sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
                  <p
                    className={`text-xs font-medium mt-1 ${
                      product.delivery?.type === "paid" ? "text-orange-600" : "text-green-600"
                    }`}
                  >
                    {product.delivery?.type === "paid"
                      ? `🚚 ₹${product.delivery?.charge} delivery`
                      : "✨ Free Delivery"}
                  </p>
                </div>

                {/* PRICE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-base sm:text-lg font-extrabold text-gray-900">
                    ₹{product.price}
                  </span>
                  {isAvailable ? (
                    qty === 0 ? (
                      <button
                        onClick={() => addItem(product.id)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-bold rounded-xl transition active:scale-95"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-green-100 px-2 py-1.5 rounded-xl">
                        <button
                          onClick={() => removeItem(product.id)}
                          className="w-7 h-7 rounded-lg hover:bg-green-200 font-bold"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold min-w-[1rem] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => addItem(product.id)}
                          className="w-7 h-7 rounded-lg hover:bg-green-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-red-500 font-bold">Sold Out</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* EMPTY */}
        {filteredProducts.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-10 mt-6 text-center border border-gray-100">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-xl font-bold">No products found</h3>
            <p className="text-gray-500 mt-2">Try another search</p>
          </div>
        )}

        {/* LOADING MORE */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* =========================
          CART BAR
      ========================= */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-4 pb-2 sm:pb-4">
          <div
            onClick={() => setShowCart(true)}
            className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl px-3 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-between cursor-pointer border border-gray-200"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-green-100 rounded-2xl flex items-center justify-center">
                  🛒
                </div>
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">{totalItems} items</p>
                <p className="font-bold text-lg text-gray-900">₹{finalTotal}</p>
              </div>
            </div>
            <div className="text-green-700 font-semibold text-sm">View Cart →</div>
          </div>
        </div>
      )}

      {/* =========================
          CART MODAL
      ========================= */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-end sm:items-center"
          onClick={() => setShowCart(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white w-full sm:max-w-md md:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
          >
            {/* HEADER */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold">Your Cart</h2>
                <p className="text-xs text-gray-500">{totalItems} items</p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex gap-3 border-b border-gray-100 pb-4">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={buildImageUrl(
                          item.images?.[0],
                          "w-300,h-300,q-60,f-webp",
                          "/fallback.png"
                        )}
                        alt={item.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{item.unit}</p>
                      <p className="mt-1 font-bold">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-2 py-1 rounded-xl h-fit">
                      <button onClick={() => removeItem(item.id)} className="w-6 h-6">
                        −
                      </button>
                      <span className="text-sm font-bold">{item.qty}</span>
                      <button onClick={() => addItem(item.id)} className="w-6 h-6">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🚚 DELIVERY OPTIONS - Only Same-Day (map) */}
            {deliveryOptions.length > 0 && (
              <div className="px-5 pb-2">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery Method</h3>
                <div className="space-y-2">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDelivery === option.id
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="w-4 h-4 text-green-600 bg-white border-gray-300 focus:ring-green-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.desc}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-green-700">
                        {option.charge === 0 ? "Free" : `₹${fmt(option.charge)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="border-t border-gray-100 bg-white p-5 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    Delivery ({deliveryOptions.find((o) => o.id === selectedDelivery)?.label || "Same-Day"})
                  </span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${fmt(deliveryFee)}`}</span>
                </div>
                {PLATFORM_FEE > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee</span>
                    <span>₹{fmt(PLATFORM_FEE)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{fmt(finalTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // Save delivery preference before navigating
                  localStorage.setItem("delivery_preference", selectedDelivery);
                  setShowCart(false);
                  router.push("/checkout");
                }}
                disabled={cartItems.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-2xl font-extrabold text-sm sm:text-lg shadow-lg transition-all active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          GLOBAL STYLE
      ========================= */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}