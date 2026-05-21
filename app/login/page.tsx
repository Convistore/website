"use client";

import { useState } from "react";

import { auth, db } from "../../lib/firebase";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);

      // LOGIN USER
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      // ❌ BLOCK ADMINS
      const adminDoc = await getDoc(
        doc(db, "admins", user.uid)
      );

      if (adminDoc.exists()) {
        await signOut(auth);

        alert("Admins are not allowed here");

        return;
      }

      // ✅ CHECK SELLER
      const sellerDoc = await getDoc(
        doc(db, "sellers", user.uid)
      );

      if (!sellerDoc.exists()) {
        await signOut(auth);

        alert("Seller account not found");

        return;
      }

      const sellerData = sellerDoc.data();

      // OPTIONAL ROLE CHECK
      if (sellerData.role !== "seller") {
        await signOut(auth);

        alert("Only sellers allowed");

        return;
      }

      alert("✅ Seller Login Success");

      router.push("/add-product");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">

      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-sm">

        <h1 className="text-2xl font-bold mb-1">
          Seller Login
        </h1>

        <p className="text-gray-500 text-sm mb-5">
          Login to manage your store
        </p>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded mb-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded mb-4 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded mb-4"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center text-sm">
          <span className="text-gray-500">
            Don't have a seller account?
          </span>

          <button
            onClick={() => router.push("/register")}
            className="ml-1 text-[#2EE6A6] font-semibold"
          >
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
}