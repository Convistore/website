"use client";

import Navbar from "@/app/components/Navbar";

import {
  ShieldCheck,
  AlertTriangle,
  ShoppingBag,
  CreditCard,
  Truck,
  Ban,
  FileText,
  Store,
  PackageCheck,
  UserCheck,
  RefreshCcw,
  MapPin,
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: <Store className="w-6 h-6" />,
      title: "Platform Role",
      content:
        "ConviStore acts as a marketplace connecting customers with nearby local shops inside or around the society area. We do not manufacture, store, or directly sell products listed by sellers.",
    },

    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Account Responsibility",
      content:
        "Customers must provide accurate name, address, mobile number, and delivery details. Customers are responsible for maintaining the confidentiality and security of their account.",
    },

    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Order Placement",
      content:
        "Orders placed through the platform are considered valid purchase requests. Once an order is confirmed by the seller shop, cancellation may not always be possible.",
    },

    {
      icon: <PackageCheck className="w-6 h-6" />,
      title: "Product Availability",
      content:
        "Product availability depends on seller inventory. If any product becomes unavailable after order placement, the seller may contact the customer regarding replacement or cancellation.",
    },

    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Pricing & Payments",
      content:
        "Prices shown on ConviStore are decided by individual seller shops. Customers must complete payments honestly. Fraudulent transactions, fake orders, or payment abuse may result in account suspension.",
    },

    {
      icon: <Truck className="w-6 h-6" />,
      title: "Delivery",
      content:
        "Delivery timings may vary depending on selected time slot, instant priority orders, weather conditions, traffic, and high order volume. Estimated delivery time is only approximate.",
    },

    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "Order Confirmation & Verification",
      content:
        "Customers must confirm whether the order was received correctly. OTP verification, delivery confirmation messages, or call verification may be used to complete the order. False disputes or misuse may lead to account suspension.",
    },

    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Cash on Delivery (COD)",
      content:
        "Customers must pay the exact order amount at the time of delivery unless prepaid methods are available. Repeated refusal to accept confirmed orders may lead to account restrictions.",
    },

    {
      icon: <RefreshCcw className="w-6 h-6" />,
      title: "Returns & Refunds",
      content:
        "Since products may include groceries, vegetables, dairy, and consumables, returns may not be accepted after delivery except in cases of wrong items, expired products, or damaged products. Refund decisions depend on seller verification.",
    },

    {
      icon: <Ban className="w-6 h-6" />,
      title: "Customer Conduct",
      content:
        "Customers must not place fake orders, abuse delivery personnel or shop staff, attempt fraud, misuse platform loopholes, or use multiple accounts for unfair benefits.",
    },

    {
      icon: <Store className="w-6 h-6" />,
      title: "Seller Responsibility",
      content:
        "Product quality, expiry, freshness, packaging, and product accuracy are solely the responsibility of the respective seller shop.",
    },

    {
      icon: <FileText className="w-6 h-6" />,
      title: "Platform Rights",
      content:
        "ConviStore reserves the right to cancel suspicious orders, suspend accounts involved in fraud, and modify platform policies anytime without prior notice.",
    },

    {
      icon: <AlertTriangle className="w-6 h-6" />,
      title: "Limitation of Liability",
      content:
        "ConviStore is not responsible for product quality issues caused by sellers, delays due to unavoidable circumstances, or incorrect information provided by shops or customers.",
    },

    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Privacy",
      content:
        "Customer data is only used for order processing, delivery coordination, and customer support. Personal information will not be sold to third parties without customer consent.",
    },

    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Delivery Location Policy",
      content:
        "Apartment residents may need to collect orders from the tower lobby, reception area, or designated pickup point unless doorstep delivery is specifically available. Customers must be available at the pickup point during delivery. Villa or independent house deliveries may be provided depending on seller or delivery availability. ConviStore is not responsible for delays caused due to customer unavailability.",
    },

    {
      icon: <FileText className="w-6 h-6" />,
      title: "Policy Updates",
      content:
        "ConviStore may update these Terms & Conditions anytime to improve platform security, service quality, and customer experience.",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-b from-[#f7fff9] via-white to-[#f5f5f5] px-4 py-10">
        <div className="mx-auto max-w-5xl">
          {/* HERO */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-black via-[#111111] to-green-700 px-8 py-12 text-white shadow-2xl">
            {/* GLOW */}
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl">
                  <ShieldCheck className="h-10 w-10" />
                </div>

                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                    Terms & Conditions
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-200 leading-relaxed">
                    Please read these terms carefully before using ConviStore.
                    By creating an account or placing an order on our platform,
                    you agree to follow these rules, policies, and guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TERMS */}
          <div className="mt-10 grid gap-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
              >
                <div className="flex items-start gap-5">
                  {/* ICON */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl bg-green-100 text-green-700">
                    {section.icon}
                  </div>

                  {/* CONTENT */}
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0F172A]">
                      {section.title}
                    </h2>

                    <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FOOT NOTE */}
          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 p-6">
            <h3 className="text-lg font-extrabold text-green-800">
              Important Notice
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-green-700">
              Violation of these Terms & Conditions may result in temporary
              suspension or permanent blocking of your ConviStore account for
              platform safety, fraud prevention, and seller/customer protection.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}