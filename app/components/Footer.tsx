"use client";

import Link from "next/link";

import {
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Store,
  Package,
  Sparkles,
  Info,
  Heart,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      {/* TOP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* BRAND */}
          <div>
            {/* LOGO */}
    <Link
  href="/"
  className="flex flex-col "
>
  {/* LOGO */}
  <div className="relative w-20 h-10 sm:w-20 sm:h-10 md:w-24 md:h-10 lg:w-28 lg:h-10 flex-shrink-0">
    <Image
      src="/conviomart.png"
      alt="Convi Logo"
      fill
      className="object-contain"
      priority
    />
  </div>

  {/* TEXT */}
  <div className="leading-tight">
    <p className="text-xs sm:text-sm text-gray-500 mt-1">
      Fast local shopping
    </p>
  </div>
</Link>

            <p className="text-sm text-gray-500 leading-relaxed mt-5 max-w-sm">
              Get groceries, snacks,
              vegetables, electronics,
              and daily essentials
              delivered instantly from
              nearby local stores.
            </p>

            {/* BADGE */}
            <div className="mt-5 inline-flex items-center gap-2 bg-[#F8FAFC] border border-gray-200 px-4 py-2 rounded-2xl">
              <Sparkles className="w-4 h-4 text-[#2EE6A6]" />

              <span className="text-sm font-medium text-[#0F172A]">
                Smart Local Commerce
              </span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-lg font-black text-[#0F172A] mb-5">
              Quick Links
            </h3>

            <div className="space-y-3">
              <FooterLink
                href="/sellerpage"
                icon={
                  <Store className="w-4 h-4" />
                }
                label="Nearby Sellers"
              />

              <FooterLink
                href="/customer/orders"
                icon={
                  <Package className="w-4 h-4" />
                }
                label="My Orders"
              />


              <FooterLink
                href="/customer/about"
                icon={
                  <Info className="w-4 h-4" />
                }
                label="About Us"
              />
                <FooterLink
                  href="/customer/contact"
                  icon={
                    <Phone className="w-4 h-4" />
                  }
                  label="Contact Us"
                />
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-lg font-black text-[#0F172A] mb-5">
              Contact
            </h3>

            <div className="space-y-4">
              <ContactItem
                icon={
                  <Phone className="w-4 h-4 text-[#2EE6A6]" />
                }
                title="Phone"
                value="+91 9876543210"
              />

              <ContactItem
                icon={
                  <Mail className="w-4 h-4 text-[#2EE6A6]" />
                }
                title="Email"
                value="convistoreofficial@gmail.com"
              />

              <ContactItem
                icon={
                  <MapPin className="w-4 h-4 text-[#2EE6A6]" />
                }
                title="Location"
                value="New Delhi, India"
              />
            </div>
          </div>

        {/* TERMS & CONDITIONS */}
<div>
  <h3 className="text-lg font-black text-[#0F172A] mb-5">
    Terms & Conditions
  </h3>

  <p className="text-sm text-gray-500 leading-relaxed">
    Read our customer policies, delivery rules,
    refunds, returns, and platform guidelines.
  </p>

  <div className="mt-5">
    <button
      onClick={() => window.location.href = "/customer/terms"}
      className="w-full bg-[#2EE6A6] hover:bg-[#27d497] transition text-[#0F172A] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md"
    >
      View Terms
      <ArrowUpRight className="w-4 h-4" />
    </button>
  </div>
</div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="border-t border-gray-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-sm text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            ConvioMart. All rights
            reserved.
          </p>

         
        </div>
      </div>
    </footer>
  );
}

/* =========================
    FOOTER LINK
========================= */

function FooterLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 text-gray-600 hover:text-[#0F172A] transition"
    >
      <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-gray-200 flex items-center justify-center group-hover:bg-[#2EE6A6] group-hover:text-[#0F172A] transition">
        {icon}
      </div>

      <span className="text-sm font-medium">
        {label}
      </span>
    </Link>
  );
}

/* =========================
    CONTACT ITEM
========================= */

function ContactItem({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl bg-[#F8FAFC] border border-gray-200 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>

      <div>
        <p className="text-sm font-semibold text-[#0F172A]">
          {title}
        </p>

        <p className="text-sm text-gray-500 mt-1 break-all">
          {value}
        </p>
      </div>
    </div>
  );
}