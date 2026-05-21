"use client";

import Navbar from "../../../components/Navbar";

import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Clock3,
} from "lucide-react";

import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // =========================
  // WHATSAPP REDIRECT
  // =========================
  const handleWhatsAppRedirect = () => {
    const finalMessage = `Hello ConviStore 👋

Name: ${name}

Query:
${message}
`;

    const whatsappUrl = `https://wa.me/919625626850?text=${encodeURIComponent(
      finalMessage
    )}`;

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* =========================
          HERO SECTION
      ========================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2EE6A6]/10 to-transparent" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-14 sm:pb-20">
          <div className="max-w-3xl">
            {/* BADGE */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm mb-6">
              <MessageCircle className="w-4 h-4 text-[#2EE6A6]" />

              <span className="text-sm font-semibold text-gray-700">
                Contact ConviStore
              </span>
            </div>

            {/* TITLE */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-[#0F172A]">
              We’d Love To
              <span className="block text-[#2EE6A6]">
                Hear From You
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
              Have questions, suggestions or business inquiries?
              Reach out anytime and our team will assist you as
              quickly as possible.
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          CONTACT SECTION
      ========================= */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* =========================
              LEFT SIDE
          ========================= */}
          <div className="space-y-5">
            {/* PHONE */}
            <ContactCard
              icon={
                <Phone className="w-6 h-6 text-[#2EE6A6]" />
              }
              title="Phone Number"
              value="+91 96256 26850"
              link="tel:+919625626850"
            />

            {/* WHATSAPP */}
            <ContactCard
              icon={
                <MessageCircle className="w-6 h-6 text-[#2EE6A6]" />
              }
              title="WhatsApp Chat"
              value="Chat directly on WhatsApp"
              link="https://wa.me/919625626850"
            />

            {/* EMAIL */}
            <ContactCard
              icon={
                <Mail className="w-6 h-6 text-[#2EE6A6]" />
              }
              title="Email Address"
              value="convistoreofficial@gmail.com"
              link="mailto:convistoreofficial@gmail.com"
            />

            {/* ADDRESS */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
                <MapPin className="w-6 h-6 text-[#2EE6A6]" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#0F172A]">
                Address
              </h3>

              <p className="mt-3 text-gray-600 leading-relaxed">
                Mahavir Enclave,
                <br />
                Near Universal Public School,
                <br />
                New Delhi - 110045,
                <br />
                India
              </p>
            </div>

            {/* HOURS */}
            <div className="bg-white rounded-3xl p-6 text-white relative overflow-hidden border border-gray-100 shadow-sm">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#2EE6A6]/10 rounded-full blur-3xl" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#2EE6A6] flex items-center justify-center">
                  <Clock3 className="w-6 h-6 text-[#0F172A]" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-black">
                  Support Hours
                </h3>

                <p className="mt-3 text-gray-600 leading-relaxed">
                  Monday - Sunday
                  <br />
                  9:00 AM - 6:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              RIGHT SIDE
          ========================= */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-5 sm:p-7 lg:p-8">
            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
                Send Your Query
              </h2>

              <p className="mt-2 text-gray-500">
                Your message will open directly in WhatsApp.
              </p>
            </div>

            {/* FORM */}
            <div className="space-y-5">
              {/* NAME */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full h-14 px-4 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#2EE6A6]/20 focus:border-[#2EE6A6] transition-all text-sm sm:text-base"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Message
                </label>

                <textarea
                  rows={6}
                  placeholder="Write your query here..."
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  className="w-full p-4 rounded-2xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:ring-4 focus:ring-[#2EE6A6]/20 focus:border-[#2EE6A6] transition-all resize-none text-sm sm:text-base"
                />
              </div>

              {/* BUTTON */}
              <button
                onClick={handleWhatsAppRedirect}
                disabled={!name || !message}
                className="w-full bg-[#2EE6A6] text-[#0F172A] py-4 rounded-2xl font-bold shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />

                <span>Send Query on WhatsApp</span>
              </button>

              {/* NOTE */}
              <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
                Clicking the button will redirect you to WhatsApp
                with your message automatically filled.
              </p>
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
    CONTACT CARD
========================= */
function ContactCard({
  icon,
  title,
  value,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  link: string;
}) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-bold text-[#0F172A]">
        {title}
      </h3>

      <p className="mt-3 text-gray-600 break-words leading-relaxed">
        {value}
      </p>
    </a>
  );
}