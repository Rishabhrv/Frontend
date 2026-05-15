import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../../../app/globals.css";
import AdminGuard  from "@/components/admin/AdminGuard";
import EbookAnalyticsComponent from "@/components/ebook-analytics/EbookAnalyticsComponent";



export default function EbookAnalyticsPage() {
        useEffect(() => {
          document.title = "Manage Ebook Analytics | Admin Panel";
        }, []);
  return (
    <AdminGuard pageKey="ebook-analytics">
          <div className="p-6 bg-white text-gray-700">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <EbookAnalyticsComponent />

              </div>
            </div>
    </div>
    </AdminGuard>

  );
}
