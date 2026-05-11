import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminGuard  from "@/components/admin/AdminGuard";
import SettingComponent from "@/components/settings/SettingComponent";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Manage Settings | Admin Panel";
  }, []);

  
  return (
    <AdminGuard pageKey="settings">
      <div className="p-6 bg-white text-gray-700">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <SettingComponent />
            </div>
          </div>
        </div>
    </div>

    </AdminGuard>

  );
}
