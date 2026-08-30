"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

import { db, auth } from "../../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  setDoc,
  
} from "firebase/firestore";

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

/* ─── Format helper ─── */
const fmt = (n: number) => Number(n).toLocaleString("en-IN");

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();

  // 🔥 FIX: Get sellerId from params OR localStorage fallback
  const urlSellerId = params?.id as string;
  const [effectiveSellerId, setEffectiveSellerId] = useState<string>("");

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [customerData, setCustomerData] = useState<any>(null);

  // ADDRESS
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine: "",
    city: "",
  });

  const [isEditing, setIsEditing] = useState(true);

  // 🚚 DELIVERY TYPE & SLOT
  const [selectedDelivery, setSelectedDelivery] = useState<"standard" | "fast">("standard");
  const [deliverySlot, setDeliverySlot] = useState("");

  // Track if delivery preference has been applied after seller loads
  const [deliveryPreferenceApplied, setDeliveryPreferenceApplied] = useState(false);

  // Order ID generated once for success modal (avoid Date.now() mismatch on re-render)
  const [placedOrderId, setPlacedOrderId] = useState("");

  // =========================
  // CUSTOMER AUTH CHECK
  // =========================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.replace("/customer/signin");
          return;
        }

        const customerRef = doc(db, "customers", user.uid);
        const customerSnap = await getDoc(customerRef);

        if (!customerSnap.exists()) {
          router.replace("/customer/signin");
          return;
        }

        const customer = customerSnap.data();
        if (customer.role !== "customer") {
          router.replace("/customer/signin");
          return;
        }
        if (customer.isBlocked) {
          router.replace("/customer/signin");
          return;
        }

        setCustomerData(customer);

        if (customer.address) {
          setAddress({
            name: customer.name || "",
            phone: customer.phone || "",
            addressLine: [
              customer.address.house,
              customer.address.area,
              customer.address.landmark,
            ]
              .filter(Boolean)
              .join(", "),
            city: customer.address.city || "",
          });
          if (customer.address.house || customer.address.area) {
            setIsEditing(false);
          }
        }
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
  // 🔥 FIX: Resolve sellerId from params or localStorage
  // =========================
  useEffect(() => {
    const checkoutSellerId = localStorage.getItem("checkout_seller_id");

    if (urlSellerId) {
      // URL has sellerId - use it and update localStorage
      setEffectiveSellerId(urlSellerId);
      localStorage.setItem("checkout_seller_id", urlSellerId);
    } else if (checkoutSellerId) {
      // Fallback to localStorage
      setEffectiveSellerId(checkoutSellerId);
    } else {
      // No seller context - redirect to home
      router.replace("/");
    }
  }, [urlSellerId, router]);

  // =========================
  // FETCH SELLER BY firebaseUid
  // =========================
  useEffect(() => {
    const fetchSeller = async () => {
      if (!effectiveSellerId) {
        setSellerLoading(false);
        return;
      }
      try {
        const cached = localStorage.getItem(`seller_${effectiveSellerId}`);
        const cacheTime = localStorage.getItem(`seller_cache_time_${effectiveSellerId}`);

        if (cached && cacheTime) {
          const isExpired = Date.now() - Number(cacheTime) > 1000 * 60 * 5;
          if (!isExpired) {
            setSeller(JSON.parse(cached));
            setSellerLoading(false);
            return;
          }
        }

        const sellerQuery = query(
          collection(db, "sellers"),
          where("firebaseUid", "==", effectiveSellerId),
          limit(1)
        );

        const sellerSnap = await getDocs(sellerQuery);

        if (!sellerSnap.empty) {
          const data = { id: sellerSnap.docs[0].id, ...sellerSnap.docs[0].data() };
          setSeller(data);
          localStorage.setItem(`seller_${effectiveSellerId}`, JSON.stringify(data));
          localStorage.setItem(`seller_cache_time_${effectiveSellerId}`, Date.now().toString());
        }
      } catch (err) {
        console.error("Fetch seller error:", err);
      } finally {
        setSellerLoading(false);
      }
    };
    fetchSeller();
  }, [effectiveSellerId]);

  // =========================
  // 🔥 FIX: Apply delivery preference AFTER seller loads
  // =========================
  useEffect(() => {
    if (!seller || sellerLoading || deliveryPreferenceApplied) return;

    const savedDelivery = localStorage.getItem("delivery_preference");
    const savedSellerId = localStorage.getItem("checkout_seller_id");

    // Only apply if seller context matches
    if (savedSellerId === effectiveSellerId && (savedDelivery === "fast" || savedDelivery === "standard")) {
      // Verify the selected option is actually enabled in seller settings
      const settings = seller.deliverySettings;
      if (settings?.[savedDelivery]?.enabled) {
        setSelectedDelivery(savedDelivery as "standard" | "fast");
      }
      // If saved option is disabled, fallback to standard if enabled
      else if (settings?.standard?.enabled) {
        setSelectedDelivery("standard");
      }
    }

    // Load saved slot for standard delivery
    const savedSlot = localStorage.getItem("delivery_slot");
    if (savedSlot) setDeliverySlot(savedSlot);

    setDeliveryPreferenceApplied(true);
  }, [seller, sellerLoading, effectiveSellerId, deliveryPreferenceApplied]);
