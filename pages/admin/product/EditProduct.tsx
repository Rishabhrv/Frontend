import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AddProductFrom from "@/components/products/AddProductFrom";
import { useRouter } from "next/router";
import "../../../app/globals.css";
import AdminGuard  from "@/components/admin/AdminGuard";


export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
        useEffect(() => {
          document.title = "Edit Products | Admin Panel";
        }, []);

  if (!id) return null;

  return (
    <AdminGuard pageKey="products">
          <div className="p-6 bg-white text-gray-700" >
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <AddProductFrom mode="edit" productId={Number(id)} />
        </div>
      </div>
    </div>
    </AdminGuard>

  );
}
