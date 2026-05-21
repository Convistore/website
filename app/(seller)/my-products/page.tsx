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
  limit,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";

import { useRouter } from "next/navigation";

import imageCompression from "browser-image-compression";

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

const ITEMS_PER_PAGE = 7;

export default function MyProductsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<any[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [productToDelete, setProductToDelete] = useState<any>(null);

  // SEARCH + FILTER
  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [statusFilter, setStatusFilter] = useState("All");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  // =========================
  // FETCH PRODUCTS
  // =========================

  const fetchProducts = async (uid: string) => {
    try {
      // CACHE FIRST
      const cached = localStorage.getItem("seller_products");

      if (cached) {
        setProducts(JSON.parse(cached));
      }

      const q = query(
        collection(db, "products"),
        where("sellerId", "==", uid),
        limit(10),
      );

      const querySnapshot = await getDocs(q);

      const data: any[] = [];

      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setProducts(data);

      localStorage.setItem("seller_products", JSON.stringify(data));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // AUTH
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchProducts(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // =========================
  // FILTERED PRODUCTS
  // =========================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(search.toLowerCase()) ||
        product.category?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Available"
            ? product.status?.isAvailable
            : !product.status?.isAvailable;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, search, selectedCategory, statusFilter]);

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // =========================
  // DELETE PRODUCT
  // =========================

  const handleDelete = async () => {
    try {
      if (!productToDelete) return;

      await deleteDoc(doc(db, "products", productToDelete.id));

      const updatedProducts = products.filter(
        (item) => item.id !== productToDelete.id,
      );

      setProducts(updatedProducts);

      localStorage.setItem("seller_products", JSON.stringify(updatedProducts));

      setShowDeleteModal(false);

      setProductToDelete(null);

      alert("✅ Product deleted");
    } catch (error) {
      console.error(error);

      alert("❌ Failed to delete");
    }
  };

  // =========================
// DELETE IMAGEKIT IMAGE
// =========================

const deleteImageFromImageKit = async (
  fileId: string,
) => {
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
      },
    );

    return response.ok;
  } catch (error) {
    console.error(error);

    return false;
  }
};
  // =========================
  // UPDATE PRODUCT
  // =========================

  const handleUpdate = async () => {
    try {
      if (!selectedProduct) return;

      setSaving(true);

      await updateDoc(doc(db, "products", selectedProduct.id), {
        name: selectedProduct.name,

        description: selectedProduct.description,

        category: selectedProduct.category,

        price: Number(selectedProduct.price),

        stock: Number(selectedProduct.stock),

        unit: selectedProduct.unit,

        images: selectedProduct.images,

    

        status: {
          isAvailable: Number(selectedProduct.stock) > 0,
        },
      });

      const updatedProducts = products.map((item) =>
        item.id === selectedProduct.id ? selectedProduct : item,
      );

      setProducts(updatedProducts);

      localStorage.setItem("seller_products", JSON.stringify(updatedProducts));

      alert("✅ Product updated");

      setSelectedProduct(null);
    } catch (error) {
      console.error(error);

      alert("❌ Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-5">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <h1 className="text-3xl font-bold">My Products</h1>

        <div className="flex flex-col md:flex-row gap-3">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-2 bg-white"
          />

          {/* CATEGORY FILTER */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-2 bg-white"
          >
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-xl px-4 py-2 bg-white"
          >
            <option>All</option>
            <option>Available</option>
            <option>Out Of Stock</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Unit</th>
              <th className="p-4">Delivery</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="p-4">
                  <img
                    loading="lazy"
                   src={`${
  typeof product?.images?.[0] === "string"
    ? product?.images?.[0]
    : product?.images?.[0]?.url
}?tr=w-300,h-300,q-60,f-webp`}
                    alt="product"
                    className="w-16 h-16 object-cover rounded-xl border"
                  />
                </td>

                <td className="p-4 font-medium">{product.name}</td>

                <td className="p-4">{product.category}</td>

                <td className="p-4">₹{product.price}</td>

                <td className="p-4">{product.stock}</td>

                <td className="p-4">{product.unit}</td>

                <td className="p-4">
                  {product.delivery?.type === "free"
                    ? "Free"
                    : `₹${product.delivery?.charge}`}
                </td>

                <td className="p-4">
                  {product.status?.isAvailable ? "Available" : "Out of Stock"}
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setProductToDelete(product);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center p-10 text-gray-500">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
        >
          Back
        </button>

        <div className="font-medium">
          Page {currentPage} of {totalPages || 1}
        </div>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* EDIT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold">Edit Product</h2>

              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={selectedProduct.name}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    name: e.target.value,
                  })
                }
                placeholder="Product Name"
                className="w-full border rounded-xl px-3 py-2"
              />

              <textarea
                value={selectedProduct.description}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    description: e.target.value,
                  })
                }
                placeholder="Description"
                className="w-full border rounded-xl px-3 py-2"
              />

              <select
                value={selectedProduct.category}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    category: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-3 py-2"
              >
                {categories
                  .filter((cat) => cat !== "All")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>

              <input
                type="number"
                value={selectedProduct.price}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    price: e.target.value,
                  })
                }
                placeholder="Price"
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                type="number"
                value={selectedProduct.stock}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    stock: e.target.value,
                  })
                }
                placeholder="Stock"
                className="w-full border rounded-xl px-3 py-2"
              />

              <input
                value={selectedProduct.unit}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    unit: e.target.value,
                  })
                }
                placeholder="Unit"
                className="w-full border rounded-xl px-3 py-2"
              />

              {/* DELIVERY */}
              {/* <div className="border rounded-xl p-4 space-y-3">
                <p className="font-semibold">Delivery</p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct({
                        ...selectedProduct,
                        delivery: {
                          type: "free",
                          charge: 0,
                        },
                      })
                    }
                    className={`flex-1 py-2 rounded-lg border ${
                      selectedProduct.delivery?.type === "free"
                        ? "bg-black text-white"
                        : ""
                    }`}
                  >
                    Free Delivery
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct({
                        ...selectedProduct,
                        delivery: {
                          type: "paid",
                          charge: selectedProduct.delivery?.charge || 0,
                        },
                      })
                    }
                    className={`flex-1 py-2 rounded-lg border ${
                      selectedProduct.delivery?.type === "paid"
                        ? "bg-black text-white"
                        : ""
                    }`}
                  >
                    Paid Delivery
                  </button>
                </div>

                {selectedProduct.delivery?.type === "paid" && (
                  <input
                    type="number"
                    value={selectedProduct.delivery?.charge}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        delivery: {
                          type: "paid",
                          charge: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="Delivery Charge"
                    className="w-full border rounded-xl px-3 py-2"
                  />
                )}
              </div> */}

              {/* IMAGES */}
              <div>
                <p className="font-semibold mb-3">Product Images</p>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    try {
                      const files = e.target.files;

                      if (!files) return;

                      const uploadedUrls: {
  url: string;
  fileId: string;
}[] = [];

                      for (const file of Array.from(files)) {
                        const compressedFile = await imageCompression(file, {
                          maxSizeMB: 0.3,
                          maxWidthOrHeight: 1280,
                          useWebWorker: true,
                        });

                        const authRes = await fetch("/api/imagekit-auth");

                        const authData = await authRes.json();

                        const formData = new FormData();

                        formData.append("file", compressedFile);

                        formData.append(
                          "fileName",
                          `${Date.now()}-${compressedFile.name}`,
                        );

                        formData.append("folder", "/products");

                        formData.append(
                          "publicKey",
                          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
                        );

                        formData.append("signature", authData.signature);

                        formData.append("expire", authData.expire);

                        formData.append("token", authData.token);

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

                      setSelectedProduct({
                        ...selectedProduct,
                        images: [...selectedProduct.images, ...uploadedUrls],
                      });
                    } catch (error) {
                      console.error(error);

                      alert("Failed to upload images");
                    }
                  }}
                  className="mb-4"
                />

                <div className="grid grid-cols-2 gap-3">
                  {selectedProduct?.images?.map(
                   (image: any, index: number) => (
                      <div key={index} className="relative">
                        <img
                          loading="lazy"
                          src={`${
  typeof image === "string"
    ? image
    : image?.url
}?tr=w-500,h-500,q-70,f-webp`}
                          alt="product"
                          className="w-full h-32 object-cover rounded-xl border"
                        />

                        <button
  type="button"
  onClick={async () => {
    try {
      const imageToDelete =
        selectedProduct.images[index];

      // =========================
      // DELETE FROM IMAGEKIT
      // =========================

      if (
        typeof imageToDelete !==
          "string" &&
        imageToDelete?.fileId
      ) {
        const deleted =
          await deleteImageFromImageKit(
            imageToDelete.fileId,
          );

        if (!deleted) {
          alert(
            "Failed to delete image",
          );

          return;
        }
      }

      // =========================
      // REMOVE FROM STATE
      // =========================

      const updatedImages =
        selectedProduct.images.filter(
          (_: any, i: number) =>
            i !== index,
        );

      setSelectedProduct({
        ...selectedProduct,

        images: updatedImages,
      });

      alert(
        "✅ Image removed",
      );
    } catch (error) {
      console.error(error);

      alert(
        "❌ Failed to remove image",
      );
    }
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

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="w-full bg-[#2EE6A6] py-3 rounded-xl font-semibold"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-3">Delete Product?</h2>

            <p className="text-gray-600 mb-5">This action cannot be undone.</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
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
