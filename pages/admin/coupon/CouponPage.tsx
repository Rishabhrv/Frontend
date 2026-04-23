import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminGuard  from "@/components/admin/AdminGuard";
import CouponTable from "@/components/coupon/CouponTable";

export default function ShippingZones() {
      useEffect(() => {
        document.title = "Manage Coupons | Admin Panel";
      }, []);
  return (
    <AdminGuard pageKey="coupons">
          <div className="p-6 bg-white text-gray-700">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <CouponTable />
            </div>
          </div>
        </div>
    </div>
    </AdminGuard>

  );
}
