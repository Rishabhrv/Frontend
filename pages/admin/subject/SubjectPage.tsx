import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import SubjectsTable from "@/components/subject/Subjectstable";
import AdminGuard  from "@/components/admin/AdminGuard";

export default function SubjectPage() {
  useEffect(() => {
    document.title = "Manage Subjects | Admin Panel";
  }, []);

  
  return (
    <AdminGuard pageKey="subject">
      <div className="p-6 bg-white text-gray-700">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex-col">
            <Header />
            <div className="p-6">
                <SubjectsTable />
            </div>
          </div>
        </div>
    </div>

    </AdminGuard>

  );
}
