// app/(admin)/layout.tsx

"use client";

import SellerSideBar from "../components/seller/SellerSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      {/* SIDEBAR */}
      <SellerSideBar />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}