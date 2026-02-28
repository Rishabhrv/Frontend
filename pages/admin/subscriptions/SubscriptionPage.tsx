import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import SubscriptionTable from "@/components/subscriptions/SubscriptionTable";

export default function SubscriptionPage() {
  useEffect(() => {
    document.title = "Manage Subscriptions | Admin Panel";
  }, []);

  
  return (
    <div className="p-6">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <SubscriptionTable /> 
            </div>
          </div>
        </div>
    </div>
  );
}
