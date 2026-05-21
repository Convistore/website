"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const customerRef = doc(db, "customers", user.uid);

      const customerSnap = await getDoc(customerRef);

      // =========================
      // CREATE CUSTOMER IF NEW
      // =========================

      if (!customerSnap.exists()) {
        await setDoc(customerRef, {
          uid: user.uid,

          name: user.displayName || "",

          email: user.email || "",

          photoURL: user.photoURL || "",

          phone: user.phoneNumber || "",

          role: "customer",

          address: {
            house: "",
            area: "",
            city: "",
            state: "",
            pincode: "",
            landmark: "",
          },

          location: {
            lat: null,
            lng: null,
          },

          savedAddresses: [],

          cartItems: [],

          wishlist: [],

          ordersCount: 0,

          isBlocked: false,

          createdAt: serverTimestamp(),

          lastLogin: serverTimestamp(),
        });
      } else {
        // =========================
        // UPDATE LAST LOGIN
        // =========================

        await updateDoc(customerRef, {
          lastLogin: serverTimestamp(),
        });
      }

      // =========================
      // REDIRECT
      // =========================

      router.push("/");
    } catch (error) {
      console.error("Google Signup Error:", error);
      alert("Failed to signup");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
    
    {/* Title */}
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900">
        Create New Account
      </h1>

      <p className="text-gray-500 mt-3 leading-relaxed">
        Signup to ConviStore and get groceries,
        snacks, drinks, and essentials delivered
        instantly from nearby stores.
      </p>
    </div>

    {/* Google Signup Button */}
    <button
      onClick={handleGoogleSignup}
      disabled={loading}
      className="w-full mt-10 flex items-center justify-center gap-3 bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition active:scale-[0.98] disabled:opacity-60"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="google"
        className="w-5 h-5"
      />

      {loading
        ? "Creating Account..."
        : "Continue with Google"}
    </button>

    {/* Redirect to Signin */}
    <p className="text-sm text-center text-gray-500 mt-6">
      Already have an account?{" "}
      <span
        onClick={() => router.push("/customer/signin")}
        className="text-black font-semibold cursor-pointer hover:underline"
      >
        Sign In
      </span>
    </p>

    {/* Terms */}
    <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
      By continuing, you agree to our Terms &
      Conditions and Privacy Policy.
    </p>
  </div>
</div>
  );
}