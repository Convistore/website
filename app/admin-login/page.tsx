"use client";

import { useState } from "react";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);

      // LOGIN
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      // CHECK ADMIN COLLECTION
      const adminDoc = await getDoc(
        doc(db, "admins", user.uid)
      );

      // NOT ADMIN
      if (!adminDoc.exists()) {
        await signOut(auth);

        alert("Access Denied");

        return;
      }

      const adminData = adminDoc.data();

      // ROLE CHECK
      if (adminData.role !== "admin") {
        await signOut(auth);

        alert("Only admins allowed");

        return;
      }

      alert("✅ Admin Login Success");

      router.push("/admin");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] px-4">

      <div className="bg-white p-7 rounded-3xl shadow-lg w-full max-w-sm">

        <h1 className="text-3xl font-black mb-1">
          Admin Login
        </h1>

        <p className="text-gray-500 text-sm mb-6">
          Login to admin dashboard
        </p>

        <input
          type="email"
          placeholder="Admin Email"
          className="w-full border p-3 rounded-xl mb-3 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded-xl mb-5 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {loading ? "Checking..." : "Login"}
        </button>

      </div>
    </div>
  );
}