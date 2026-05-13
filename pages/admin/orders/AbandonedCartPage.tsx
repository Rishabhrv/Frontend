import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminGuard  from "@/components/admin/AdminGuard";
import AbandonedCartTable from "@/components/orders/AbondonedCartTable";


export default function AbandonedCartPage() {
        useEffect(() => {
          document.title = "Manage AbandonedCart | Admin Panel";
        }, []);
  return (
    <AdminGuard pageKey="orders">
          <div className="p-6 bg-white text-gray-700">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <AbandonedCartTable />
              </div>
            </div>
    </div>
    </AdminGuard>

  );
}
