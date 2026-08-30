"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSellerStore } from "../../../lib/store/sellerStore";

export default function SellerAccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [uploadingShop, setUploadingShop] = useState(false);
  const [uploadingSeller, setUploadingSeller] = useState(false);

  const { seller, setSeller, lastFetched } = useSellerStore();
const [editingAddress, setEditingAddress] = useState(false);

const [addressData, setAddressData] = useState({
  address: seller?.location?.address || "",
  landmark: seller?.location?.landmark || "",
  city: seller?.location?.city || "",
  state: seller?.location?.state || "",
  pincode: seller?.location?.pincode || "",
});
  // =========================
  // CACHE TIME
  // =========================

  const CACHE_DURATION = 1000 * 60 * 10;

  // =========================
  // FETCH SELLER
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const now = Date.now();

        const isCacheValid =
          seller && lastFetched && now - lastFetched < CACHE_DURATION;

        // =========================
        // USE CACHE
        // =========================

        if (isCacheValid) {
          console.log("Using cached seller data");
          setLoading(false);
          return;
        }

        // =========================
        // FETCH FIRESTORE
        // =========================

        console.log("Fetching seller from Firestore");

        const sellerRef = doc(db, "sellers", user.uid);

        const sellerSnap = await getDoc(sellerRef);

        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, seller, lastFetched, setSeller]);
  useEffect(() => {
  if (seller?.location) {
    setAddressData({
      address: seller.location.address || "",
      landmark: seller.location.landmark || "",
      city: seller.location.city || "",
      state: seller.location.state || "",
      pincode: seller.location.pincode || "",
    });
  }
}, [seller]);
const updateAddress = async () => {
  try {
    const user = auth.currentUser;

    if (!user) return;

    await updateDoc(doc(db, "sellers", user.uid), {
      location: addressData,
    });

    setSeller({
      ...seller,
      location: addressData,
    });

    setEditingAddress(false);

    alert("Address updated successfully");
  } catch (error) {
    console.error(error);
    alert("Failed to update address");
  }
};
  // =========================
  // DELETE IMAGEKIT IMAGE
  // =========================

  const deleteImageFromImageKit = async (fileId: string) => {
    try {
      if (!fileId) return false;

      const response = await fetch("/api/delete-imagekit-image", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          fileId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  // =========================
  // UPDATE IMAGE
  // =========================

  const updateImage = async (
    file: File,
    type: "shop" | "seller",
  ) => {
    try {
      // =========================
      // START LOADING
      // =========================

      if (type === "shop") {
        setUploadingShop(true);
      } else {
        setUploadingSeller(true);
      }

      // =========================
      // VALIDATE FILE
      // =========================

      if (!file.type.startsWith("image/")) {
        alert("Only image files are allowed");
        return;
      }

      // =========================
      // LIMIT SIZE
      // =========================

      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be below 5MB");
        return;
      }

      // =========================
      // OLD FILE ID
      // =========================

      const oldFileId =
        type === "shop"
          ? seller?.shopImage?.fileId
          : seller?.sellerImage?.fileId;

      // =========================
      // DELETE OLD IMAGE FIRST
      // =========================

      if (oldFileId) {
        const deleted = await deleteImageFromImageKit(oldFileId);

        if (!deleted) {
          throw new Error("Old image deletion failed");
        }
      }

      // =========================
      // GET IMAGEKIT AUTH
      // =========================

      const authRes = await fetch("/api/imagekit-auth");

      if (!authRes.ok) {
        throw new Error("Failed to get ImageKit auth");
      }

      const authData = await authRes.json();

      // =========================
      // COMPRESS IMAGE
      // =========================

      const compressedFile = file;

      // Later:
      // browser-image-compression

      // =========================
      // FORM DATA
      // =========================

      const formData = new FormData();

      formData.append("file", compressedFile);

      formData.append(
        "fileName",
        `${Date.now()}-${file.name}`,
      );

      formData.append("folder", "/sellers");

      formData.append(
        "publicKey",
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
      );

      formData.append("signature", authData.signature);

      formData.append("expire", authData.expire);

      formData.append("token", authData.token);

      // =========================
      // UPLOAD IMAGE
      // =========================

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadRes.json();

      // =========================
      // VALIDATE UPLOAD
      // =========================

      if (!uploadRes.ok || !uploadData.url) {
        throw new Error("Image upload failed");
      }

      // =========================
      // AUTH USER
      // =========================

      const user = auth.currentUser;

      if (!user) {
        throw new Error("User not found");
      }

      // =========================
      // NEW IMAGE DATA
      // =========================

      const imageData = {
        url: uploadData.url,
        fileId: uploadData.fileId,
      };

      // =========================
      // UPDATE FIRESTORE
      // =========================

      await updateDoc(
        doc(db, "sellers", user.uid),
        type === "shop"
          ? {
              shopImage: imageData,
            }
          : {
              sellerImage: imageData,
            },
      );

      // =========================
      // UPDATE LOCAL CACHE
      // =========================

      setSeller({
        ...seller,

        ...(type === "shop"
          ? {
              shopImage: imageData,
            }
          : {
              sellerImage: imageData,
            }),
      });

      // =========================
      // SUCCESS
      // =========================

      alert(
        `${
          type === "shop"
            ? "Shop"
            : "Seller"
        } image updated successfully`,
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update image",
      );
    } finally {
      // =========================
      // STOP LOADING
      // =========================

      setUploadingShop(false);
      setUploadingSeller(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-5">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0F172A]">
            Seller Account
          </h1>

        
        </div>

        {/* TOP SECTION */}
        <div className="grid md:grid-cols-3 gap-5 mb-5">
          {/* SHOP CARD */}
          <div className="bg-white rounded-3xl shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                Shop Image
              </p>

              <label className="cursor-pointer text-sm bg-black text-white px-3 py-1 rounded-lg">
                {uploadingShop
                  ? "Uploading..."
                  : "Change"}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingShop}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      updateImage(file, "shop");
                    }
                  }}
                />
              </label>
            </div>

            <img
              src={`${seller?.shopImage?.url}?tr=w-600,h-400,q-70,f-webp`}
              alt="shop"
              loading="lazy"
              className="w-full h-52 object-cover rounded-2xl border"
            />

            {uploadingShop && (
              <p className="text-sm mt-2">
                Updating image...
              </p>
            )}

            <div className="mt-4">
              <h2 className="text-2xl font-bold">
                {seller?.shopName}
              </h2>

              <p className="text-gray-500 mt-1">
                Seller ID: {seller?.sellerId}
              </p>
            </div>
          </div>

          {/* OWNER CARD */}
          <div className="bg-white rounded-3xl shadow p-5 flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full mb-3">
              <p className="text-sm text-gray-500">
                Seller Profile
              </p>

              <label className="cursor-pointer text-sm bg-black text-white px-3 py-1 rounded-lg">
                {uploadingSeller
                  ? "Uploading..."
                  : "Change"}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploadingSeller}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      updateImage(file, "seller");
                    }
                  }}
                />
              </label>
            </div>

            <img
              src={`${seller?.sellerImage?.url}?tr=w-300,h-300,q-70,f-webp`}
              alt="seller"
              loading="lazy"
              className="w-32 h-32 rounded-full object-cover border"
            />

            {uploadingSeller && (
              <p className="text-sm mt-2">
                Updating image...
              </p>
            )}

            <h2 className="text-2xl font-bold mt-4">
              {seller?.sellerName}
            </h2>

            <p className="text-gray-500 mt-1">
              Store Owner
            </p>
          </div>

          {/* STATUS CARD */}
          <div className="bg-white rounded-3xl shadow p-5">
            <p className="text-sm text-gray-500 mb-5">
              Account Status
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Store Status
                </span>

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {seller?.status || "Open"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  Account Type
                </span>

                <span className="font-semibold">
                  Seller
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* CONTACT */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-5">
              Contact Details
            </h2>

            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Phone
                </p>

                <p className="text-lg font-semibold">
                  {seller?.phone}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">
                  Email
                </p>

                <p className="text-lg font-semibold break-all">
                  {seller?.email}
                </p>
              </div>
            </div>
          </div>

          {/* LOCATION */}
         <div className="bg-white rounded-3xl shadow p-6">
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-2xl font-bold">
      Store Location
    </h2>

    {!editingAddress ? (
      <button
        onClick={() => setEditingAddress(true)}
        className="px-4 py-2 rounded-xl bg-black text-white"
      >
        Edit
      </button>
    ) : (
      <button
        onClick={updateAddress}
        className="px-4 py-2 rounded-xl bg-green-600 text-white"
      >
        Save
      </button>
    )}
  </div>

  {editingAddress ? (
    <div className="space-y-4">
      <input
        className="w-full border rounded-xl p-3"
        placeholder="Full Address"
        value={addressData.address}
        onChange={(e) =>
          setAddressData({
            ...addressData,
            address: e.target.value,
          })
        }
      />

      <input
        className="w-full border rounded-xl p-3"
        placeholder="Landmark"
        value={addressData.landmark}
        onChange={(e) =>
          setAddressData({
            ...addressData,
            landmark: e.target.value,
          })
        }
      />

      <input
        className="w-full border rounded-xl p-3"
        placeholder="City"
        value={addressData.city}
        onChange={(e) =>
          setAddressData({
            ...addressData,
            city: e.target.value,
          })
        }
      />

      <input
        className="w-full border rounded-xl p-3"
        placeholder="State"
        value={addressData.state}
        onChange={(e) =>
          setAddressData({
            ...addressData,
            state: e.target.value,
          })
        }
      />

      <input
        className="w-full border rounded-xl p-3"
        placeholder="Pincode"
        value={addressData.pincode}
        onChange={(e) =>
          setAddressData({
            ...addressData,
            pincode: e.target.value,
          })
        }
      />
    </div>
  ) : (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-gray-500">
          Address
        </p>
        <p className="font-semibold">
          {seller?.location?.address}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          Landmark
        </p>
        <p className="font-semibold">
          {seller?.location?.landmark || "-"}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          City
        </p>
        <p className="font-semibold">
          {seller?.location?.city || "-"}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          State
        </p>
        <p className="font-semibold">
          {seller?.location?.state || "-"}
        </p>
      </div>

      <div>
        <p className="text-sm text-gray-500">
          Pincode
        </p>
        <p className="font-semibold">
          {seller?.location?.pincode}
        </p>
      </div>
    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
}