"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Navbar from "@/app/components/Navbar";
import Image from "next/image";

export default function CustomerProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    photoURL: "",
    phone: "",

    house: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  // =========================
  // AUTH CHECK + FETCH DATA
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        try {
          // NOT LOGGED IN
          if (!currentUser) {
            router.push("/customer/signup");
            return;
          }

          // GET CUSTOMER DOC
          const customerRef = doc(
            db,
            "customers",
            currentUser.uid
          );

          const customerSnap = await getDoc(customerRef);

          // CUSTOMER NOT FOUND
          if (!customerSnap.exists()) {
            router.push("/customer/signup");
            return;
          }

          const data = customerSnap.data();

          // NOT CUSTOMER ROLE
          if (data.role !== "customer") {
            router.push("/customer/signup");
            return;
          }

          setUser(data);

          setFormData({
            name: data.name || "",

            email: data.email || "",

            photoURL:
              data.photoURL ||
              currentUser.photoURL ||
              "",

            phone: data.phone || "",

            house: data.address?.house || "",

            area: data.address?.area || "",

            city: data.address?.city || "",

            state: data.address?.state || "",

            pincode: data.address?.pincode || "",

            landmark: data.address?.landmark || "",
          });
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSave = async () => {
    try {
      if (!auth.currentUser) return;

      setSaving(true);

      const customerRef = doc(
        db,
        "customers",
        auth.currentUser.uid
      );

      await updateDoc(customerRef, {
        name: formData.name,

        phone: formData.phone,

        address: {
          house: formData.house,
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          landmark: formData.landmark,
        },
      });

      alert("Profile updated successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

// =========================
// LOGOUT
// =========================

const handleLogout = async () => {
  try {
    // FIREBASE LOGOUT
    await signOut(auth);

    // CLEAR CUSTOMER CACHE
    localStorage.removeItem(
      "customer_data"
    );

    localStorage.removeItem(
      "sellers_cache"
    );

    localStorage.removeItem(
      "sellers_cache_time"
    );

    // OPTIONAL EXTRA CLEANUP
    localStorage.removeItem("cart");

    // REDIRECT
    router.push("/customer/signup");
  } catch (error) {
    console.error(error);

    alert("Logout failed");
  }
};

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg font-semibold">
          Loading Profile...
        </div>
      </div>
    );
  }

  return (
<>

    <Navbar/>
  <div className="min-h-screen bg-gradient-to-b from-[#f7fff9] via-white to-[#f5f5f5] px-4 py-8">

    <div className="max-w-3xl mt-10 mx-auto overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
      
      {/* HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-[#111111] to-green-700 px-8 py-10 text-white">
        
        {/* BACKGROUND GLOW */}
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-green-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center">
          
          {/* PROFILE IMAGE */}
          <div className="relative">
             <Image
                  src={
                    formData.photoURL
                      ? `${formData.photoURL}?tr=w-300,h-300,q-60,f-webp`
                      : "/avatar.png"
                  }
                  alt="profile"
                  width={128}
                  height={128}
                  priority={false}
                  className="h-32 w-32 rounded-full border-4 border-white/90 object-cover shadow-2xl"
                />
            <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-green-500">
              <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          {/* NAME */}
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
            {formData.name || "Customer"}
          </h1>

          <p className="mt-2 text-sm text-gray-200">
            {formData.email}
          </p>

          {/* STATUS BADGES */}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
         

            <div className="rounded-full border border-green-300/20 bg-green-500/20 px-4 py-2 text-xs font-semibold text-green-100 backdrop-blur-xl">
              ✅ {user?.isBlocked ? "Blocked" : "Active"}
            </div>

          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-xl capitalize">
  👤 {user?.role}
</div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="space-y-8 p-6 sm:p-8">

        {/* PERSONAL INFO */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-xl">
              👤
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Personal Information
              </h2>

              <p className="text-sm text-gray-500">
                Manage your account details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            
            {/* NAME */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            {/* PHONE */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Phone Number
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                value={formData.email}
                disabled
                className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-100 px-5 text-[15px] text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* ADDRESS */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-xl text-white">
              📍
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Delivery Address
              </h2>

              <p className="text-sm text-gray-500">
                Your saved delivery location
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <input
              type="text"
              name="house"
              placeholder="House / Flat"
              value={formData.house}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />

            <input
              type="text"
              name="area"
              placeholder="Area"
              value={formData.area}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />

            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />

            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />

            <input
              type="text"
              name="landmark"
              placeholder="Landmark"
              value={formData.landmark}
              onChange={handleChange}
              className="h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-black focus:bg-white focus:ring-4 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-4 pt-2 sm:flex-row">
          
          {/* SAVE */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="group relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-green-600 to-green-700 px-6 py-4 font-bold text-white shadow-xl shadow-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-green-300 active:scale-[0.98] disabled:opacity-60"
          >
            <span className="relative z-10">
              {saving ? "Saving Changes..." : "Save Changes"}
            </span>

            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </button>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="group flex-1 rounded-2xl border border-red-200 bg-white px-6 py-4 font-bold text-red-500 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:bg-red-50 hover:shadow-lg active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
        {/* QUICK ACTIONS */}
<div>
  <div className="mb-5 flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl">
      ⚡
    </div>

    <div>
      <h2 className="text-xl font-extrabold text-gray-900">
        Quick Actions
      </h2>

      <p className="text-sm text-gray-500">
        Manage reports, orders and policies
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    
    {/* REPORT ISSUE */}
    <button
      onClick={() =>
        router.push("/customer/report")
      }
      className="group rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
          ⚠️
        </div>

        <div className="text-red-400 text-xl transition group-hover:translate-x-1">
          →
        </div>
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-gray-900">
        Report an Issue
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Report seller issues,
        expired products, bugs,
        payment or delivery problems.
      </p>
    </button>

    {/* TERMS */}
    <button
      onClick={() =>
        router.push("/customer/terms")
      }
      className="group rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl">
          📜
        </div>

        <div className="text-green-500 text-xl transition group-hover:translate-x-1">
          →
        </div>
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-gray-900">
        Terms & Conditions
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Read customer policies,
        platform rules and account
        guidelines.
      </p>
    </button>

    {/* ORDERS */}
    <button
      onClick={() =>
        router.push("/customer/orders")
      }
      className="group rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
          📦
        </div>

        <div className="text-blue-500 text-xl transition group-hover:translate-x-1">
          →
        </div>
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-gray-900">
        My Orders
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        View your purchases,
        delivery status and order
        history.
      </p>
    </button>

    {/* REQUEST PRODUCT */}
    <button
      onClick={() =>
        router.push(
          "/customer/request-product"
        )
      }
      className="group rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-2xl">
          ✨
        </div>

        <div className="text-yellow-500 text-xl transition group-hover:translate-x-1">
          →
        </div>
      </div>

      <h3 className="mt-5 text-lg font-extrabold text-gray-900">
        Request Product
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Ask nearby sellers to add
        products you cannot find.
      </p>
    </button>
  </div>
</div>
      </div>
    </div>
  </div>
  </>
);

}