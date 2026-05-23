"use client";

import Navbar from "../../../components/Navbar";
import {
  ShoppingBag,
  Truck,
  Store,
  ShieldCheck,
  Sparkles,
  Clock3,
  Users,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* =========================
          HERO SECTION
      ========================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2EE6A6]/10 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
          <div className="max-w-3xl">
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-[#2EE6A6]" />

              <span className="text-sm font-semibold text-gray-700">
                About ConvioMart
              </span>
            </div>

            {/* TITLE */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-[#0F172A]">
              Smart Local Shopping
              <span className="block text-[#2EE6A6]">
                Delivered Faster
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
              ConvioMart connects customers with nearby local
              sellers and stores for fast, convenient and reliable
              shopping. From groceries and essentials to fresh
              local products , everything is available near you.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/sellerpage"
                className="bg-[#2EE6A6] text-[#0F172A] px-6 py-3 rounded-2xl font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Explore Sellers
              </a>

              <a
                href="/contact"
                className="bg-white border border-gray-200 text-[#0F172A] px-6 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A]">
            Why Choose ConvioMart?
          </h2>

          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Designed for modern local shopping with speed,
            simplicity and convenience.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <FeatureCard
            icon={<Truck className="w-6 h-6 text-[#2EE6A6]" />}
            title="Fast Delivery"
            description="Quick deliveries from nearby sellers and local stores directly to your doorstep."
          />

          <FeatureCard
            icon={<Store className="w-6 h-6 text-[#2EE6A6]" />}
            title="Local Sellers"
            description="Support nearby businesses and discover trusted local products around you."
          />

          <FeatureCard
            icon={
              <ShieldCheck className="w-6 h-6 text-[#2EE6A6]" />
            }
            title="Trusted Platform"
            description="A safe and reliable shopping experience built for customers and sellers."
          />

          <FeatureCard
            icon={<Clock3 className="w-6 h-6 text-[#2EE6A6]" />}
            title="Convenience"
            description="Shop anytime from your mobile, tablet or desktop with a seamless experience."
          />
        </div>
      </section>

      {/* =========================
          MISSION SECTION
      ========================= */}
      <section className="bg-white border-y border-gray-100">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* LEFT */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F8FAFC] border border-gray-200 mb-5">
                <Users className="w-4 h-4 text-[#2EE6A6]" />

                <span className="text-sm font-semibold text-gray-700">
                  Our Mission
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black leading-tight text-[#0F172A]">
                Building Better Local Commerce
              </h2>

              <p className="mt-5 text-gray-600 leading-relaxed text-base sm:text-lg">
                Our mission is to empower local communities by
                connecting customers with nearby stores and
                sellers through technology.
              </p>

              <p className="mt-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                We believe local shopping should be fast,
                affordable and accessible while helping small
                businesses grow digitally.
              </p>
            </div>

            {/* RIGHT */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <StatsCard number="30+" label="Products" />

              <StatsCard number="2+" label="Local Sellers" />

              <StatsCard number="24/7" label="Convenience" />

              <StatsCard number="Fast" label="Delivery" />
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FINAL CTA
      ========================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="relative overflow-hidden bg-[#0F172A] rounded-[32px] p-8 sm:p-12">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#2EE6A6]/10 rounded-full blur-3xl" />

          <div className="relative max-w-2xl">
            <div className="w-14 h-14 rounded-2xl bg-[#2EE6A6] flex items-center justify-center shadow-lg mb-6">
              <ShoppingBag className="w-7 h-7 text-[#0F172A]" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Start Shopping Smarter with ConvioMart
            </h2>

            <p className="mt-5 text-gray-300 text-base sm:text-lg leading-relaxed">
              Discover local stores, order faster and enjoy a
              seamless shopping experience from anywhere.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/sellerpage"
                className="bg-[#2EE6A6] text-[#0F172A] px-6 py-3 rounded-2xl font-bold hover:scale-[1.03] transition-all"
              >
                Explore Sellers
              </a>

              <a
                href="/contact"
                className="border border-white/20 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-white/10 transition-all"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL STYLE */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}

/* =========================
    FEATURE CARD
========================= */
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold text-[#0F172A]">
        {title}
      </h3>

      <p className="mt-3 text-gray-600 leading-relaxed text-sm sm:text-base">
        {description}
      </p>
    </div>
  );
}

/* =========================
    STATS CARD
========================= */
function StatsCard({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="bg-[#F8FAFC] rounded-3xl border border-gray-100 p-6 sm:p-8 text-center">
      <h3 className="text-3xl sm:text-4xl font-black text-[#0F172A]">
        {number}
      </h3>

      <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium">
        {label}
      </p>
    </div>
  );
}