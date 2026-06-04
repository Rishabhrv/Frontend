"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AlertPopup from "@/components/Popups/AlertPopup";
import AdminGuard  from "@/components/admin/AdminGuard";
import { ReceiptData } from "@/utils/generateReceipt";
import { ReceiptButtons } from "@/components/orders/Receiptbuttons";
import { Mail, AlertCircle, CreditCard, Truck } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── Unified status config ─── */
const UNIFIED_STATUSES = [
  { value: "pending",          label: "Pending",            color: "bg-yellow-100 text-yellow-700",      emailSent: false },
  { value: "paid",             label: "Paid",               color: "bg-green-100 text-green-700",        emailSent: false },
  { value: "confirmed",        label: "Order Confirmed",    color: "bg-blue-100 text-blue-700",          emailSent: true  },
  { value: "shipped",          label: "Shipped",            color: "bg-purple-100 text-purple-700",      emailSent: true  },
  { value: "out_for_delivery", label: "Out for Delivery",   color: "bg-orange-100 text-orange-700",      emailSent: true  },
  { value: "delivered",        label: "Delivered",          color: "bg-emerald-100 text-emerald-700",    emailSent: true  },
  { value: "cancelled",        label: "Cancelled",          color: "bg-red-100 text-red-600",            emailSent: true },
];

function deriveUnifiedStatus(orderStatus: string, shippingStatus?: string): string {
  if (orderStatus === "pending") return "pending";
  if (orderStatus === "cancelled") return "cancelled";

  if (shippingStatus === "delivered")        return "delivered";
  if (shippingStatus === "out_for_delivery") return "out_for_delivery";
  if (shippingStatus === "shipped")          return "shipped";
  if (shippingStatus === "confirmed")        return "confirmed";
  
  return orderStatus || "pending";
}

const NEEDS_SHIPPING_FIELDS = new Set(["shipped", "out_for_delivery", "delivered"]);

