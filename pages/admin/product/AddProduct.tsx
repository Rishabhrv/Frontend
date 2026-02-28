import React, { useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AddProductFrom from '@/components/products/AddProductFrom';
import "../../../app/globals.css";

const AddProduct = () => {
        useEffect(() => {
          document.title = "Manage Products | Admin Panel";
        }, []);
  return (
        <div className="p-6">
            <div className="flex">
              <Sidebar />
              <div className="flex flex-1 flex-col">
                <Header />
                <AddProductFrom />
              </div>
            </div>
        </div>
  )
}

export default AddProduct
