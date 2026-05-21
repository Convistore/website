"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import { useRouter } from "next/navigation";

export default function AdminRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const registerAdmin = async () => {
    try {
      setLoading(true);

      // CREATE AUTH ACCOUNT
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      // SAVE ADMIN DATA
      await setDoc(doc(db, "admins", user.uid), {
        role: "admin",

        name,

        email,

        uid: user.uid,

        createdAt: serverTimestamp(),
      });

      alert("✅ Admin Registered Successfully");

      router.push("/admin-login");

    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] px-4">

      <div className="bg-white p-7 rounded-3xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-black mb-1">
          Admin Registration
        </h1>

        <p className="text-gray-500 text-sm mb-6">
          Create admin account
        </p>

        <input
          type="text"
          placeholder="Admin Name"
          className="w-full border p-3 rounded-xl mb-3 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          onClick={registerAdmin}
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {loading ? "Creating..." : "Create Admin"}
        </button>

      </div>
    </div>
  );
}