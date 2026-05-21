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
} from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: (
        <ShoppingBag className="w-6 h-6" />
      ),
      title: "Using ConviStore",
      content:
        "Customers must use ConviStore responsibly and only for genuine purchases from nearby stores.",
    },

    {
      icon: (
        <Truck className="w-6 h-6" />
      ),
      title: "Orders & Deliveries",
      content:
        "Delivery timings may vary depending on seller availability, traffic, weather, or other conditions. Customers must provide accurate delivery details.",
    },

    {
      icon: (
        <CreditCard className="w-6 h-6" />
      ),
      title: "Payments",
      content:
        "Customers must complete payments honestly. Fraudulent transactions, fake orders, or payment abuse may lead to account suspension.",
    },

    {
      icon: (
        <AlertTriangle className="w-6 h-6" />
      ),
      title: "Expired or Wrong Products",
      content:
        "Customers should report expired, damaged, or incorrect products immediately through the Report Issue section.",
    },

    {
      icon: (
        <ShieldCheck className="w-6 h-6" />
      ),
      title: "Account Responsibility",
      content:
        "Customers are responsible for maintaining the security of their accounts and personal information.",
    },

    {
      icon: (
        <Ban className="w-6 h-6" />
      ),
      title: "Prohibited Activities",
      content:
        "Abusive language, fake reports, spam orders, harassment, or misuse of the platform are strictly prohibited.",
    },

    {
      icon: (
        <FileText className="w-6 h-6" />
      ),
      title: "Policy Updates",
      content:
        "ConviStore may update these terms anytime to improve platform security, service quality, and customer experience.",
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
                    Please read these terms
                    carefully before using
                    ConviStore. By using our
                    platform, you agree to
                    follow these rules and
                    guidelines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TERMS */}
          <div className="mt-10 grid gap-6">
            {sections.map(
              (section, index) => (
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
              )
            )}
          </div>

          {/* FOOT NOTE */}
          <div className="mt-10 rounded-[28px] border border-green-200 bg-green-50 p-6">
            <h3 className="text-lg font-extrabold text-green-800">
              Important Notice
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-green-700">
              Violation of these terms may
              result in temporary suspension
              or permanent blocking of your
              ConviStore account for platform
              safety and seller/customer
              protection.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}