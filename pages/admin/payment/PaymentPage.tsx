import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import PaymentTable from "@/components/payment/PaymentTable";

export default function PaymentPage() {
        useEffect(() => {
          document.title = "Manage Payments | Admin Panel";
        }, []);
  return (
    <div className="p-6">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <PaymentTable />
            </div>
          </div>
        </div>
    </div>
  );
}
