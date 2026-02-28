
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import AlertPopup from "@/components/Popups/AlertPopup";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function InvoiceButton({ orderId }: { orderId: number }) {
  const [loading, setLoading] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState("");

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/invoice/${orderId}/invoice`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to generate invoice");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);

      // Trigger browser download
      const a  = document.createElement("a");
      a.href   = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToastMsg("Could not download invoice. Please try again.");
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="mt-4 w-full flex items-center cursor-pointer justify-center gap-2 border border-gray-300 rounded py-2 text-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {loading ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Download size={15} />
          Download Invoice
        </>
      )}

            <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
      
    </button>
  );
}