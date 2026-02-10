"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AlertPopup from "@/components/Popups/AlertPopup";


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

export default function OrderDetailPage() {
  const { query, back } = useRouter();
  const [data, setData] = useState<any>(null);
  const [courier, setCourier] = useState("");
const [tracking, setTracking] = useState("");
const [shippingStatus, setShippingStatus] = useState("confirmed");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");


  

  useEffect(() => {
    if (!query.id) return;
    fetch(`${API_URL}/api/admin/orders/${query.id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    })
      .then((r) => r.json())
      .then(data => {
  setData(data);
  if (data.shipping) {
    setCourier(data.shipping.courier || "");
    setTracking(data.shipping.tracking_number || "");
    setShippingStatus(data.shipping.status || "confirmed");
  }
});
  }, [query.id]);

  if (!data) return <div className="p-6">Loading…</div>;

  const { order, customer, billing, shipping,  items } = data;

  const ebookItems = items.filter(
    (item: any) => item.format === "ebook"
  );
  
  const paperbackItems = items.filter(
    (item: any) => item.format === "paperback"
  );


  return (
    <div className="flex p-6">
      <Sidebar />
      <div className="flex-1">
        <Header />

        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* MAIN */}
          <div className="lg:col-span-3 space-y-6">
            <button onClick={back} className="text-blue-600 text-sm">
              ← Back to orders
            </button>

            <h1 className="text-2xl font-bold">
              Order #{order.id}
            </h1>

            <div className="text-gray-500 text-sm">Payment via Credit Card/Debit Card/NetBanking ({order.razorpay_payment_id || "—"}) Paid on {formatDate(order.created_at)}.</div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-gray-300 rounded p-4">
              {/* LEFT — GENERAL */}
              <div className="space-y-3">
                <h2 className="font-semibold text-sm border-b border-gray-300 pb-2">
                  General
                </h2>
            
                <div>
                  <p className="text-xs text-gray-500">Date created</p>
                  <p className="text-sm">{formatDate(order.created_at)}</p>
                </div>
            
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <select className="mt-1 w-full rounded border border-gray-300 px-3 py-1 text-sm">
                    <option value="">Change status</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
            
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm font-medium">{customer.name}</p>
                </div>
              </div>
            
              {/* RIGHT — SHIPPING */}
              <div className="space-y-3">
                <h2 className="font-semibold text-sm border-b border-gray-300 pb-2">
                  Shipping
                </h2>
            
                <div className="text-sm leading-5">
                  <p className="font-medium">{customer.name}</p>
                  <p>{billing.address}</p>
                  <p>
                    {billing.city}, {billing.state}
                  </p>
                  <p>
                    {billing.country} – {billing.pincode}
                  </p>
                </div>
            
                <div>
                  <p className="text-xs text-gray-500">Email address</p>
                  <p className="text-sm">{customer.email}</p>
                </div>
            
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm">{customer.phone}</p>
                </div>
              </div>
            </div>


           {/* 📘 EBOOK ITEMS */}
            {ebookItems.length > 0 && (

              <>
                <h3 className="text-sm font-semibold">
                  E-Books
                </h3>
                 <div className="bg-white border border-gray-300 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
            
                  <tbody>
                    {ebookItems.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2 flex items-center gap-3">
                          <img
                            src={`${API_URL}${item.main_image}`}
                            alt={item.title}
                            className="h-16 w-12 rounded border border-gray-300 object-cover"
                          />
            
                          <div>
                            <p className="font-medium text-xs">{item.title}</p>
                            <span className="inline-block mt-1 rounded px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                              ebook
                            </span>
                          </div>
                        </td>
            
                        <td className="px-4 py-2 text-center text-xs">
                          {item.quantity}
                        </td>
            
                        <td className="px-4 py-2 text-right text-xs">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
             
            )}


            {/* 📦 PAPERBACK ITEMS */}
            {paperbackItems.length > 0 && (
              <>
                <h3 className=" text-sm font-semibold">
                  Paperbacks
                </h3>

                <div className="bg-white border border-gray-300 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-center">Qty</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
            
                  <tbody>
                    {paperbackItems.map((item: any, i: number) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2 flex items-center gap-3">
                          <img
                            src={`${API_URL}${item.main_image}`}
                            alt={item.title}
                            className="h-16 w-12 rounded border border-gray-300 object-cover"
                          />
            
                          <div>
                            <p className="font-medium text-xs">{item.title}</p>
                            <span className="inline-block mt-1 rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                              paperback
                            </span>
                          </div>
                        </td>
            
                        <td className="px-4 py-2 text-center text-xs">
                          {item.quantity}
                        </td>
            
                        <td className="px-4 py-2 text-right text-xs">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
              
            )}
            <div className="text-right  text-sm">
              Shipping Cost: ₹ 00
            </div>


            <div className="text-right font-bold text-sm">
              Order Total: ₹{order.total_amount}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-300 rounded p-4 space-y-3">
  <h3 className="font-semibold">Shipping</h3>

  {/* STATUS */}
  <div>
    <label className="block text-xs text-gray-500 mb-1">
      Shipping status
    </label>
    <select
      value={shippingStatus}
      onChange={e => setShippingStatus(e.target.value)}
      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
    >
      <option value="confirmed">Order Confirmed</option>
      <option value="shipped">Shipped</option>
      <option value="out_for_delivery">Out for delivery</option>
      <option value="delivered">Delivered</option>
    </select>
  </div>

  {/* COURIER */}
  <div>
    <label className="block text-xs text-gray-500 mb-1">
      Courier
    </label>
    <select
      value={courier}
      onChange={e => setCourier(e.target.value)}
      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
    >
      <option value="">Select courier</option>
      <option value="DTDC">DTDC</option>
      <option value="Delhivery">Delhivery</option>
      <option value="Bluedart">Bluedart</option>
      <option value="India Post">India Post</option>
      <option value="Ekart">Ekart</option>
    </select>
  </div>

  {/* TRACKING */}
  <div>
    <label className="block text-xs text-gray-500 mb-1">
      Tracking ID
    </label>
    <input
      value={tracking}
      onChange={e => setTracking(e.target.value)}
      placeholder="Enter tracking number"
      className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
    />
  </div>
</div>

             <div className="bg-white border border-gray-300 rounded p-4">
              <h3 className="font-semibold mb-2">Order actions</h3>
              <button
  onClick={() => {
    fetch(`${API_URL}/api/admin/orders/${order.id}/shipping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify({
        courier,
        tracking_number: tracking,
        status: shippingStatus,
      }),
    }).then(() => {
        setToastMsg("Shipping updated");
        setToastOpen(true);
    }      
    );
  }}
  className="mt-3 w-full bg-blue-600 text-white py-2 rounded"
>
  Update Shipping
</button>

            </div>


          </div>
        </div>
      </div>
                            <AlertPopup
                              open={toastOpen}
                              message={toastMsg}
                              onClose={() => setToastOpen(false)}
                            />
    </div>
  );
}
