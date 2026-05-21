"use client";

import { useState, useEffect } from "react";

import { db, auth } from "../../../lib/firebase";

import {
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

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

  const [loading, setLoading] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [savingDelivery, setSavingDelivery] =
    useState(false);

  const [categorySearch, setCategorySearch] =
    useState("");

  const [showCategories, setShowCategories] =
    useState(false);

  // =========================
  // DELIVERY SETTINGS
  // =========================

 const [deliverySettings, setDeliverySettings] =
  useState({
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
    const unsubscribe =
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push("/login");

          return;
        }

        try {
          // =========================
          // CACHE FIRST
          // =========================

          const cachedDelivery =
            localStorage.getItem(
              `delivery_settings_${user.uid}`,
            );

          if (cachedDelivery) {
            setDeliverySettings(
              JSON.parse(cachedDelivery),
            );
          }

          // =========================
          // FETCH SELLER SETTINGS
          // =========================

          const sellerRef = doc(
            db,
            "sellers",
            user.uid,
          );

          const sellerSnap =
            await getDoc(sellerRef);

          if (sellerSnap.exists()) {
            const data =
              sellerSnap.data();

            if (data.deliverySettings) {
              setDeliverySettings({
  standard: {
    enabled:
      data?.deliverySettings?.standard
        ?.enabled ?? true,

    charge: String(
      data?.deliverySettings?.standard
        ?.charge ?? 0,
    ),
  },

  fast: {
    enabled:
      data?.deliverySettings?.fast
        ?.enabled ?? false,

    charge: String(
      data?.deliverySettings?.fast
        ?.charge ?? "",
    ),
  },
});

              localStorage.setItem(
                `delivery_settings_${user.uid}`,
                JSON.stringify(
                  data.deliverySettings,
                ),
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

  const uploadImages = async (
    files: FileList,
  ) => {
    try {
      if (
        form.images.length + files.length >
        5
      ) {
        alert(
          "Maximum 5 images allowed",
        );

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

        if (
          !file.type.startsWith(
            "image/",
          )
        ) {
          alert(
            "Only image files allowed",
          );

          continue;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          alert(
            "Image must be below 5MB",
          );

          continue;
        }

        // =========================
        // COMPRESS
        // =========================

        const compressedFile =
          await imageCompression(file, {
            maxSizeMB: 0.3,

            maxWidthOrHeight: 1280,

            useWebWorker: true,
          });

        // =========================
        // AUTH
        // =========================

        const authRes = await fetch(
          "/api/imagekit-auth",
        );

        const authData =
          await authRes.json();

        // =========================
        // FORM DATA
        // =========================

        const formData =
          new FormData();

        formData.append(
          "file",
          compressedFile,
        );

        formData.append(
          "fileName",
          `${Date.now()}-${
            compressedFile.name
          }`,
        );

        formData.append(
          "folder",
          "/products",
        );

        formData.append(
          "publicKey",
          process.env
            .NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
            "",
        );

        formData.append(
          "signature",
          authData.signature,
        );

        formData.append(
          "expire",
          authData.expire,
        );

        formData.append(
          "token",
          authData.token,
        );

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

        const data =
          await uploadRes.json();

        if (data.url) {
          uploadedUrls.push({
            url: data.url,

            fileId: data.fileId,
          });
        }
      }

      setForm((prev) => ({
        ...prev,

        images: [
          ...prev.images,

          ...uploadedUrls,
        ],
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

  const saveDeliverySettings =
    async () => {
      try {
        setSavingDelivery(true);

        const user =
          auth.currentUser;

        if (!user) return;

        const optimizedSettings = {
          standard: {
            enabled:
             deliverySettings?.standard?.enabled,

            charge:
              deliverySettings?.standard?.enabled
                ? Number(
                    deliverySettings
                      .standard.charge,
                  ) || 0
                : 0,
          },

          fast: {
            enabled:
            deliverySettings?.fast?.enabled,

            charge:
                    deliverySettings?.fast?.enabled
                ? Number(
                    deliverySettings?.fast?.charge,
                  ) || 0
                : 0,
          },
        };

        // =========================
        // UPDATE ONLY DELIVERY FIELD
        // =========================

        await updateDoc(
          doc(
            db,
            "sellers",
            user.uid,
          ),
          {
            deliverySettings:
              optimizedSettings,
          },
        );

        // =========================
        // CACHE
        // =========================

        localStorage.setItem(
          `delivery_settings_${user.uid}`,
          JSON.stringify(
            optimizedSettings,
          ),
        );

        alert(
          "✅ Delivery settings updated",
        );
      } catch (error) {
        console.error(error);

        alert(
          "❌ Failed to update delivery settings",
        );
      } finally {
        setSavingDelivery(false);
      }
    };

  // =========================
  // SUBMIT PRODUCT
  // =========================

  const handleSubmit = async (
    e: any,
  ) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.price ||
      !form.category
    ) {
      alert(
        "Please fill required fields",
      );

      return;
    }

    try {
      setLoading(true);

      const user =
        auth.currentUser;

      if (!user) {
        alert(
          "You must login first",
        );

        return;
      }

      const productId = `prod_${Date.now()}`;

      // =========================
      // SAVE PRODUCT
      // =========================

      await setDoc(
        doc(
          db,
          "products",
          productId,
        ),
        {
          productId,

          sellerId: user.uid,

          name: form.name.trim(),

          description:
            form.description.trim(),

          category:
            form.category.trim(),

          price: Number(
            form.price,
          ),

          stock: Math.max(
            0,
            Number(form.stock),
          ),

          unit: form.unit.trim(),

          images: form.images,

          status: {
            isAvailable:
              Number(form.stock) > 0,
          },

          createdAt:
            Timestamp.now(),
        },
      );

      alert(
        "✅ Product added successfully",
      );

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

      alert(
        "❌ Error adding product",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FILTERED CATEGORIES
  // =========================

  const filteredCategories =
    categories.filter((cat) =>
      cat
        .toLowerCase()
        .includes(
          categorySearch.toLowerCase(),
        ),
    );

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">
          Checking
          authentication...
        </p>
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

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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

                  description:
                    e.target.value,
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
                  const value =
                    e.target.value;

                  setCategorySearch(
                    value,
                  );

                  setShowCategories(
                    true,
                  );

                  setForm({
                    ...form,

                    category: value,
                  });
                }}
                className="w-full border rounded-lg px-3 py-2 outline-none"
              />

              {showCategories &&
                filteredCategories.length >
                  0 && (
                  <div className="absolute z-20 bg-white border rounded-xl mt-1 w-full max-h-52 overflow-y-auto shadow">
                    {filteredCategories.map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm({
                              ...form,

                              category:
                                cat,
                            });

                            setCategorySearch(
                              cat,
                            );

                            setShowCategories(
                              false,
                            );
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          {cat}
                        </button>
                      ),
                    )}
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
                  if (
                    e.target.files
                  ) {
                    uploadImages(
                      e.target.files,
                    );
                  }
                }}
              />

              {uploading && (
                <p className="text-sm mt-2">
                  Compressing &
                  Uploading...
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                {form.images.map(
                  (img, index) => (
                    <div
                      key={index}
                      className="relative"
                    >
                      <img
                        loading="lazy"
                        src={`${img.url}?tr=w-400,h-400,q-60,f-webp`}
                        alt="product"
                        className="w-full h-32 object-cover rounded-xl border"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updatedImages =
                            form.images.filter(
                              (
                                _,
                                i,
                              ) =>
                                i !==
                                index,
                            );

                          setForm({
                            ...form,

                            images:
                              updatedImages,
                          });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full"
                      >
                        ✕
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={
                loading ||
                uploading
              }
              className="w-full bg-[#2EE6A6] text-[#0F172A] py-3 rounded-xl font-semibold"
            >
              {loading
                ? "Adding Product..."
                : "Add Product"}
            </button>
          </form>
        </div>

        {/* ========================= */}
        {/* DELIVERY SETTINGS */}
        {/* ========================= */}

        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-5">
            Delivery Settings
          </h2>

          <div className="space-y-5">
            {/* STANDARD */}
            <div className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Standard Delivery
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setDeliverySettings(
                      (prev) => ({
                        ...prev,

                        standard: {
                          ...prev.standard,

                          enabled:
                            !prev
                              .standard
                              .enabled,
                        },
                      }),
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    deliverySettings
                      .standard
                      .enabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {deliverySettings
                    .standard.enabled
                    ? "Enabled"
                    : "Disabled"}
                </button>
              </div>

              {deliverySettings.standard
                .enabled && (
                <input
                  type="number"
                  placeholder="Standard delivery charge"
                  value={
                    deliverySettings
                      .standard.charge
                  }
                  onChange={(e) =>
                    setDeliverySettings(
                      (prev) => ({
                        ...prev,

                        standard: {
                          ...prev.standard,

                          charge:
                            e.target.value,
                        },
                      }),
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </div>

            {/* FAST */}
            <div className="border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  Fast Delivery
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setDeliverySettings(
                      (prev) => ({
                        ...prev,

                        fast: {
                          ...prev.fast,

                          enabled:
                            !prev.fast
                              .enabled,
                        },
                      }),
                    )
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    deliverySettings
                      .fast.enabled
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {deliverySettings
                    .fast.enabled
                    ? "Enabled"
                    : "Disabled"}
                </button>
              </div>

              {deliverySettings.fast
                .enabled && (
                <input
                  type="number"
                  placeholder="Fast delivery charge"
                  value={
                    deliverySettings
                      .fast.charge
                  }
                  onChange={(e) =>
                    setDeliverySettings(
                      (prev) => ({
                        ...prev,

                        fast: {
                          ...prev.fast,

                          charge:
                            e.target.value,
                        },
                      }),
                    )
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              )}
            </div>

            {/* SAVE */}
            <button
              type="button"
              onClick={
                saveDeliverySettings
              }
              disabled={
                savingDelivery
              }
              className="w-full bg-black text-white py-3 rounded-xl font-semibold"
            >
              {savingDelivery
                ? "Saving..."
                : "Update Delivery Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}