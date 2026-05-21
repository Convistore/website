"use client";

import Image from "next/image";
import Navbar from "../../../../components/Navbar";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  startAfter,
} from "firebase/firestore";
import { auth } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const PRODUCTS_LIMIT = 8;
const PLATFORM_FEE = 0;

/* ─── tiny helpers ─── */
const fmt = (n) => Number(n).toLocaleString("en-IN");

// Safe URL builder for Next.js Image component
const buildImageUrl = (url: string | null | undefined, transforms: string, fallback: string) => {
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

export default function MongsoShopPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id;
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);
  
  // 🚚 Delivery state - Only Same-Day (map) delivery available
  const [selectedDelivery, setSelectedDelivery] = useState("map");
  
  const observer = useRef(null);
  
  const CATEGORIES = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((p) => p.category)
          .filter(Boolean)
      ),
    ];
    return ["All", ...uniqueCategories];
  }, [products]);

  /* ─────────────────────
   CACHE SETTINGS
  ───────────────────── */
  const CACHE_TIME = 1000 * 60 * 5; // 5 mins

  /* ─────────────────────
   FETCH SELLER
  ───────────────────── */
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

      const q = query(
        collection(db, "sellers"),
        where("firebaseUid", "==", sellerId),
        limit(1)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setSeller(data);

        localStorage.setItem(`seller_${sellerId}`, JSON.stringify(data));
        localStorage.setItem(`seller_cache_time_${sellerId}`, Date.now().toString());
      }
    } catch (e) {
      console.error("Fetch seller error:", e);
    }
  };

  /* ─────────────────────
   FETCH PRODUCTS
  ───────────────────── */
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

      const snap = await getDocs(productQuery);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const lastVisible = snap.docs[snap.docs.length - 1];
      setLastDoc(lastVisible);

      if (snap.docs.length < PRODUCTS_LIMIT) {
        setHasMore(false);
      }

      if (loadMore) {
        setProducts((prev) => {
          const merged = Array.from(
            new Map([...prev, ...list].map((p) => [p.id, p])).values()
          );
          localStorage.setItem(`products_${sellerId}`, JSON.stringify(merged));
          localStorage.setItem(`products_cache_time_${sellerId}`, Date.now().toString());
          return merged;
        });
      } else {
        setProducts(list);
        localStorage.setItem(`products_${sellerId}`, JSON.stringify(list));
        localStorage.setItem(`products_cache_time_${sellerId}`, Date.now().toString());
      }
    } catch (e) {
      console.error("Fetch products error:", e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  /* ─────────────────────
   CUSTOMER AUTH CHECK
  ───────────────────── */
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
          if (parsed?.uid === user.uid && parsed?.role === "customer" && !parsed?.isBlocked) {
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
        console.error("Auth check error:", error);
        router.replace("/customer/signin");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (sellerId) {
      fetchSeller();
      fetchProducts();
    }
  }, [sellerId]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
    
    // Load saved delivery preference AND seller context
    const savedDelivery = localStorage.getItem("delivery_preference");
    const savedSellerId = localStorage.getItem("checkout_seller_id");
    
    // Only accept "map" as valid delivery option now
    if (savedDelivery === "map") setSelectedDelivery(savedDelivery);
    
    // If we have a different sellerId in storage, clear it to avoid conflicts
    if (savedSellerId && savedSellerId !== sellerId) {
      localStorage.removeItem("delivery_preference");
      localStorage.removeItem("checkout_seller_id");
      setSelectedDelivery("map");
    }
  }, [sellerId]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Save delivery preference + seller context
  useEffect(() => {
    if (sellerId) {
      localStorage.setItem("delivery_preference", selectedDelivery);
      localStorage.setItem("checkout_seller_id", sellerId);
    }
  }, [selectedDelivery, sellerId]);

  /* ─── cart ─── */
  const addItem = (id) => {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 400);
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  
  const removeItem = (id) => {
    setCart((prev) => {
      const u = { ...prev };
      u[id] > 1 ? (u[id] -= 1) : delete u[id];
      return u;
    });
  };

  /* ─── filter ─── */
  const filteredProducts = useMemo(() => 
    products.filter((p) => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" ? true : p.category === categoryFilter;
      return matchSearch && matchCat;
    }), 
  [products, search, categoryFilter]);

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const p = products.find((p) => p.id === id);
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  
  // 🚚 Calculate delivery fee - Only Same-Day (map) delivery
  const getDeliveryCharge = () => {
    if (!seller?.deliverySettings?.map || cartItems.length === 0) return 0;
    
    const mapOption = seller.deliverySettings.map;
    return mapOption?.enabled ? Number(mapOption.charge || 0) : 0;
  };
  
  const deliveryFee = getDeliveryCharge();
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);
  const finalTotal = subtotal + deliveryFee + PLATFORM_FEE;

  /* ─── delivery options helper - Only Same-Day (map) ─── */
  const getAvailableDeliveryOptions = () => {
    if (!seller?.deliverySettings?.map?.enabled) return [];
    
    return [{
      id: "map",
      label: "Same-Day Delivery",
      charge: seller.deliverySettings.map.charge || 0,
      desc: "Today by 9 PM"
    }];
  };

  /* ─── infinite scroll ─── */
  const lastProductRef = (node) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) fetchProducts(true);
      },
      { threshold: 1 }
    );
    if (node) observer.current.observe(node);
  };

  // =========================
  // AUTH LOADING
  // =========================
  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F6" }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#A68A64" }}>
          Checking account...
        </div>
      </div>
    );
  }

  /* ─── loading skeleton ─── */
  if (loading && !seller) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.25)]">
            <span className="text-3xl font-light text-white tracking-wide">M</span>
          </div>
          <span className="text-5xl font-light tracking-[12px] text-white">MONGSO</span>
        </div>
        <div className="w-52 h-[2px] bg-zinc-900 overflow-hidden rounded-full">
          <div className="h-full w-1/2 bg-red-600 animate-pulse rounded-full" />
        </div>
        <p className="text-zinc-500 text-sm tracking-[4px] uppercase">Loading Premium Products</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-400">Shop not found.</p>
      </div>
    );
  }

  const deliveryOptions = getAvailableDeliveryOptions();

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-['Inter']">
      <Navbar />

      {/* HERO */}
      <div className="relative h-[420px] overflow-hidden border-b border-zinc-800">
        <Image
          loading="lazy"
          src={buildImageUrl(
            seller.shopImage?.url,
            "w-1600,h-700,q-70,f-webp",
            "/fallback.png"
          )}
          alt="shop banner"
          fill
          sizes="100vw"
          className="object-cover scale-105 brightness-[0.38]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <div className="mb-6">
            <div className="w-20 h-[1px] bg-red-600 mx-auto mb-5" />
            <h1 className="text-5xl md:text-7xl font-light tracking-[14px] uppercase text-white">
              MONGSO
            </h1>
            <div className="w-20 h-[1px] bg-red-600 mx-auto mt-5" />
          </div>
          <p className="text-zinc-300 text-sm tracking-[6px] uppercase font-light">
            Premium Smoked & Pickled Meat
          </p>
        </div>
      </div>

      {/* SHOP INFO */}
      <div className="border-b border-zinc-900 bg-[#090909]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-5">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-red-600/50">
            <Image
              loading="lazy"
              src={buildImageUrl(
                seller.sellerImage?.url,
                "w-120,h-120,q-60,f-webp",
                "/avatar.png"
              )}
              alt="seller"
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold tracking-wide">{seller.shopName}</h2>
            <p className="text-zinc-500 text-sm mt-1">{seller.location?.fullAddress}</p>
          </div>
          <span className="border border-red-600/40 text-red-400 bg-red-600/10 px-4 py-2 rounded-full text-[11px] uppercase tracking-[3px] font-medium">
            {seller.status}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* SEARCH */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="h-14 bg-[#0D0D0D] border border-zinc-800 rounded-2xl flex items-center px-5 focus-within:border-red-600 transition-all duration-300">
            <span className="text-zinc-600 mr-4 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent flex-1 outline-none text-white placeholder:text-zinc-600 text-sm tracking-wide"
            />
          </div>

          {/* categories */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-5 h-11 rounded-full text-xs uppercase tracking-[3px] transition-all duration-300 border
                ${
                  categoryFilter === c
                    ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-950/40"
                    : "bg-[#0B0B0B] border-zinc-800 text-zinc-400 hover:border-red-600 hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* EMPTY */}
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🥩</div>
            <p className="text-zinc-500 text-lg">No products found</p>
          </div>
        )}

        {/* PRODUCTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map((product, index) => {
            const qty = cart[product.id] || 0;
            const isLast = index === filteredProducts.length - 1;

            return (
              <div
                ref={isLast ? lastProductRef : null}
                key={product.id}
                className="group bg-[#0B0B0B] border border-zinc-900 rounded-[28px] overflow-hidden hover:border-red-600/50 transition-all duration-500 hover:-translate-y-2"
              >
                {/* IMAGE - FIXED URL HANDLING */}
                <div className="relative h-[280px] overflow-hidden">
                  <Image
                    loading="lazy"
                    src={buildImageUrl(
                      product.images?.[0],
                      "w-700,h-700,q-60,f-webp",
                      "/fallback.png"
                    )}
                    alt={product.name || "Product"}
                    fill
                    sizes="400px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {product.category && (
                    <span className="absolute top-4 left-4 border border-red-600/40 bg-black/70 backdrop-blur-xl text-white px-3 py-1 rounded-full text-[10px] tracking-[3px] uppercase">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* BODY */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold tracking-wide leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-zinc-500 text-sm mt-2">{product.unit}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-2xl font-light text-red-500 tracking-wide">
                        ₹{fmt(product.price)}
                      </h4>
                    </div>
                  </div>

                  {/* stock */}
                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-zinc-600 text-xs tracking-[2px] uppercase">
                      {product.stock} left
                    </p>
                    {product.status?.isAvailable ? (
                      qty === 0 ? (
                        <button
                          onClick={() => addItem(product.id)}
                          className="h-10 px-5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-[3px] transition-all duration-300"
                        >
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-4 border border-red-600/40 rounded-full px-4 h-10 bg-black">
                          <button onClick={() => removeItem(product.id)} className="text-red-500 text-lg">−</button>
                          <span className="text-sm">{qty}</span>
                          <button onClick={() => addItem(product.id)} className="text-red-500 text-lg">+</button>
                        </div>
                      )
                    ) : (
                      <span className="text-red-500 text-xs uppercase tracking-[3px]">Out Of Stock</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* loading */}
        {loadingMore && (
          <div className="flex justify-center py-14">
            <div className="w-10 h-10 rounded-full border border-zinc-700 border-t-red-600 animate-spin" />
          </div>
        )}
      </div>

      {/* CART BAR */}
      {totalItems > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-30px)] max-w-2xl bg-[#0D0D0D]/95 backdrop-blur-2xl border border-red-600/40 rounded-3xl px-6 py-5 flex items-center justify-between shadow-[0_10px_60px_rgba(255,0,0,0.12)] z-50">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-medium">
              {totalItems}
            </div>
            <div>
              <p className="text-zinc-500 text-[11px] uppercase tracking-[3px]">Cart Total</p>
              <h3 className="text-2xl font-light text-white tracking-wide">₹{fmt(finalTotal)}</h3>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="h-12 px-7 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-[3px] transition-all duration-300"
          >
            View Cart
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div
          onClick={() => setShowCart(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0B0B0B] border border-red-600/30 rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-light tracking-wide text-white">Your Cart</h2>
                <p className="text-zinc-500 text-sm mt-1">
                  {totalItems} items from {seller.shopName}
                </p>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 rounded-full border border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* ITEMS */}
            <div className="space-y-5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-zinc-900 pb-5">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                    <Image
                      loading="lazy"
                      src={buildImageUrl(
                        item.images?.[0],
                        "w-300,h-300,q-60,f-webp",
                        "/fallback.png"
                      )}
                      alt={item.name || "Product"}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium tracking-wide text-white">{item.name}</h3>
                        <p className="text-zinc-500 text-sm mt-1">₹{fmt(item.price)} × {item.qty}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xl font-light text-red-500">₹{fmt(item.price * item.qty)}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-5 border border-red-600/40 rounded-full w-fit px-4 h-10 bg-black">
                      <button onClick={() => removeItem(item.id)} className="text-red-500 text-lg">−</button>
                      <span className="text-sm text-white">{item.qty}</span>
                      <button onClick={() => addItem(item.id)} className="text-red-500 text-lg">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 🚚 DELIVERY OPTIONS - Only Same-Day (map) */}
            {deliveryOptions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Delivery Method</h3>
                <div className="space-y-3">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedDelivery === option.id
                          ? "border-red-600 bg-red-600/10"
                          : "border-zinc-800 bg-[#0D0D0D] hover:border-zinc-600"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="w-5 h-5 text-red-600 bg-zinc-800 border-zinc-700 focus:ring-red-600"
                        />
                        <div>
                          <p className="text-white font-medium">{option.label}</p>
                          <p className="text-zinc-500 text-sm">{option.desc}</p>
                        </div>
                      </div>
                      <span className="text-red-400 font-medium">
                        {option.charge === 0 ? "Free" : `₹${fmt(option.charge)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* BILL */}
            <div className="mt-8 bg-black border border-zinc-800 rounded-3xl p-6">
              <div className="flex items-center justify-between text-zinc-400 text-sm">
                <span>Subtotal</span>
                <span>₹{fmt(subtotal)}</span>
              </div>
              
              {PLATFORM_FEE > 0 && (
                <div className="flex items-center justify-between text-zinc-400 text-sm mt-4">
                  <span>Platform Fee</span>
                  <span>₹{fmt(PLATFORM_FEE)}</span>
                </div>
              )}
              <div className="h-px bg-zinc-800 my-5" />
              <div className="flex items-center justify-between">
                <span className="text-lg tracking-wide text-white">Total</span>
                <span className="text-3xl font-light text-red-500">₹{fmt(finalTotal)}</span>
              </div>
            </div>

            {/* ✅ CHECKOUT BUTTON - Save state before navigation */}
            <button
              onClick={() => {
                // Save delivery preference AND seller context before navigating
                localStorage.setItem("delivery_preference", selectedDelivery);
                localStorage.setItem("checkout_seller_id", sellerId);
                
                // Optional: Also save the calculated fee for reference
                localStorage.setItem("checkout_delivery_fee", String(deliveryFee));
                
                // Now navigate to checkout
                router.push("/checkout");
              }}
              disabled={cartItems.length === 0}
              className="w-full h-14 rounded-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white uppercase tracking-[4px] text-sm mt-6 transition-all duration-300"
            >
              Proceed To Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}