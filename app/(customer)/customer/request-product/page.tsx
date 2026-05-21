"use client";

import { useState } from "react";
import { db } from "../../../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import {
  Search,
  Sparkles,
  Send,
  Package,
  MapPin,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

const categories = [
  "Groceries",
  "Vegetables",
  "Fruits",
  "Meat",
  "Seafood",
  "Bakery",
  "Dairy",
  "Electronics",
  "Fashion",
  "Home Essentials",
  "Others",
];

export default function RequestProductPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    productName: "",
    category: "",
    description: "",
    location: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.productName || !form.category) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "productRequests"), {
        productName: form.productName.trim(),
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);

      setForm({
        productName: "",
        category: "",
        description: "",
        location: "",
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
        <Navbar/>
      {/* HERO */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#162033] to-[#1E293B] text-white">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#2EE6A6]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#2EE6A6]" />
              <span className="text-sm font-medium">
                Help us improve ConviStore
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              Can’t Find a
              <span className="text-[#2EE6A6]"> Product?</span>
            </h1>

            <p className="mt-6 text-gray-300 text-lg leading-relaxed max-w-xl">
              Request products you want to see on ConviStore. We’ll notify
              nearby sellers and try to make them available for your area.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <Package className="w-6 h-6 text-[#2EE6A6] mb-2" />
                <p className="font-semibold">Any Product</p>
                <span className="text-sm text-gray-300">
                  Grocery, electronics & more
                </span>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <Search className="w-6 h-6 text-[#2EE6A6] mb-2" />
                <p className="font-semibold">Smart Discovery</p>
                <span className="text-sm text-gray-300">
                  Sellers can discover demand
                </span>
              </div>

              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <CheckCircle2 className="w-6 h-6 text-[#2EE6A6] mb-2" />
                <p className="font-semibold">Better Availability</p>
                <span className="text-sm text-gray-300">
                  Improve local shopping
                </span>
              </div>
            </div>
          </div>

          {/* FORM CARD */}
          <div>
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#0F172A]">
                  Request a Product
                </h2>

                <p className="text-gray-500 mt-2">
                  Tell us what you need and we’ll try to make it available.
                </p>
              </div>

              {success && (
                <div className="mb-6 bg-[#2EE6A6]/10 border border-[#2EE6A6]/30 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />

                    <div>
                      <p className="font-semibold text-[#0F172A]">
                        Request Submitted Successfully
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        Nearby sellers may add this product soon.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* PRODUCT NAME */}
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                    Product Name *
                  </label>

                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      placeholder="Example: Organic Honey"
                      value={form.productName}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          productName: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2EE6A6] text-[#0F172A]"
                    />
                  </div>
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                    Category *
                  </label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2EE6A6] text-[#0F172A]"
                  >
                    <option value="">Select Category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LOCATION */}
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                    Your Area
                  </label>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                      type="text"
                      placeholder="Example: Dimapur"
                      value={form.location}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          location: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2EE6A6] text-[#0F172A]"
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="block text-sm font-semibold text-[#0F172A] mb-2">
                    Additional Details
                  </label>

                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />

                    <textarea
                      rows={4}
                      maxLength={300}
                      placeholder="Describe the product, brand, quantity, flavor, etc..."
                      value={form.description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description: e.target.value,
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#2EE6A6] text-[#0F172A] resize-none"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2 text-right">
                    {form.description.length}/300
                  </p>
                </div>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2EE6A6] hover:bg-[#27d497] text-[#0F172A] py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Submitting Request..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-[#0F172A]">
            How It Works
          </h2>

          <p className="text-gray-500 mt-4 text-lg">
            Simple steps to improve local product availability
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition">
            <div className="w-14 h-14 rounded-2xl bg-[#2EE6A6]/10 flex items-center justify-center mb-6">
              <Package className="w-7 h-7 text-[#2EE6A6]" />
            </div>

            <h3 className="text-xl font-bold text-[#0F172A] mb-3">
              Request Products
            </h3>

            <p className="text-gray-500 leading-relaxed">
              Tell us what products you want that are currently unavailable.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition">
            <div className="w-14 h-14 rounded-2xl bg-[#2EE6A6]/10 flex items-center justify-center mb-6">
              <Search className="w-7 h-7 text-[#2EE6A6]" />
            </div>

            <h3 className="text-xl font-bold text-[#0F172A] mb-3">
              Sellers Discover Demand
            </h3>

            <p className="text-gray-500 leading-relaxed">
              Nearby sellers can see trending requested products.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition">
            <div className="w-14 h-14 rounded-2xl bg-[#2EE6A6]/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-7 h-7 text-[#2EE6A6]" />
            </div>

            <h3 className="text-xl font-bold text-[#0F172A] mb-3">
              Better Availability
            </h3>

            <p className="text-gray-500 leading-relaxed">
              More requested products become available over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
