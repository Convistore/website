"use client";

import { useState, useEffect } from "react";

import { db, auth } from "../../../lib/firebase";

import { Timestamp, doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { useRouter } from "next/navigation";

import imageCompression from "browser-image-compression";

const categories = [
  "Vegetables",
  "Fruits",
  "Groceries",
  "Dairy",
  "Meat",
  "Seafood",
  "Bakery",
  "Snacks",
  "Beverages",
  "Frozen Food",
  "Ready To Eat",
  "Personal Care",
  "Health & Wellness",
  "Baby Care",
  "Household Items",
  "Cleaning Supplies",
  "Kitchen Essentials",
  "Home & Living",
  "Electronics",
  "Fashion",
  "Footwear",
  "Accessories",
  "Books & Stationery",
  "Sports & Fitness",
  "Toys & Games",
  "Pet Supplies",
  "Gardening",
  "Automobile Accessories",
  "Gift Items",
  "Handmade Products",
  "Others",
];

export default function AddProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [savingDelivery, setSavingDelivery] = useState(false);

  const [categorySearch, setCategorySearch] = useState("");

  const [showCategories, setShowCategories] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);
  // =========================
  // DELIVERY SETTINGS
  // =========================

  const [deliverySettings, setDeliverySettings] = useState({
    standard: {
      enabled: true,
      charge: "0",
    },

    fast: {
      enabled: false,
      charge: "",
    },
  });
  // =========================
  // FORM
  // =========================

  const [form, setForm] = useState({
    name: "",

    description: "",

    category: "",

    price: "",

    stock: "",

    unit: "",

    images: [] as {
      url: string;

      fileId: string;
    }[],
  });

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");

        return;
      }

      try {
        // =========================
        // CACHE FIRST
        // =========================

        const cachedDelivery = localStorage.getItem(
          `delivery_settings_${user.uid}`,
        );

        if (cachedDelivery) {
          setDeliverySettings(JSON.parse(cachedDelivery));
        }

        // =========================
        // FETCH SELLER SETTINGS
        // =========================

        const sellerRef = doc(db, "sellers", user.uid);

        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          const data = sellerSnap.data();

  if (data.status) {
  setShopOpen(data.status === "Open");
}
          if (data.deliverySettings) {
            setDeliverySettings({
              standard: {
                enabled: data?.deliverySettings?.standard?.enabled ?? true,

                charge: String(data?.deliverySettings?.standard?.charge ?? 0),
              },

              fast: {
                enabled: data?.deliverySettings?.fast?.enabled ?? false,

                charge: String(data?.deliverySettings?.fast?.charge ?? ""),
              },
            });

            localStorage.setItem(
              `delivery_settings_${user.uid}`,
              JSON.stringify(data.deliverySettings),
            );
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // =========================
  // IMAGE UPLOAD
  // =========================

  const uploadImages = async (files: FileList) => {
    try {
      if (form.images.length + files.length > 5) {
        alert("Maximum 5 images allowed");

        return;
      }

      setUploading(true);

      const uploadedUrls: {
        url: string;

        fileId: string;
      }[] = [];

      for (const file of Array.from(files)) {
        // =========================
        // VALIDATION
        // =========================

        if (!file.type.startsWith("image/")) {
          alert("Only image files allowed");

          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("Image must be below 5MB");

          continue;
        }

        // =========================
        // COMPRESS
        // =========================

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.3,

          maxWidthOrHeight: 1280,

          useWebWorker: true,
        });

        // =========================
        // AUTH
        // =========================

        const authRes = await fetch("/api/imagekit-auth");

        const authData = await authRes.json();

        // =========================
        // FORM DATA
        // =========================

        const formData = new FormData();

        formData.append("file", compressedFile);

        formData.append("fileName", `${Date.now()}-${compressedFile.name}`);

        formData.append("folder", "/products");

        formData.append(
          "publicKey",
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
        );

        formData.append("signature", authData.signature);

        formData.append("expire", authData.expire);

        formData.append("token", authData.token);

        // =========================
        // UPLOAD
        // =========================

        const uploadRes = await fetch(
          "https://upload.imagekit.io/api/v1/files/upload",
          {
            method: "POST",

            body: formData,
          },
        );

        const data = await uploadRes.json();

        if (data.url) {
          uploadedUrls.push({
            url: data.url,

            fileId: data.fileId,
          });
        }
      }

      setForm((prev) => ({
        ...prev,

        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error(error);

      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // SAVE DELIVERY SETTINGS
  // =========================

  const saveDeliverySettings = async () => {
    try {
      setSavingDelivery(true);

      const user = auth.currentUser;

      if (!user) return;

      const optimizedSettings = {
        standard: {
          enabled: deliverySettings?.standard?.enabled,

          charge: deliverySettings?.standard?.enabled
            ? Number(deliverySettings.standard.charge) || 0
            : 0,
        },

        fast: {
          enabled: deliverySettings?.fast?.enabled,

          charge: deliverySettings?.fast?.enabled
            ? Number(deliverySettings?.fast?.charge) || 0
            : 0,
        },
      };

      // =========================
      // UPDATE ONLY DELIVERY FIELD
      // =========================

await setDoc(
  doc(db, "sellers", user.uid),
  {
    deliverySettings: optimizedSettings,
    status: shopOpen ? "Open" : "Closed",
  },
  { merge: true },
);

      // =========================
      // CACHE
      // =========================

      localStorage.setItem(
        `delivery_settings_${user.uid}`,
        JSON.stringify(optimizedSettings),
      );

      alert("✅ Delivery settings updated");
    } catch (error) {
      console.error(error);

      alert("❌ Failed to update delivery settings");
    } finally {
      setSavingDelivery(false);
    }
  };

const saveShopStatus = async () => {
  try {
    const user = auth.currentUser;

    if (!user) return;

    await setDoc(
      doc(db, "sellers", user.uid),
      {
        status: shopOpen ? "Open" : "Closed",
      },
      { merge: true },
    );

    alert("✅ Shop status updated");
  } catch (error) {
    console.error(error);

    alert("❌ Failed to update shop status");
  }
};

  // =========================
  // SUBMIT PRODUCT
  // =========================

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.category) {
      alert("Please fill required fields");

      return;
    }
    if (!acceptedTerms) {
      alert("Please accept Seller Terms & Conditions");

      return;
    }
    try {
      setLoading(true);

      const user = auth.currentUser;

      if (!user) {
        alert("You must login first");

        return;
      }

      const productId = `prod_${Date.now()}`;

      // =========================
      // SAVE PRODUCT
      // =========================

      await setDoc(doc(db, "products", productId), {
        productId,

        sellerId: user.uid,

        name: form.name.trim(),

        description: form.description.trim(),

        category: form.category.trim(),

        price: Number(form.price),

        stock: Math.max(0, Number(form.stock)),

        unit: form.unit.trim(),

        images: form.images,

        status: {
          isAvailable: Number(form.stock) > 0,
        },

        createdAt: Timestamp.now(),
      });

      alert("✅ Product added successfully");

      // RESET
      setForm({
        name: "",

        description: "",

        category: "",

        price: "",

        stock: "",

        unit: "",

        images: [],
      });
    } catch (err) {
      console.error(err);

      alert("❌ Error adding product");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FILTERED CATEGORIES
  // =========================

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center flex-col px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* ========================= */}
        {/* ADD PRODUCT */}
        {/* ========================= */}

        <div className="bg-white p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-5">
            Add Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            <input
              placeholder="Product Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,

                  name: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2 outline-none"
            />

            {/* DESCRIPTION */}
            <textarea
              placeholder="Description"
              maxLength={300}
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,

                  description: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2 outline-none"
            />

            {/* CATEGORY */}
            <div className="relative">
              <input
                placeholder="Search category"
                value={categorySearch}
                onChange={(e) => {
                  const value = e.target.value;

                  setCategorySearch(value);

                  setShowCategories(true);

                  setForm({
                    ...form,

                    category: value,
                  });
                }}
                className="w-full border rounded-lg px-3 py-2 outline-none"
              />

              {showCategories && filteredCategories.length > 0 && (
                <div className="absolute z-20 bg-white border rounded-xl mt-1 w-full max-h-52 overflow-y-auto shadow">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,

                          category: cat,
                        });

                        setCategorySearch(cat);

                        setShowCategories(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PRICE */}
            <input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,

                  price: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2 outline-none"
            />

            {/* STOCK */}
            <input
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({
                  ...form,

                  stock: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2 outline-none"
            />

            {/* UNIT */}
            <input
              placeholder="Unit"
              value={form.unit}
              onChange={(e) =>
                setForm({
                  ...form,

                  unit: e.target.value,
                })
              }
              className="w-full border rounded-lg px-3 py-2 outline-none"
            />

            {/* IMAGE */}
            <div className="border rounded-xl p-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    uploadImages(e.target.files);
                  }
                }}
              />

              {uploading && (
                <p className="text-sm mt-2">Compressing & Uploading...</p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                {form.images.map((img, index) => (
                  <div key={index} className="relative">
                    <img
                      loading="lazy"
                      src={`${img.url}?tr=w-400,h-400,q-60,f-webp`}
                      alt="product"
                      className="w-full h-32 object-cover rounded-xl border"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const updatedImages = form.images.filter(
                          (_, i) => i !== index,
                        );

                        setForm({
                          ...form,

                          images: updatedImages,
                        });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-[#2EE6A6] text-[#0F172A] py-3 rounded-xl font-semibold"
            >
              {loading ? "Adding Product..." : "Add Product"}
            </button>
          </form>
        </div>

        {/* ========================= */}
        {/* DELIVERY SETTINGS */}
        {/* ========================= */}

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-5">Delivery Settings</h2>

          <div className="space-y-5">
            {/* STANDARD */}
            <div className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Standard Delivery</h3>

                <button
                  type="button"
                  onClick={() =>
                    setDeliverySettings((prev) => ({
                      ...prev,

                      standard: {
                        ...prev.standard,

                        enabled: !prev.standard.enabled,
                      },
                    }))
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    deliverySettings.standard.enabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {deliverySettings.standard.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              {deliverySettings.standard.enabled && (
                <input
                  type="number"
                  placeholder="Standard delivery charge"
                  value={deliverySettings.standard.charge}
                  onChange={(e) =>
                    setDeliverySettings((prev) => ({
                      ...prev,

                      standard: {
                        ...prev.standard,

                        charge: e.target.value,
                      },
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </div>

            {/* FAST */}
            <div className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Fast Delivery</h3>

                <button
                  type="button"
                  onClick={() =>
                    setDeliverySettings((prev) => ({
                      ...prev,

                      fast: {
                        ...prev.fast,

                        enabled: !prev.fast.enabled,
                      },
                    }))
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    deliverySettings.fast.enabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {deliverySettings.fast.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              {deliverySettings.fast.enabled && (
                <input
                  type="number"
                  placeholder="Fast delivery charge"
                  value={deliverySettings.fast.charge}
                  onChange={(e) =>
                    setDeliverySettings((prev) => ({
                      ...prev,

                      fast: {
                        ...prev.fast,

                        charge: e.target.value,
                      },
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </div>

            {/* SAVE */}
            <button
              type="button"
              onClick={saveDeliverySettings}
              disabled={savingDelivery}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold"
            >
              {savingDelivery ? "Saving..." : "Update Delivery Settings"}
            </button>
          </div>
        </div>
        {/* ========================= */}
        {/* TERMS & CONDITIONS */}
        {/* ========================= */}

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-5">Seller Terms & Conditions</h2>

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="text-blue-600 font-semibold underline"
            >
              click here
            </button>
          </div>
        </div>
      </div>
      {/* ========================= */}
{/* SHOP STATUS */}
{/* ========================= */}

<div className="bg-white p-6 rounded-2xl shadow mt-10">
  <h2 className="text-2xl font-bold mb-5">Shop Status</h2>

  <div className="flex items-center justify-between border rounded-2xl p-4">
    <div>
      <h3 className="font-semibold text-lg">
        {shopOpen ? "Shop is Open" : "Shop is Closed"}
      </h3>

      <p className="text-sm text-gray-500 mt-1 ">
        Customers will see your current availability
      </p>
    </div>
<button
  type="button"
  onClick={async () => {
    const newStatus = !shopOpen;

    setShopOpen(newStatus);

    try {
      const user = auth.currentUser;

      if (!user) return;

      await setDoc(
        doc(db, "sellers", user.uid),
        {
          status: newStatus ? "Open" : "Closed",
        },
        { merge: true },
      );
    } catch (error) {
      console.error(error);
    }
  }}
  className={`px-5 py-2 rounded-xl font-semibold transition-all ${
    shopOpen
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white"
  }`}
>
  {shopOpen ? "Open" : "Closed"}
</button>
  </div>
</div>

      {/* ========================= */}
      {/* TERMS MODAL */}
      {/* ========================= */}

      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold mb-6">
              Seller Shop Policy & Terms
            </h2>

            <div className="space-y-5 text-sm text-gray-700 leading-7">
              <div>
                <h3 className="font-bold text-black">
                  Seller Partnership Agreement
                </h3>

                <p>
                  By registering as a seller on [Your Platform Name], the shop
                  owner agrees to the following policies:
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  1. Seller Eligibility
                </h3>

                <ul className="list-disc ml-6">
                  <li>Seller must operate a legitimate local business.</li>

                  <li>
                    Seller must provide accurate business and contact details.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  2. Product Listing Rules
                </h3>

                <p>
                  Sellers may list products available in their shop inventory.
                </p>

                <p>Sellers are responsible for:</p>

                <ul className="list-disc ml-6">
                  <li>Correct pricing</li>
                  <li>Product images</li>
                  <li>Product descriptions</li>
                  <li>Expiry dates</li>
                  <li>Availability updates</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  3. Prohibited Products
                </h3>

                <p>Sellers must not list:</p>

                <ul className="list-disc ml-6">
                  <li>Illegal products</li>
                  <li>Expired items</li>
                  <li>Alcohol (if restricted)</li>
                  <li>Tobacco products (if restricted)</li>
                  <li>Unsafe or counterfeit goods</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  4. Order Acceptance
                </h3>

                <p>
                  Sellers must accept or reject orders within a reasonable time.
                </p>

                <p>
                  Accepted orders must be prepared properly for delivery or
                  pickup.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  5. Delivery Responsibility
                </h3>

                <p>Seller may use:</p>

                <ul className="list-disc ml-6">
                  <li>Their own delivery staff</li>

                  <li>Platform-arranged delivery (if available in future)</li>
                </ul>

                <p>Seller is responsible for safe and timely delivery.</p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  6. Commission Policy
                </h3>

                <p>The platform may charge:</p>

                <ul className="list-disc ml-6">
                  <li>Listing fees</li>
                  <li>Subscription fees</li>
                  <li>Per-order commission</li>
                  <li>Promotional charges</li>
                </ul>

                <p>Applicable charges will be informed beforehand.</p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  7. Delivery Confirmation System
                </h3>

                <p>To prevent disputes and commission fraud:</p>

                <p>Every delivered order must be marked completed using:</p>

                <ul className="list-disc ml-6">
                  <li>OTP verification</li>
                  <li>Customer confirmation button</li>
                  <li>Delivery code system</li>
                </ul>

                <p>
                  If seller fails to mark delivery properly, platform records
                  may still be considered valid proof.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  8. Fraud & Manipulation
                </h3>

                <p>Seller must not:</p>

                <ul className="list-disc ml-6">
                  <li>Ask customers to place orders outside the platform</li>

                  <li>Encourage customers to falsely deny delivery</li>

                  <li>Manipulate order status</li>

                  <li>Create fake orders</li>

                  <li>Avoid platform commission intentionally</li>
                </ul>

                <p>Violation may result in:</p>

                <ul className="list-disc ml-6">
                  <li>Penalties</li>
                  <li>Temporary suspension</li>
                  <li>Permanent removal from the platform</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  9. Quality Responsibility
                </h3>

                <p>Seller is solely responsible for:</p>

                <ul className="list-disc ml-6">
                  <li>Product freshness</li>

                  <li>Hygiene</li>

                  <li>Packaging</li>

                  <li>Product authenticity</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  10. Customer Complaints
                </h3>

                <p>Sellers must cooperate in resolving:</p>

                <ul className="list-disc ml-6">
                  <li>Missing items</li>
                  <li>Wrong products</li>
                  <li>Damaged goods</li>
                  <li>Refund disputes</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  11. Cancellation Policy
                </h3>

                <p>
                  Sellers should avoid unnecessary cancellations after accepting
                  orders.
                </p>

                <p>
                  Frequent cancellations may reduce seller visibility on the
                  platform.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black">
                  12. Platform Rights
                </h3>

                <p>The platform reserves the right to:</p>

                <ul className="list-disc ml-6">
                  <li>Remove product listings</li>

                  <li>Suspend sellers</li>

                  <li>Hold payments in suspicious cases</li>

                  <li>Modify commissions or policies with notice</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">13. Data & Privacy</h3>

                <p>Seller data will only be used for:</p>

                <ul className="list-disc ml-6">
                  <li>Platform operations</li>

                  <li>Order management</li>

                  <li>Customer support</li>

                  <li>Business analytics</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black">14. Termination</h3>

                <p>Either party may terminate the partnership.</p>

                <p>
                  Pending disputes or unpaid dues must be cleared before
                  closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
