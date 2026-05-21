"use client";

import { useState } from "react";

import {
  auth,
  db,
} from "../../lib/firebase";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [uploadingShop, setUploadingShop] =
    useState(false);

  const [uploadingSeller, setUploadingSeller] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    showManualAddress,
    setShowManualAddress,
  ] = useState(false);

  const [form, setForm] =
    useState({
      shopName: "",

      sellerName: "",

      phone: "+91 ",

      email: "",

      password: "",

      confirmPassword: "",

      shopImage: "",

      sellerImage: "",

      address: "",

      fullAddress: "",

      landmark: "",

      state: "",

      pincode: "",

      latitude: "",

      longitude: "",
    });

  // =========================
  // TOGGLE MANUAL ADDRESS
  // =========================

  const toggleManualAddress =
    () => {
      const nextState =
        !showManualAddress;

      setShowManualAddress(
        nextState
      );

      if (nextState) {
        setForm((prev) => ({
          ...prev,

          address: "",

          latitude: "",

          longitude: "",

          fullAddress: "",

          landmark: "",

          state: "",

          pincode: "",
        }));
      }
    };

  // =========================
  // IMAGEKIT UPLOAD
  // =========================

  const uploadToImageKit =
    async (
      file: File,
      type:
        | "shop"
        | "seller"
    ) => {
      try {
        if (type === "shop") {
          setUploadingShop(
            true
          );
        } else {
          setUploadingSeller(
            true
          );
        }

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
          file
        );

        formData.append(
          "fileName",
          `${Date.now()}-${file.name}`
        );

        formData.append(
          "folder",
          "/sellers"
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
              method: "POST",
              body: formData,
            }
          );

        const data =
          await uploadRes.json();

        if (!data.url) {
          alert(
            "Upload failed"
          );

          return;
        }

        if (type === "shop") {
          setForm((prev) => ({
            ...prev,
            shopImage:
              data.url,
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            sellerImage:
              data.url,
          }));
        }

      } catch (error) {
        console.error(
          error
        );

        alert(
          "Image upload failed"
        );

      } finally {
        setUploadingShop(
          false
        );

        setUploadingSeller(
          false
        );
      }
    };

  // =========================
  // GET LOCATION
  // =========================

  const getCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        alert(
          "Geolocation not supported"
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (
          position
        ) => {
          const lat =
            position.coords
              .latitude;

          const lng =
            position.coords
              .longitude;

          try {
            const response =
              await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
              );

            const data =
              await response.json();

            const fullAddress =
              data.display_name ||
              "";

            setShowManualAddress(
              false
            );

            setForm((prev) => ({
              ...prev,

              latitude:
                lat.toString(),

              longitude:
                lng.toString(),

              address:
                fullAddress,

              fullAddress:
                data.address
                  ?.road || "",

              landmark:
                data.address
                  ?.suburb || "",

              state:
                data.address
                  ?.state || "",

              pincode:
                data.address
                  ?.postcode ||
                "",
            }));

            alert(
              "✅ Location captured"
            );

          } catch (error) {
            console.error(
              error
            );

            alert(
              "Failed to fetch address"
            );
          }
        },
        (error) => {
          console.error(
            error
          );

          alert(
            "❌ Failed to get location"
          );
        }
      );
    };

  // =========================
  // REGISTER
  // =========================

  const handleRegister =
    async (e: any) => {
      e.preventDefault();

      if (
        !form.shopName ||
        !form.sellerName ||
        !form.phone ||
        !form.email ||
        !form.password
      ) {
        alert(
          "Please fill all required fields"
        );

        return;
      }

      if (
        form.password !==
        form.confirmPassword
      ) {
        alert(
          "Passwords do not match"
        );

        return;
      }

      try {
        setLoading(true);

        // CREATE AUTH USER
        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            form.email,
            form.password
          );

        const user =
          userCredential.user;

        // SELLER COUNTER
        const counterRef =
          doc(
            db,
            "system",
            "sellerCounter"
          );

        const counterSnap =
          await getDoc(
            counterRef
          );

        let newSellerId =
          1001;

        if (
          counterSnap.exists()
        ) {
          const currentId =
            counterSnap.data()
              .current;

          newSellerId =
            currentId + 1;

          await updateDoc(
            counterRef,
            {
              current:
                newSellerId,
            }
          );

        } else {
          await setDoc(
            counterRef,
            {
              current: 1001,
            }
          );
        }

        // SAVE SELLER
        await setDoc(
          doc(
            db,
            "sellers",
            user.uid
          ),
          {
            // ROLE
            role: "seller",

            firebaseUid:
              user.uid,

            sellerId:
              newSellerId,

            shopName:
              form.shopName,

            sellerName:
              form.sellerName,

            phone:
              form.phone,

            email:
              form.email,

            shopImage:
              form.shopImage,

            sellerImage:
              form.sellerImage,

            status: "Open",

            isApproved:
              false,

            isVerified:
              false,

            isBanned:
              false,

            location: {
              address:
                form.address,

              fullAddress:
                form.fullAddress,

              landmark:
                form.landmark,

              state:
                form.state,

              pincode:
                form.pincode,

              latitude:
                form.latitude
                  ? Number(
                      form.latitude
                    )
                  : null,

              longitude:
                form.longitude
                  ? Number(
                      form.longitude
                    )
                  : null,
            },

            createdAt:
              Timestamp.now(),
          }
        );

        alert(
          `✅ Seller Registered\nSeller ID: ${newSellerId}`
        );

        router.push(
          "/add-product"
        );

      } catch (err: any) {
        console.error(
          err
        );

        alert(
          err.message
        );

      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-5">
          Seller Registration
        </h1>

        <form
          onSubmit={
            handleRegister
          }
          className="space-y-4"
        >
          {/* SHOP NAME */}

          <input
            type="text"
            placeholder="Shop Name"
            value={
              form.shopName
            }
            onChange={(e) =>
              setForm({
                ...form,
                shopName:
                  e.target
                    .value,
              })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* SELLER NAME */}

          <input
            type="text"
            placeholder="Seller Name"
            value={
              form.sellerName
            }
            onChange={(e) =>
              setForm({
                ...form,
                sellerName:
                  e.target
                    .value,
              })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* PHONE */}

          <input
            type="tel"
            value={form.phone}
            onChange={(e) => {
              let value =
                e.target
                  .value;

              if (
                !value.startsWith(
                  "+91 "
                )
              ) {
                value =
                  "+91 ";
              }

              setForm({
                ...form,
                phone:
                  value,
              });
            }}
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* EMAIL */}

          <input
            type="email"
            placeholder="Email"
            value={
              form.email
            }
            onChange={(e) =>
              setForm({
                ...form,
                email:
                  e.target
                    .value,
              })
            }
            className="w-full border rounded-lg px-3 py-2"
          />

          {/* PASSWORD */}

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              value={
                form.password
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target
                      .value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              className="absolute right-3 top-2 text-sm"
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="relative">
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm Password"
              value={
                form.confirmPassword
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword:
                    e.target
                      .value,
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              className="absolute right-3 top-2 text-sm"
            >
              {showConfirmPassword
                ? "Hide"
                : "Show"}
            </button>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={
              loading
            }
            className="w-full bg-[#2EE6A6] py-2 rounded-lg font-semibold"
          >
            {loading
              ? "Creating Account..."
              : "Register Seller"}
          </button>
        </form>
      </div>
    </div>
  );
}