useEffect(() => {
  if (!seller?.deliverySettings) return;

  if (
    selectedDelivery === "standard" &&
    !seller.deliverySettings.standard?.enabled &&
    seller.deliverySettings.fast?.enabled
  ) {
    setSelectedDelivery("fast");
  }

  if (
    selectedDelivery === "fast" &&
    !seller.deliverySettings.fast?.enabled &&
    seller.deliverySettings.standard?.enabled
  ) {
    setSelectedDelivery("standard");
  }
}, [seller]);
  // =========================
  // GENERATE DELIVERY SLOTS
  // =========================
  const generateDeliverySlots = () => {
    const slots: string[] = [];

    const now = new Date();

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let startHour = 0;

    // ALWAYS START FROM NEXT HOUR
    // Example:
    // 7:02 -> 8PM
    // 7:45 -> 9PM
    if (currentMinute > 40) {
      startHour = currentHour + 2;
    } else {
      startHour = currentHour + 1;
    }

    // START FROM 9AM MINIMUM
    if (startHour < 9) {
      startHour = 9;
    }

    // LAST SLOT = 9PM
    for (let hour = startHour; hour <= 21; hour++) {
      slots.push(formatHour(hour));
    }

    return slots;
  };

  const formatHour = (hour: number) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:00 ${suffix}`;
  };

  const deliverySlots = useMemo(() => generateDeliverySlots(), []);

  // =========================
  // LOAD CART
  // =========================
  useEffect(() => {
    loadCart();
  }, []);

  // Persist delivery preference
  useEffect(() => {
    if (effectiveSellerId) {
      localStorage.setItem("delivery_preference", selectedDelivery);
      localStorage.setItem("checkout_seller_id", effectiveSellerId);
    }
  }, [selectedDelivery, effectiveSellerId]);

  // =========================
  // REDIRECT COUNTDOWN
  // =========================
  useEffect(() => {
    if (showSuccessModal && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && redirectCountdown === 0) {
      router.push("/customer/orders");
    }
  }, [showSuccessModal, redirectCountdown, router]);

  // =========================
  // LOAD CART FUNCTION
  // =========================
  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      const allProducts: any[] = [];

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("products_")) {
          try {
            const products = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(products)) {
              allProducts.push(...products);
            }
          } catch (err) {
            console.error(err);
          }
        }
      });

      const uniqueProducts = Array.from(
        new Map(allProducts.map((product) => [product.id, product])).values()
      );

      const items = Object.entries(cart)
        .map(([id, qty]) => {
          const product = uniqueProducts.find((p: any) => p.id === id);
          if (!product) return null;
          return { ...product, qty };
        })
        .filter(Boolean);

      setCartItems(items as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // SAVE ADDRESS
  // =========================
  const handleSaveAddress = async () => {
    try {
      if (!auth.currentUser) return;
      const customerRef = doc(db, "customers", auth.currentUser.uid);
      await setDoc(
        customerRef,
        {
          name: address.name,
          phone: address.phone,
          address: {
            house: address.addressLine,
            area: "",
            city: address.city,
            state: "",
            pincode: "",
            landmark: "",
          },
        },
        { merge: true }
      );
      localStorage.setItem("address", JSON.stringify(address));
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save address");
    }
  };

  // =========================
  // UPDATE QTY
  // =========================
  const updateQty = (id: string, type: string) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "{}");
      if (type === "add") {
        cart[id] = (cart[id] || 0) + 1;
      } else {
        if (cart[id] > 1) {
          cart[id] -= 1;
        } else {
          delete cart[id];
        }
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      loadCart();
    } catch (err) {
      console.error(err);
    }
  };

  // =========================
  // TOTALS (subtotal needed before delivery calc)
  // =========================
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item: any) => sum + item.price * item.qty, 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item: any) => sum + item.qty, 0);
  }, [cartItems]);



// =========================
  // 🚚 DELIVERY FEE & OPTIONS
  // =========================
  const getDeliveryCharge = () => {
    if (cartItems.length === 0 || !seller?.deliverySettings) return 0;

    const settings = seller.deliverySettings;

    // FAST DELIVERY — always charged at its own rate, never free
    if (selectedDelivery === "fast") {
      return Number(settings.fast?.charge || 0);
    }

    // STANDARD DELIVERY
    if (settings.freeDelivery?.enabled) {
      const minOrder = Number(settings.freeDelivery.minOrder || 0);
      const belowCharge = Number(settings.freeDelivery.belowCharge || 0);

      if (subtotal >= minOrder) {
        return 0; // FREE above threshold
      }
      return belowCharge; // Below threshold custom charge
    }

    // Normal standard charge (no free delivery configured)
    return Number(settings.standard?.charge || 0);
  };

  const deliveryFee = useMemo(
    () => getDeliveryCharge(),
    [seller, selectedDelivery, subtotal, cartItems.length]
  );

  const getAvailableDeliveryOptions = () => {
    const settings = seller?.deliverySettings;
    if (!settings) return [];

    const options: { id: string; label: string; charge: number; desc: string; freeAbove?: number }[] = [];

    if (settings.standard?.enabled) {
      const freeEnabled = settings.freeDelivery?.enabled;
      options.push({
        id: "standard",
        label: "Standard Delivery",
        charge: freeEnabled
          ? Number(settings.freeDelivery.belowCharge || 0)
          : Number(settings.standard.charge || 0),
        desc: freeEnabled
          ? `FREE on orders above ₹${fmt(Number(settings.freeDelivery.minOrder || 0))}`
          : "Delivered within 1 hour",
        freeAbove: freeEnabled ? Number(settings.freeDelivery.minOrder || 0) : undefined,
      });
    }
    if (settings.fast?.enabled) {
      options.push({
        id: "fast",
        label: "Fast Delivery",
        charge: Number(settings.fast.charge || 0),
        desc: "Delivered in just a few minutes",
      });
    }
    return options;
  };

  const deliveryOptions = getAvailableDeliveryOptions();

  // Whether free delivery is configured & enabled at all (regardless of selection)
  const freeDeliveryEnabled = !!seller?.deliverySettings?.freeDelivery?.enabled;
  const standardEnabled = !!seller?.deliverySettings?.standard?.enabled;

  const total = useMemo(() => {
    return subtotal + deliveryFee + PLATFORM_FEE;
  }, [subtotal, deliveryFee]);

  // Helper: amount needed to unlock free standard delivery
  // Shown whenever standard delivery + free delivery threshold is configured,
  // regardless of which delivery type is currently selected
  const amountToFreeDelivery = useMemo(() => {
    if (!standardEnabled || !freeDeliveryEnabled) return null;
    const minOrder = Number(seller?.deliverySettings?.freeDelivery?.minOrder || 0);
    const remaining = minOrder - subtotal;
    return remaining > 0 ? remaining : 0;
  }, [seller, subtotal, standardEnabled, freeDeliveryEnabled]);



 

  // =========================
  // PLACE ORDER
  // =========================
  const handlePlaceOrder = async () => {
    try {
      if (!auth.currentUser) {
        router.push("/customer/signin");
        return;
      }

      if (!address.name || !address.phone || !address.addressLine) {
        alert("Please fill delivery details");
        return;
      }

      if (selectedDelivery === "standard" && !deliverySlot) {
        alert("Please select a delivery time slot");
        return;
      }

      if (cartItems.length === 0) {
        alert("Cart is empty");
        return;
      }

      localStorage.setItem("delivery_slot", deliverySlot);

      const orderId = `order_${Date.now()}`;

      const purchaseData = {
        orderId,
        customerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "cod",

        customer: {
          uid: auth.currentUser.uid,
          name: address.name,
          phone: address.phone,
          address: address.addressLine,
          city: address.city,
          email: customerData?.email || "",
        },

        delivery: {
          type: selectedDelivery,
          slot: selectedDelivery === "standard" ? deliverySlot : null,
          charge: deliveryFee,
        },

        items: cartItems.map((item: any) => ({
          productId: item.productId || item.id,
          sellerId: item.sellerId || "",
          quantity: item.qty,
          price: item.price,
          name: item.name,
          image: item.images?.[0] || "",
        })),

        analytics: {
          totalItems,
          subtotal,
          deliveryFee,
          platformFee: PLATFORM_FEE,
          totalAmount: total,
        },

        sellerIds: [...new Set(cartItems.map((item: any) => item.sellerId))],
        categories: [...new Set(cartItems.map((item: any) => item.category))],
      };

      const purchaseRef = await addDoc(collection(db, "purchases"), purchaseData);
// Send notification to every seller
for (const sellerId of purchaseData.sellerIds) {
  try {
    const sellerQuery = query(
      collection(db, "sellers"),
      where("firebaseUid", "==", sellerId),
      limit(1)
    );

    const sellerSnap = await getDocs(sellerQuery);

    if (sellerSnap.empty) continue;

    const sellerDoc = sellerSnap.docs[0];
    const sellerData = sellerDoc.data();

    if (!sellerData.fcmToken) continue;

    await fetch("/api/sendNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
  token: sellerData.fcmToken,
  title: "🛒 New Order Received",
  body: `Order ${orderId} has been placed.`,
  orderId,
}),
    });
  } catch (err) {
    console.error("Notification error:", err);
  }
}
      await addDoc(
        collection(db, "customers", auth.currentUser.uid, "orders"),
        {
          purchaseId: purchaseRef.id,
          orderId,
          createdAt: serverTimestamp(),
          total,
          status: "pending",
        }
      );

      const existingOrders = JSON.parse(localStorage.getItem("customer_orders") || "[]");
      const successfulOrder = {
        ...purchaseData,
        firebasePurchaseId: purchaseRef.id,
        createdAt: new Date().toISOString(),
        paymentStatus: "success",
        status: "confirmed",
      };
      existingOrders.unshift(successfulOrder);
      localStorage.setItem("customer_orders", JSON.stringify(existingOrders));

      localStorage.removeItem("cart");
      // Clear checkout-specific localStorage
      localStorage.removeItem("delivery_preference");
      localStorage.removeItem("checkout_seller_id");
      localStorage.removeItem("checkout_delivery_fee");

      setPlacedOrderId(orderId);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  // =========================
  // AUTH LOADING
  // =========================
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2EE6A6] border-t-transparent rounded-full animate-spin" />
          <div className="text-base font-medium text-[#0F172A]">Checking your account...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* PAGE HEADER */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#0F172A]">Checkout</h1>
          <span className="text-sm text-gray-400">
            ({totalItems} {totalItems === 1 ? "item" : "items"})
          </span>
        </div>

        {/* ADDRESS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h2 className="text-lg font-semibold text-[#0F172A]">Delivery Address</h2>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[#0F172A] text-sm font-semibold bg-[#2EE6A6]/15 px-3 py-1.5 rounded-lg hover:bg-[#2EE6A6]/25 transition"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  placeholder="e.g. Rohan Sharma"
                  value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#2EE6A6] focus:ring-2 focus:ring-[#2EE6A6]/30 transition"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#2EE6A6] focus:ring-2 focus:ring-[#2EE6A6]/30 transition"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-[#0F172A] mb-1">
                  Address
                </label>
                <input
                  id="address"
                  placeholder="House no., street, area, landmark"
                  value={address.addressLine}
                  onChange={(e) => setAddress({ ...address, addressLine: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#2EE6A6] focus:ring-2 focus:ring-[#2EE6A6]/30 transition"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-[#0F172A] mb-1">
                  City
                </label>
                <input
                  id="city"
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#2EE6A6] focus:ring-2 focus:ring-[#2EE6A6]/30 transition"
                />
              </div>
              <button
                onClick={handleSaveAddress}
                disabled={!address.name || !address.phone || !address.addressLine || !address.city}
                className="w-full bg-[#2EE6A6] text-[#0F172A] py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
              >
                Save Address
              </button>
            </div>
          ) : (
            <div className="text-sm text-[#0F172A] space-y-1.5 bg-[#F8FAFC] rounded-xl p-4">
              <p className="font-semibold">{address.name}</p>
              <p className="text-gray-600">{address.phone}</p>
              <p className="text-gray-600">{address.addressLine}</p>
              <p className="text-gray-600">{address.city}</p>
            </div>
          )}
        </div>

        {/* 🚚 DELIVERY TYPE SELECTION */}
       {/* 🚚 DELIVERY TYPE SELECTION */}
        {!sellerLoading && effectiveSellerId && deliveryOptions.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🚚</span>
              <h2 className="text-lg font-semibold text-[#0F172A]">Delivery Method</h2>
            </div>
            <div className="space-y-3">
              {deliveryOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedDelivery === option.id
                      ? "border-[#2EE6A6] bg-[#2EE6A6]/10"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="radio"
                      name="delivery"
                      value={option.id}
                      checked={selectedDelivery === option.id}
                      onChange={(e) => {
                        const value = e.target.value as "standard" | "fast";
                        setSelectedDelivery(value);
                        if (value === "fast") setDeliverySlot("");
                      }}
                      className="w-5 h-5 accent-[#2EE6A6]"
                    />
                    <div>
                      <p className="font-semibold text-[#0F172A] flex items-center gap-2">
                        {option.label}
                        {option.id === "fast" && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-[#0F172A] text-[#2EE6A6] px-2 py-0.5 rounded-full">
                            ⚡ Express
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{option.desc}</p>
                    </div>
                  </div>
                  <span
                    className={`font-bold ${
                      option.charge === 0 ? "text-green-600" : "text-[#0F172A]"
                    }`}
                  >
                    {option.charge === 0 ? "FREE" : `₹${fmt(option.charge)}`}
                  </span>
                </label>
              ))}
            </div>

            {/* Free delivery progress nudge — shown for any selected option,
                as long as standard + free delivery threshold is configured */}
            {amountToFreeDelivery !== null && amountToFreeDelivery > 0 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                Add <span className="font-bold">₹{fmt(amountToFreeDelivery)}</span> more to
                your order to get{" "}
                <span className="font-bold">FREE Standard Delivery</span> 🎉
                <div className="w-full bg-amber-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (subtotal /
                          Number(seller?.deliverySettings?.freeDelivery?.minOrder || 1)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {amountToFreeDelivery === 0 && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                🎉 You've unlocked FREE Standard Delivery!
              </div>
            )}
          </div>
        )}

    

        {/* 🕐 DELIVERY SLOT (Only for Standard) */}
{selectedDelivery === "standard" &&
 seller?.deliverySettings?.standard?.enabled &&
 !sellerLoading &&
 effectiveSellerId && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🕐</span>
              <h2 className="text-lg font-semibold text-[#0F172A]">Select Delivery Time</h2>
            </div>
            {deliverySlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {deliverySlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setDeliverySlot(slot)}
                    className={`border-2 rounded-xl py-3 text-sm font-semibold transition ${
                      deliverySlot === slot
                        ? "bg-[#2EE6A6] border-[#2EE6A6] text-[#0F172A]"
                        : "bg-white border-gray-200 hover:border-[#2EE6A6] text-[#0F172A]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No slots available today. Please try Fast Delivery or order tomorrow.
              </p>
            )}
          </div>
        )}

        {/* Fast Delivery Info Banner */}
        {selectedDelivery === "fast" && !sellerLoading && effectiveSellerId && (
          <div className="bg-[#2EE6A6]/10 border border-[#2EE6A6]/30 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-semibold text-[#0F172A]">Fast Delivery Selected</p>
              <p className="text-sm text-gray-600">
                Your order will be prioritized and delivered in just a few minutes. No time slot
                needed.
              </p>
            </div>
          </div>
        )}

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-5">
            Order Summary
          </h2>
          {cartItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-3xl mb-2">🛒</p>
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="relative w-14 h-14 overflow-hidden rounded-xl bg-gray-100 shrink-0">
                    <Image
                      loading="lazy"
                      src={buildImageUrl(
                        item.images?.[0]?.url || item.images?.[0],
                        "w-120,h-120,q-40,f-webp",
                        "/fallback.png"
                      )}
                      alt={item.name || "Product"}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1 text-[#0F172A]">{item.name}</p>
                    <p className="text-xs text-gray-500">₹{fmt(item.price)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#2EE6A6] px-3 py-1.5 rounded-xl font-semibold text-[#0F172A]">
                    <button
                      onClick={() => updateQty(item.id, "remove")}
                      className="w-5 h-5 flex items-center justify-center hover:opacity-70"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[1.25rem] text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, "add")}
                      className="w-5 h-5 flex items-center justify-center hover:opacity-70"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BILL DETAILS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Bill Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Items Total</span>
              <span className="text-[#0F172A] font-medium">₹{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Delivery ({deliveryOptions.find((o) => o.id === selectedDelivery)?.label || "Standard"})
              </span>
              <span className={deliveryFee === 0 ? "text-green-600 font-semibold" : "text-[#0F172A] font-medium"}>
                {deliveryFee === 0 ? "FREE 🎉" : `₹${fmt(deliveryFee)}`}
              </span>
            </div>
            {PLATFORM_FEE > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee</span>
                <span className="text-[#0F172A] font-medium">₹{fmt(PLATFORM_FEE)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-[#0F172A]">
              <span>Total</span>
              <span>₹{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-xs text-gray-500">{totalItems} {totalItems === 1 ? "item" : "items"}</p>
          <p className="text-lg font-bold text-[#0F172A]">₹{fmt(total)}</p>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={
            cartItems.length === 0 ||
            !address.name ||
            !address.phone ||
            !address.addressLine ||
            (selectedDelivery === "standard" && !deliverySlot) ||
            sellerLoading ||
            !effectiveSellerId
          }
          className="bg-[#2EE6A6] text-[#0F172A] px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition"
        >
          {sellerLoading ? "Loading..." : "Place Order"}
        </button>
      </div>

      {/* ✅ SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 mx-auto mb-6 bg-[#2EE6A6]/15 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-[#2EE6A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#0F172A] mb-2">Order Placed! 🎉</h3>
            <p className="text-gray-500 mb-6">Your order has been confirmed successfully.</p>
            <div className="bg-[#F8FAFC] rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Order ID</p>
              <p className="font-mono font-semibold text-[#0F172A]">{placedOrderId}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Redirecting to your orders in{" "}
                <span className="font-bold text-[#2EE6A6]">{redirectCountdown}s</span>
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#2EE6A6] h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(redirectCountdown / 5) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => router.push("/customer/orders")}
              className="mt-6 text-sm text-[#2EE6A6] font-semibold hover:underline"
            >
              Go to Orders Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}