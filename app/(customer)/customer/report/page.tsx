"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/app/components/Navbar";

import { auth, db } from "@/lib/firebase";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  AlertTriangle,
  Send,
  ShieldAlert,
  Bug,
  Package,
  Truck,
  CreditCard,
  Store,
} from "lucide-react";

export default function ReportIssuePage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [customer, setCustomer] =
    useState<any>(null);

  const [form, setForm] = useState({
    type: "",
    orderId: "",
    message: "",
  });

  // =========================
  // AUTH CHECK
  // =========================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          // NOT LOGGED IN
          if (!user) {
            router.replace(
              "/customer/signin"
            );

            return;
          }

          // GET CUSTOMER
          const customerRef = doc(
            db,
            "customers",
            user.uid
          );

          const customerSnap =
            await getDoc(customerRef);

          // CUSTOMER NOT FOUND
          if (!customerSnap.exists()) {
            router.replace(
              "/customer/signin"
            );

            return;
          }

          const customerData =
            customerSnap.data();

          // WRONG ROLE
          if (
            customerData.role !==
            "customer"
          ) {
            router.replace(
              "/customer/signin"
            );

            return;
          }

          // BLOCKED
          if (
            customerData.isBlocked
          ) {
            router.replace(
              "/customer/signin"
            );

            return;
          }

          setCustomer({
            uid: user.uid,
            ...customerData,
          });
        } catch (error) {
          console.error(error);

          router.replace(
            "/customer/signin"
          );
        } finally {
          setCheckingAuth(false);
        }
      }
    );

    return () => unsubscribe();
  }, [router]);

  // =========================
  // SUBMIT REPORT
  // =========================

  const handleSubmit =
    async () => {
      try {
        if (!auth.currentUser)
          return;

        if (
          !form.type ||
          !form.message
        ) {
          alert(
            "Please fill all required fields"
          );

          return;
        }

        setLoading(true);

        await addDoc(
          collection(db, "reports"),
          {
            customerUid:
              auth.currentUser.uid,

            customerName:
              customer?.name || "",

            customerEmail:
              customer?.email || "",

            customerPhone:
              customer?.phone || "",

            orderId:
              form.orderId || "",

            type: form.type,

            issue:
              form.message.trim(),

            status: "pending",

            createdAt:
              serverTimestamp(),
          }
        );

        alert(
          "Report submitted successfully"
        );

        setForm({
          type: "",
          orderId: "",
          message: "",
        });
      } catch (error) {
        console.error(error);

        alert(
          "Failed to submit report"
        );
      } finally {
        setLoading(false);
      }
    };

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-lg font-semibold text-[#0F172A]">
          Checking account...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-b from-[#f7fff9] via-white to-[#f5f5f5] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          {/* HEADER */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-black via-[#111111] to-green-700 px-8 py-10 text-white shadow-2xl">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-green-400/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl">
                  <ShieldAlert className="h-8 w-8 text-white" />
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight">
                    Report an Issue
                  </h1>

                  <p className="mt-2 text-sm text-gray-200">
                    Seller issue,
                    expired products,
                    website bug or
                    anything else.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="mt-8 rounded-[32px] border border-gray-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8">
            {/* ISSUE TYPES */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <IssueCard
                icon={
                  <Store className="h-6 w-6" />
                }
                label="Seller Issue"
              />

              <IssueCard
                icon={
                  <Package className="h-6 w-6" />
                }
                label="Expired Product"
              />

              <IssueCard
                icon={
                  <Truck className="h-6 w-6" />
                }
                label="Delivery Issue"
              />

              <IssueCard
                icon={
                  <CreditCard className="h-6 w-6" />
                }
                label="Payment Issue"
              />

              <IssueCard
                icon={
                  <Bug className="h-6 w-6" />
                }
                label="Website Bug"
              />

              <IssueCard
                icon={
                  <AlertTriangle className="h-6 w-6" />
                }
                label="Other"
              />
            </div>

            {/* FORM */}
            <div className="mt-8 space-y-6">
              {/* TYPE */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Issue Type
                </label>

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                >
                  <option value="">
                    Select Issue Type
                  </option>

                  <option value="seller_issue">
                    Seller Issue
                  </option>

                  <option value="expired_product">
                    Expired Product
                  </option>

                  <option value="wrong_order">
                    Wrong Order
                  </option>

                  <option value="payment_issue">
                    Payment Issue
                  </option>

                  <option value="delivery_issue">
                    Delivery Issue
                  </option>

                  <option value="website_bug">
                    Website Bug
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              {/* ORDER ID */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Order ID (Optional)
                </label>

                <input
                  type="text"
                  placeholder="order_12345"
                  value={form.orderId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      orderId:
                        e.target.value,
                    })
                  }
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[15px] font-medium outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Describe Your Issue
                </label>

                <textarea
                  rows={6}
                  placeholder="Explain your issue here..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      message:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 text-[15px] font-medium outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100"
                />
              </div>

              {/* BUTTON */}
              <button
                onClick={
                  handleSubmit
                }
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-green-600 to-green-700 px-6 py-4 font-bold text-white shadow-xl shadow-green-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-green-300 active:scale-[0.98] disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Send className="h-5 w-5" />

                  {loading
                    ? "Submitting Report..."
                    : "Submit Report"}
                </span>

                <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================
   ISSUE CARD
========================= */

function IssueCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-[#F8FAFC] p-5 transition-all hover:-translate-y-1 hover:border-green-200 hover:bg-white hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
        {icon}
      </div>

      <p className="mt-4 text-sm font-bold text-[#0F172A]">
        {label}
      </p>
    </div>
  );
}