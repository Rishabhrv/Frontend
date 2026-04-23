import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import ShippingZonesPage from "@/components/shipping/ShippingZonesPage";
import AdminGuard  from "@/components/admin/AdminGuard";


export default function ShippingZones() {
        useEffect(() => {
          document.title = "Manage Shipping Zones | Admin Panel";
        }, []);
  return (
    <AdminGuard pageKey="shipping">
          <div className="p-6 bg-white text-gray-700">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
              <ShippingZonesPage />
            </div>
          </div>
        </div>
    </div>
    </AdminGuard>

  );
}
