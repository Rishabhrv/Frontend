import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminGuard from "@/components/admin/AdminGuard";
import SalesTable from "@/components/sales/SalesTable";

export default function SalesPage() {
    useEffect(() => {
        document.title = "Manage Sale | Admin Panel";
    }, []);


    return (
        <AdminGuard pageKey="sales">
            <div className="p-6 bg-white text-gray-700">
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 flex-col">
                        <Header />
                        <div className="p-6">
                            <SalesTable />
                        </div>
                    </div>
                </div>
            </div>

        </AdminGuard>

    );
}
