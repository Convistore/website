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
  updateDoc,
} from "firebase/firestore";

export default function CustomerSigninPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleGoogleSignin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      const user = result.user;

      const customerRef = doc(db, "customers", user.uid);

      const customerSnap = await getDoc(customerRef);

      // =========================
      // CHECK CUSTOMER EXISTS
      // =========================

      if (!customerSnap.exists()) {
        alert("Customer account not found");
        return;
      }

      const customerData = customerSnap.data();

      // =========================
      // CHECK ROLE
      // =========================

      if (customerData.role !== "customer") {
        alert("Access denied");
        return;
      }

      // =========================
      // CHECK BLOCKED
      // =========================

      if (customerData.isBlocked) {
        alert("Your account has been blocked");
        return;
      }

      // =========================
      // UPDATE LAST LOGIN
      // =========================

      await updateDoc(customerRef, {
        lastLogin: serverTimestamp(),
      });

      // =========================
      // REDIRECT
      // =========================

      router.push("/");
    } catch (error) {
      console.error("Google Signin Error:", error);
      alert("Failed to sign in");
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
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-3 leading-relaxed">
            Sign in to continue shopping from nearby stores.
          </p>
        </div>

        {/* Google Signin Button */}
        <button
          onClick={handleGoogleSignin}
          disabled={loading}
          className="w-full mt-10 flex items-center justify-center gap-3 bg-black text-white py-4 rounded-2xl font-semibold hover:opacity-90 transition active:scale-[0.98] disabled:opacity-60"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="google"
            className="w-5 h-5"
          />

          {loading
            ? "Signing in..."
            : "Continue with Google"}
        </button>

        {/* Signup Link */}
        <p className="text-sm text-center text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/customer/signup")}
            className="text-black font-semibold cursor-pointer"
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}