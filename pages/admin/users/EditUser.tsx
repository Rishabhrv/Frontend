import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import { useRouter } from "next/router";

import "../../../app/globals.css";
import EditUserPage from "@/components/users/EditUserPage";

export default function EditUser() {
      const router = useRouter();
      const { id } = router.query;
            useEffect(() => {
              document.title = "Edit User | Admin Panel";
            }, []);
    
      if (!id) return null;
  return (
    <div className="p-6">

        <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <EditUserPage userId={String(id)} />
              </div>
            </div>
    </div>
  );
}
