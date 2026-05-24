// app/(admin)/layout.tsx

"use client";

import SellerSideBar from "../components/seller/SellerSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* TOP NAVBAR / SIDEBAR */}
      <SellerSideBar />

      {/* PAGE CONTENT */}
      <main className="w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}