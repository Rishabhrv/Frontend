import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import OrdersTable from "@/components/orders/OrdersTable";
import "../../../app/globals.css";

export default function OrdersPage() {
        useEffect(() => {
          document.title = "Manage Orders | Admin Panel";
        }, []);
  return (
    <div className="p-6">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <OrdersTable />
              </div>
            </div>
    </div>
  );
}
