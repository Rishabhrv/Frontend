import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "../../../app/globals.css";
import  ReviewTable  from "@/components/reviews/ReviewTable";
import AdminGuard  from "@/components/admin/AdminGuard";


export default function UsersPage() {
        useEffect(() => {
          document.title = "Manage Reviews | Admin Panel";
        }, []);
  return (
    <AdminGuard pageKey="reviews">
          <div className="p-6 bg-white text-gray-700">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <ReviewTable />
              </div>
            </div>
    </div>

    </AdminGuard>

  );
}
