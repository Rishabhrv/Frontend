import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import SubjectsTable from "@/components/subject/Subjectstable";
export default function SubjectPage() {
  useEffect(() => {
    document.title = "Manage Subjects | Admin Panel";
  }, []);

  
  return (
    <div className="p-6">
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
  );
}
