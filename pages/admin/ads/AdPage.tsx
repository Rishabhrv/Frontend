"use client";

import {useEffect}  from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdsListPage from "@/components/ads/AdslistPage";
import "../../../app/globals.css";



const AdPage = () => {
  useEffect(() => {
    document.title = "Manage Ads | Admin Panel";
  }, []);

  return (
    <div className="p-6 bg-white text-gray-700">
      <div className="flex">
        <Sidebar />

        <div className="flex flex-1 flex-col">
          <Header />

          {/* CONTENT */}
          <div className="flex gap-4 p-4">
            <AdsListPage />
   

       
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdPage;
