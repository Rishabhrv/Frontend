import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import UserTable from "@/components/users/UserTable";
import "../../../app/globals.css";
import AdminGuard  from "@/components/admin/AdminGuard";


export default function UsersPage() {
        useEffect(() => {
          document.title = "Manage Users | Admin Panel";
        }, []);
  return (
    <AdminGuard pageKey="users">
          <div className="p-6 bg-white text-gray-700">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <UserTable />
              </div>
            </div>
    </div>

    </AdminGuard>

  );
}