function Badge({ value }: { value: string }) {
  const cfg = UNIFIED_STATUSES.find(s => s.value === value);
  const cls = cfg?.color ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

const STEPS = [
  { key: "confirmed",        label: "Order Confirmed" },
  { key: "shipped",          label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered",        label: "Delivered" },
];

function ShippingTracker({ current }: { current: string }) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center w-full mt-2">
      {STEPS.map((step, idx) => {
        const done   = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${done ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-300"}
                ${active ? "ring-2 ring-blue-200" : ""}`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px]
                ${done ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${idx < currentIdx ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}


/* ════════════════════════════════════════════════════════
   TIMELINE LOGIC & COMPONENT
════════════════════════════════════════════════════════ */
const buildTimeline = (order: any, customer: any, shipping: any, logs: any[]) => {
  const events: any[] = [];
  const baseTime = new Date(order.created_at).getTime();

  events.push({
    id: 'order_placed',
    timestamp: new Date(baseTime),
    title: `Order confirmation email was sent to ${customer.name || customer.email}.`,
    iconType: 'mail'
  });
  
  if (order.payment_status === 'success') {
    events.push({
      id: 'order_payment',
      timestamp: new Date(baseTime - 1000), 
      title: `A ₹${order.total_amount} INR payment was processed on Cards, UPI, NB, Wallets by Razorpay.`,
      desc: order.razorpay_payment_id ? `Payment ID: ${order.razorpay_payment_id}` : '',
      iconType: 'payment'
    });
  }

  events.push({
    id: 'order_checkout',
    timestamp: new Date(baseTime - 2000), 
    title: `${customer.name || 'Customer'} placed this order on Online Store.`,
    desc: `Checkout #${order.id}`,
    iconType: 'dot'
  });

  if (shipping) {
    if (shipping.confirmed_at) events.push({ id: 'ship_conf', timestamp: new Date(shipping.confirmed_at), title: 'This order was confirmed and is being prepared.', iconType: 'dot' });
    if (shipping.shipped_at) events.push({ id: 'ship_ship', timestamp: new Date(shipping.shipped_at), title: `Shipment dispatched via ${shipping.courier || 'Courier'}.`, desc: shipping.tracking_number ? `Tracking ID: ${shipping.tracking_number}` : '', iconType: 'truck' });
    if (shipping.out_for_delivery_at) events.push({ id: 'ship_ofd', timestamp: new Date(shipping.out_for_delivery_at), title: 'Shipment is out for delivery.', iconType: 'truck' });
    if (shipping.delivered_at) events.push({ id: 'ship_del', timestamp: new Date(shipping.delivered_at), title: 'Shipment was successfully delivered.', iconType: 'dot' });
  }

  // 3. System Logs (Emails sent to BOTH customer and admin)
  if (logs && logs.length > 0) {
    logs.forEach((log) => {
      let details: any = {};
      
      // 🌟 FIX: Safely handle both String (Localhost) and Object (Live Server)
      if (typeof log.details === 'string') {
        try { details = JSON.parse(log.details); } catch(e) {}
      } else if (typeof log.details === 'object' && log.details !== null) {
        details = log.details;
      }

      if (log.event_type === 'email_sent') {
        const isAdmin = details.recipient_type === 'admin';
        
        // Fallback checks to ensure it NEVER says undefined
        const emailLabel = details.recipient_email || customer.email || 'customer';
        const targetLabel = isAdmin ? `Admin (${emailLabel})` : `${emailLabel}`;
        const subjectLabel = details.subject || 'Order Update';

        events.push({
           id: `log_${log.id}`,
           timestamp: new Date(log.created_at),
           title: `System sent a '${subjectLabel}' email to ${targetLabel}.`,
           desc: log.status === 'failed' ? `Failed: ${log.error_message}` : '',
           iconType: log.status === 'failed' ? 'error' : 'mail',
           isEmailLog: true,
           status: log.status
        });
      }
    });
  }

  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const grouped: { date: string, items: any[] }[] = [];
  let currentGroup: any = null;

  events.forEach(ev => {
     const dateStr = ev.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
     if (!currentGroup || currentGroup.date !== dateStr) {
        currentGroup = { date: dateStr, items: [] };
        grouped.push(currentGroup);
     }
     currentGroup.items.push(ev);
  });

  return grouped;
};

function OrderTimeline({ order, customer, shipping, logs }: any) {
  const groupedEvents = buildTimeline(order, customer, shipping, logs);

  const getIcon = (type: string) => {
    switch(type) {
      case 'payment': return <CreditCard className="w-3.5 h-3.5 text-gray-500" />;
      case 'truck': return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'mail': return <Mail className="w-3.5 h-3.5 text-purple-600" />;
      case 'dot': default: return <span className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <div className="px-6">
      <h3 className="text-base font-semibold text-gray-800 mb-6">Timeline</h3>
      <div className="space-y-6">
        {groupedEvents.map((group, gIdx) => (
          <div key={gIdx}>
            <h4 className="text-xs font-bold text-gray-500 mb-4">{group.date}</h4>
            
            <div className="relative border-l border-gray-300 ml-2 space-y-6 pb-2">
              {group.items.map((item: any, iIdx: number) => (
                <div key={iIdx} className="relative pl-8">
                  <span className="absolute -left-3 top-0 bg-[#f6f6f7] border border-gray-300 w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
                    {getIcon(item.iconType)}
                  </span>
                  
                  <div className="flex justify-between items-start gap-4">
                     <p className="text-sm text-gray-700 leading-snug">{item.title}</p>
                     <span className="text-[11px] text-gray-500 whitespace-nowrap pt-0.5 font-medium">
                        {item.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                     </span>
                  </div>
                  {item.desc && (
                     <p className={`text-xs mt-1 ${item.status === 'failed' ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {item.desc}
                     </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function OrderDetailPage() {
  const { query, back } = useRouter();

  const [data, setData] = useState<any>(null);
  const [unifiedStatus, setUnifiedStatus] = useState("pending");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Address Edit State Fields (Restricted to 5 fields)
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address: "", city: "", state: "", pincode: "", phone: ""
  });
  
  useEffect(() => {
    document.title = "Manage Orders | Admin Panel";
  }, []);

  useEffect(() => {
    if (!query.id) return;
    fetch(`${API_URL}/api/admin/orders/${query.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setUnifiedStatus(deriveUnifiedStatus(d.order.status, d.shipping?.status));
        setCourier(d.shipping?.courier || "");
        setTracking(d.shipping?.tracking_number || "");
        
        // Initialize Address Form
        if (d.billing) {
          setAddressForm({
            address: d.billing.address || "",
            city: d.billing.city || "",
            state: d.billing.state || "",
            pincode: d.billing.pincode || "",
            phone: d.billing.phone || d.customer?.phone || ""
          });
        }
      });
  }, [query.id]);

  const selectedMeta = UNIFIED_STATUSES.find(s => s.value === unifiedStatus)!;
  const needsShipping = NEEDS_SHIPPING_FIELDS.has(unifiedStatus);

  const handleUpdate = async () => {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/admin/orders/${data.order.id}/unified-status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify({
        unifiedStatus,
        courier:          needsShipping ? courier : "",
        tracking_number: needsShipping ? tracking : "",
      }),
    });
    setSaving(false);
    const json = await res.json();
    setToastMsg(res.ok
      ? (selectedMeta.emailSent ? "Status updated & email sent to customer." : "Status updated.")
      : (json.msg || "Update failed."));
    setToastOpen(true);

    if (res.ok) {
      // Re-fetch data to get the newest logs for the timeline
      fetch(`${API_URL}/api/admin/orders/${data.order.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      })
      .then(r => r.json())
      .then(updatedData => {
         setData(updatedData);
         setUnifiedStatus(deriveUnifiedStatus(updatedData.order.status, updatedData.shipping?.status));
      });
    }
  };

  const handleAddressSave = async () => {
    setAddressSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${data.order.id}/address`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(addressForm)
      });
      const json = await res.json();
      setAddressSaving(false);

      if (res.ok) {
        setToastMsg("Shipping address details updated.");
        setToastOpen(true);
        setIsEditingAddress(false);
        setData((prev: any) => ({
          ...prev,
          billing: {
            ...prev.billing,
            ...addressForm
          }
        }));
      } else {
        setToastMsg(json.msg || "Failed to update details.");
        setToastOpen(true);
      }
    } catch (err) {
      setAddressSaving(false);
      setToastMsg("An error occurred during changes.");
      setToastOpen(true);
    }
  };

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm gap-2">
        <svg className="animate-spin w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Loading order…
      </div>
    );
  }

  const { order, customer, billing, shipping, items, logs } = data;
  const ebookItems     = items.filter((i: any) => i.format === "ebook");
  const paperbackItems = items.filter((i: any) => i.format === "paperback");
  const isEbookOnly    = paperbackItems.length === 0 && ebookItems.length > 0;
  const receiptData: ReceiptData = { order, customer, billing, shipping, items };

  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition";

  return (
    <AdminGuard pageKey="orders">
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="p-6 max-w-7xl mx-auto w-full">

          {/* Page header */}
          <div className="mb-5">
            <button onClick={back} className="cursor-pointer text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition mb-3">
              ← Back to Orders
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-800">Order #{order.id}</h1>
              <Badge value={unifiedStatus} />
              <ReceiptButtons receiptData={receiptData} items={items} unifiedStatus={unifiedStatus} />

              <span className="text-xs text-gray-400 ml-auto">
                Placed {formatDateTime(order.created_at)}
              </span>
            </div>
            {order.razorpay_payment_id && (
              <p className="text-xs text-gray-400 mt-1">
                Payment ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{order.razorpay_payment_id}</code>
              </p>
            )}
          </div>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── LEFT (2/3) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Customer + Shipping Address Block */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-3">Customer Profile</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {customer.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{customer.phone}</p>
                </div>

                {/* Shipping Address Column */}
                <div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                    <h2 className="text-sm font-semibold text-gray-700">Shipping Address</h2>
                    {!isEditingAddress && (
                      <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                      >
                        Edit Address
                      </button>
                    )}
                  </div>

                  {isEditingAddress ? (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 font-medium mb-1">
                        Modifying address details for: <span className="text-gray-700 font-bold">{billing?.first_name} {billing?.last_name}</span>
                      </div>
                      
                      <textarea 
                        placeholder="Street address" 
                        rows={2} 
                        className={inputCls} 
                        value={addressForm.address} 
                        onChange={e => setAddressForm({...addressForm, address: e.target.value})} 
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City" className={inputCls} value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                        <input type="text" placeholder="State" className={inputCls} value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} />
                      </div>
                      <div>
                        <input type="text" placeholder="PIN Code" maxLength={6} className={inputCls} value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} />
                      </div>
                      <div>
                        <input type="text" placeholder="Phone Number" className={inputCls} value={addressForm.phone} onChange={e => setAddressForm({...addressForm, phone: e.target.value})} />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 text-xs">
                        <button onClick={() => setIsEditingAddress(false)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md font-medium transition cursor-pointer">
                          Cancel
                        </button>
                        <button onClick={handleAddressSave} disabled={addressSaving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition cursor-pointer disabled:opacity-50">
                          {addressSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    billing?.address ? (
                      <address className="not-italic text-sm text-gray-600 leading-relaxed">
                        <span className="font-semibold text-gray-800">{billing.first_name} {billing.last_name}</span><br />
                        {billing.address}<br />
                        {billing.city}, {billing.state} – {billing.pincode}<br />
                        {billing.phone && <span className="text-xs text-gray-500 block mt-1">Contact: {billing.phone}</span>}
                      </address>
                    ) : (
                      <p className="text-sm text-gray-400">No address on file.</p>
                    )
                  )}
                </div>
              </div>

              {/* Ebook items */}
              {ebookItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">E-Books</span>
                    <span className="bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full">{ebookItems.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ebookItems.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img src={`${API_URL}${item.main_image}`} alt={item.title}
                                className="w-10 h-14 object-cover rounded border border-gray-200 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>
                                <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">ebook</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paperback items */}
              {paperbackItems.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Paperbacks</span>
                    <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">{paperbackItems.length}</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paperbackItems.map((item: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img src={`${API_URL}${item.main_image}`} alt={item.title}
                                className="w-10 h-14 object-cover rounded border border-gray-200 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-gray-800 leading-snug">{item.title}</p>
                                <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">paperback</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order total Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Payment Status: </span>
                  <Badge value={order.payment_status} />
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                  <span>Subtotal</span>
                  <span>₹{items.reduce((s: number, i: any) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                </div>
                {order.coupon_code && (
                  <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                    <span>Coupon <code className="bg-green-50 px-1.5 rounded text-xs">{order.coupon_code}</code></span>
                    <span>−₹{order.coupon_discount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                  <span>Shipping</span>
                  <span>{shipping?.shipping_cost ? `₹${shipping.shipping_cost}` : "Free"}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-gray-900 text-base pt-3 border-t border-gray-100">
                  <span>Order Total</span>
                  <span>₹{order.total_amount}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR (1/3) ── */}
            <div className="space-y-5">
              {shipping?.status && !isEbookOnly && !["pending", "cancelled"].includes(unifiedStatus) && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2 mb-4">Shipment Progress</h3>
                  <ShippingTracker current={shipping.status} />

                  {shipping.courier && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Courier</span>
                        <span className="text-gray-700 font-medium">{shipping.courier}</span>
                      </div>
                      {shipping.tracking_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Tracking</span>
                          <code className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{shipping.tracking_number}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── UNIFIED STATUS PANEL ── */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Update Order Status</h3>

                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={unifiedStatus} onChange={e => setUnifiedStatus(e.target.value)}>
                    {UNIFIED_STATUSES
                      .filter(s => isEbookOnly ? ["pending", "paid", "confirmed", "cancelled"].includes(s.value) : true)
                      .map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))
                    }
                  </select>
                </div>

                {needsShipping && (
                  <>
                    <div>
                      <label className={labelCls}>Courier</label>
                      <select className={inputCls} value={courier} onChange={e => setCourier(e.target.value)}>
                        <option value="">Select courier</option>
                        <option value="DTDC">DTDC</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="Bluedart">Bluedart</option>
                        <option value="India Post">India Post</option>
                        <option value="Ekart">Ekart</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>Tracking ID</label>
                      <input
                        className={inputCls}
                        value={tracking}
                        onChange={e => setTracking(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                  </>
                )}

                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  {selectedMeta.emailSent ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      Customer will be notified by email.
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      No email sent for this status.
                    </>
                  )}
                </p>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Updating…
                    </>
                  ) : selectedMeta.emailSent ? "Update & Notify Customer" : "Update Status"}
                </button>
              </div>

            </div>
          </div>

          {/* ── TIMELINE (BOTTOM) ── */}
          <div className="mt-6">
            <OrderTimeline 
              order={order} 
              customer={customer} 
              shipping={shipping} 
              logs={logs || []} 
            />
          </div>

        </div>
      </div>

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
    </AdminGuard>
  );
}