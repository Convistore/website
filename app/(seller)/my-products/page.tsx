"use client";

import { useEffect, useMemo, useState } from "react";

import { db, auth } from "../../../lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { useRouter } from "next/navigation";

import imageCompression from "browser-image-compression";

const ITEMS_PER_PAGE = 7;

const CACHE_KEY = "seller_products_cache_v2";

const categories = [
  "All",
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

export default function MyProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // ALL PRODUCTS
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // PAGINATION
  const [visibleCount, setVisibleCount] =
    useState(ITEMS_PER_PAGE);

  // MODALS
  const [selectedProduct, setSelectedProduct] =
    useState<any>(null);

  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [productToDelete, setProductToDelete] =
    useState<any>(null);

  // FILTERS
  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState("All");

  // =========================================
  // FETCH PRODUCTS ONCE
  // =========================================
  const fetchProducts = async (uid: string) => {
    try {
      setLoading(true);

      // LOAD CACHE FIRST
      const cached =
        localStorage.getItem(CACHE_KEY);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          if (Array.isArray(parsed)) {
            setAllProducts(parsed);
          }
        } catch (err) {
          console.error(err);
        }
      }

      // FETCH ALL PRODUCTS
      const q = query(
        collection(db, "products"),
        where("sellerId", "==", uid)
      );

      const querySnapshot = await getDocs(q);

      const data: any[] = [];

      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // SORT CLIENT SIDE
      data.sort((a, b) =>
        (a.name || "").localeCompare(
          b.name || ""
        )
      );

      setAllProducts(data);

      // CACHE
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // AUTH
  // =========================================
  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            router.push("/login");
          } else {
            await fetchProducts(user.uid);
          }
        }
      );

    return () => unsubscribe();
  }, [router]);

  // =========================================
  // FILTER + SEARCH
  // =========================================
  const filteredProducts = useMemo(() => {
    let data = [...allProducts];

    // SEARCH
    if (search.trim()) {
      const term = search.toLowerCase();

      data = data.filter((product) => {
        return (
          product.name
            ?.toLowerCase()
            .includes(term) ||
          product.description
            ?.toLowerCase()
            .includes(term) ||
          product.category
            ?.toLowerCase()
            .includes(term) ||
          product.unit
            ?.toLowerCase()
            .includes(term)
        );
      });
    }

    // CATEGORY
    if (selectedCategory !== "All") {
      data = data.filter(
        (product) =>
          product.category ===
          selectedCategory
      );
    }

    // STATUS
    if (statusFilter !== "All") {
      data = data.filter((product) =>
        statusFilter === "Available"
          ? product.status?.isAvailable
          : !product.status?.isAvailable
      );
    }

    return data;
  }, [
    allProducts,
    search,
    selectedCategory,
    statusFilter,
  ]);

  // =========================================
  // PAGINATION
  // =========================================
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      0,
      visibleCount
    );
  }, [filteredProducts, visibleCount]);

  const hasMore =
    visibleCount < filteredProducts.length;

  // RESET PAGINATION ON FILTER CHANGE
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [
    search,
    selectedCategory,
    statusFilter,
  ]);

  // =========================================
  // DELETE IMAGEKIT IMAGE
  // =========================================
  const deleteImageFromImageKit =
    async (fileId: string) => {
      try {
        if (!fileId) return false;

        const response = await fetch(
          "/api/delete-imagekit-image",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              fileId,
            }),
          }
        );

        return response.ok;
      } catch (error) {
        console.error(error);
        return false;
      }
    };

  // =========================================
  // DELETE PRODUCT
  // =========================================
  const handleDelete = async () => {
    try {
      if (!productToDelete) return;

      await deleteDoc(
        doc(
          db,
          "products",
          productToDelete.id
        )
      );

      const updatedProducts =
        allProducts.filter(
          (item) =>
            item.id !== productToDelete.id
        );

      setAllProducts(updatedProducts);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(updatedProducts)
      );

      setShowDeleteModal(false);

      setProductToDelete(null);

      alert("✅ Product deleted");
    } catch (error) {
      console.error(error);
      alert("❌ Failed to delete");
    }
  };

  // =========================================
  // UPDATE PRODUCT
  // =========================================
  const handleUpdate = async () => {
    try {
      if (!selectedProduct) return;

      setSaving(true);

      await updateDoc(
        doc(
          db,
          "products",
          selectedProduct.id
        ),
        {
          name: selectedProduct.name,
          description:
            selectedProduct.description,
          category:
            selectedProduct.category,
          price: Number(
            selectedProduct.price
          ),
          stock: Number(
            selectedProduct.stock
          ),
          unit: selectedProduct.unit,
          images: selectedProduct.images,

          status: {
            isAvailable:
              Number(
                selectedProduct.stock
              ) > 0,
          },
        }
      );

      const updatedProducts =
        allProducts.map((item) =>
          item.id === selectedProduct.id
            ? selectedProduct
            : item
        );

      setAllProducts(updatedProducts);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(updatedProducts)
      );

      alert("✅ Product updated");

      setSelectedProduct(null);
    } catch (error) {
      console.error(error);
      alert("❌ Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================
  if (
    loading &&
    allProducts.length === 0
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-3 py-4 sm:p-5 overflow-x-hidden">

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

        <h1 className="text-2xl sm:text-3xl font-bold">
          My Products
        </h1>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="border rounded-xl px-4 py-2.5 bg-white w-full sm:w-64 text-sm sm:text-base"
          />

          {/* CATEGORY */}
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(
                e.target.value
              )
            }
            className="border rounded-xl px-4 py-2 bg-white text-sm sm:text-base"
          >
            {categories.map((cat) => (
              <option key={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-xl px-4 py-2 bg-white text-sm sm:text-base"
          >
            <option>All</option>
            <option>Available</option>
            <option>
              Out Of Stock
            </option>
          </select>

          {/* CLEAR FILTERS */}
          {(search ||
            selectedCategory !== "All" ||
            statusFilter !==
              "All") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory(
                  "All"
                );
                setStatusFilter("All");
              }}
              className="text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 bg-red-50 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* TOTAL */}
      <div className="mb-4 text-sm text-gray-500">
        Total Products:{" "}
        {filteredProducts.length}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow border">

        <table className="w-full min-w-[850px] lg:min-w-[1000px] text-sm">

          <thead className="bg-gray-100 text-left">

            <tr>
              <th className="p-4">
                Image
              </th>
              <th className="p-4">
                Name
              </th>
              <th className="p-4">
                Category
              </th>
              <th className="p-4">
                Price
              </th>
              <th className="p-4">
                Stock
              </th>
              <th className="p-4">
                Unit
              </th>
              <th className="p-4">
                Delivery
              </th>
              <th className="p-4">
                Status
              </th>
              <th className="p-4">
                Actions
              </th>
            </tr>

          </thead>

          <tbody>

            {paginatedProducts.map(
              (product) => (
                <tr
                  key={product.id}
                  className="border-t"
                >
                  <td className="p-3 sm:p-4 whitespace-nowrap">

                    <img
                      loading="lazy"
                      src={`${
                        typeof product
                          ?.images?.[0] ===
                        "string"
                          ? product
                              ?.images?.[0]
                          : product
                              ?.images?.[0]
                              ?.url
                      }?tr=w-300,h-300,q-60,f-webp`}
                      alt="product"
                      className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border shrink-0"
                    />

                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.name}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.category}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    ₹{product.price}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.stock}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.unit}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.delivery
                      ?.type === "free"
                      ? "Free"
                      : `₹${product.delivery?.charge}`}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {product.status
                      ?.isAvailable
                      ? "Available"
                      : "Out of Stock"}
                  </td>

                  <td className="p-3 sm:p-4 whitespace-nowrap">

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          setSelectedProduct(
                            product
                          )
                        }
                        className="bg-blue-500 text-white px-3 py-2 text-xs sm:text-sm rounded-lg whitespace-nowrap"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => {
                          setShowDeleteModal(
                            true
                          );

                          setProductToDelete(
                            product
                          );
                        }}
                        className="bg-red-500 text-white px-3 py-2 text-xs sm:text-sm rounded-lg whitespace-nowrap"
                      >
                        Delete
                      </button>

                    </div>

                  </td>
                </tr>
              )
            )}

            {paginatedProducts.length ===
              0 &&
              !loading && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center p-10 text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* LOAD MORE */}
      <div className="flex justify-center mt-6">

        <button
          disabled={!hasMore}
          onClick={() =>
            setVisibleCount(
              (prev) =>
                prev +
                ITEMS_PER_PAGE
            )
          }
          className="px-5 py-2 rounded-xl border bg-white disabled:opacity-50"
        >
          {hasMore
            ? "Load More"
            : "No More Products"}
        </button>

      </div>

      {/* EDIT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">

          <div className="bg-white w-full max-w-2xl rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">

              <h2 className="text-xl sm:text-2xl font-bold">
                Edit Product
              </h2>

              <button
                onClick={() =>
                  setSelectedProduct(
                    null
                  )
                }
                className="text-xl"
              >
                ✕
              </button>

            </div>

            <div className="space-y-4">

              <input
                value={
                  selectedProduct.name
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    name:
                      e.target.value,
                  })
                }
                placeholder="Product Name"
                className="w-full border rounded-xl px-3 py-2"
              />

              <textarea
                value={
                  selectedProduct.description
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    description:
                      e.target.value,
                  })
                }
                placeholder="Description"
                className="w-full border rounded-xl px-3 py-2"
              />

              <select
                value={
                  selectedProduct.category
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    category:
                      e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                {categories
                  .filter(
                    (cat) =>
                      cat !== "All"
                  )
                  .map((cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  ))}
              </select>

              <input
                type="number"
                value={
                  selectedProduct.price
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    price:
                      e.target.value,
                  })
                }
                placeholder="Price"
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                value={
                  selectedProduct.stock
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    stock:
                      e.target.value,
                  })
                }
                placeholder="Stock"
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                value={
                  selectedProduct.unit
                }
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    unit:
                      e.target.value,
                  })
                }
                placeholder="Unit"
                className="w-full border rounded-xl px-3 py-2"
              />

              {/* IMAGE UPLOAD */}
              <div>

                <p className="font-semibold mb-3">
                  Product Images
                </p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    try {
                      const files =
                        e.target.files;

                      if (!files) return;

                      const uploadedUrls:
                        {
                          url: string;
                          fileId: string;
                        }[] = [];

                      for (const file of Array.from(
                        files
                      )) {
                        const compressedFile =
                          await imageCompression(
                            file,
                            {
                              maxSizeMB:
                                0.3,
                              maxWidthOrHeight:
                                1280,
                              useWebWorker:
                                true,
                            }
                          );

                        const authRes =
                          await fetch(
                            "/api/imagekit-auth"
                          );

                        const authData =
                          await authRes.json();

                        const formData =
                          new FormData();

                        formData.append(
                          "file",
                          compressedFile
                        );

                        formData.append(
                          "fileName",
                          `${Date.now()}-${compressedFile.name}`
                        );

                        formData.append(
                          "folder",
                          "/products"
                        );

                        formData.append(
                          "publicKey",
                          process.env
                            .NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY ||
                            ""
                        );

                        formData.append(
                          "signature",
                          authData.signature
                        );

                        formData.append(
                          "expire",
                          authData.expire
                        );

                        formData.append(
                          "token",
                          authData.token
                        );

                        const uploadRes =
                          await fetch(
                            "https://upload.imagekit.io/api/v1/files/upload",
                            {
                              method:
                                "POST",
                              body:
                                formData,
                            }
                          );

                        const data =
                          await uploadRes.json();

                        if (data.url) {
                          uploadedUrls.push(
                            {
                              url:
                                data.url,
                              fileId:
                                data.fileId,
                            }
                          );
                        }
                      }

                      setSelectedProduct({
                        ...selectedProduct,
                        images: [
                          ...selectedProduct.images,
                          ...uploadedUrls,
                        ],
                      });
                    } catch (error) {
                      console.error(
                        error
                      );

                      alert(
                        "Failed to upload images"
                      );
                    }
                  }}
                  className="mb-4"
                />

                <div className="grid grid-cols-2 gap-3">

                  {selectedProduct?.images?.map(
                    (
                      image: any,
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="relative"
                      >
                        <img
                          loading="lazy"
                          src={`${
                            typeof image ===
                            "string"
                              ? image
                              : image?.url
                          }?tr=w-500,h-500,q-70,f-webp`}
                          alt="product"
                          className="w-full h-24 sm:h-32 object-cover rounded-xl border"
                        />

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const imageToDelete =
                                selectedProduct
                                  .images[
                                  index
                                ];

                              if (
                                typeof imageToDelete !==
                                  "string" &&
                                imageToDelete?.fileId
                              ) {
                                const deleted =
                                  await deleteImageFromImageKit(
                                    imageToDelete.fileId
                                  );

                                if (
                                  !deleted
                                ) {
                                  alert(
                                    "Failed to delete image"
                                  );

                                  return;
                                }
                              }

                              const updatedImages =
                                selectedProduct.images.filter(
                                  (
                                    _: any,
                                    i: number
                                  ) =>
                                    i !==
                                    index
                                );

                              setSelectedProduct(
                                {
                                  ...selectedProduct,
                                  images:
                                    updatedImages,
                                }
                              );

                              alert(
                                "✅ Image removed"
                              );
                            } catch (error) {
                              console.error(
                                error
                              );

                              alert(
                                "❌ Failed to remove image"
                              );
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  )}

                </div>

              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full bg-[#2EE6A6] py-3 rounded-xl font-semibold"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-sm">

            <h2 className="text-xl font-bold mb-3">
              Delete Product?
            </h2>

            <p className="text-gray-600 mb-5">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">

              <button
                onClick={() => {
                  setShowDeleteModal(
                    false
                  );

                  setProductToDelete(
                    null
                  );
                }}
                className="flex-1 border py-2 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl"
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}