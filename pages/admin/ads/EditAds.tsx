"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation"; 
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import CreateAdPage from "@/components/ads/CreateAdPage";
import "../../../app/globals.css";

const EditAds = () => {
  useEffect(() => {
    document.title = "Edit Ads | Admin Panel";
  }, []);

  // 👇 Added the '?' to safely check for searchParams
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
    
  // Prevent rendering the form until we have the ID from the URL
  if (!id) return null;

  return (
    <div className="p-6 bg-white text-gray-700">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <div className="flex gap-4 p-4">
            {/* Pass the ID to the form to trigger Edit Mode */}
            <CreateAdPage adId={id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAds;