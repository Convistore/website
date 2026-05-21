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
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2EE6A6] flex items-center justify-center shadow-md">
                <ShoppingBag className="w-6 h-6 text-[#0F172A]" />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#0F172A]">
                  Convi
                  <span className="text-[#2EE6A6]">
                    store
                  </span>
                </h2>

                <p className="text-xs text-gray-500">
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
                value="support@convistore.com"
              />

              <ContactItem
                icon={
                  <MapPin className="w-4 h-4 text-[#2EE6A6]" />
                }
                title="Location"
                value="India"
              />
            </div>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-lg font-black text-[#0F172A] mb-5">
              Stay Updated
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed">
              Get updates about new
              stores, offers and
              product availability.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#2EE6A6]"
              />

              <button className="bg-[#2EE6A6] hover:bg-[#27d497] transition text-[#0F172A] py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md">
                Subscribe
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
            ConviStore. All rights
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