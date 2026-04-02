"use client";

import { useEffect }  from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import CreateAdPage from "@/components/ads/CreateAdPage";
import "../../../app/globals.css";

const CreateAds = () => {
  useEffect(() => {
    document.title = "Manage Ads | Admin Panel";
  }, []);

  return (
    <div className="p-6 bg-white text-gray-700">
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <div className="flex gap-4 p-4">
             {/* No adId passed = Create Mode */}
            <CreateAdPage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAds;