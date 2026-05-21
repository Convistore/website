// app/(admin)/layout.tsx

"use client";

import AdminSidebar from "../components/admin//AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}