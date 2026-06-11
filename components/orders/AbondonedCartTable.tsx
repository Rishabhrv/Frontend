"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Search, ShoppingCart, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Types ---
type CartItem = { title: string; format: "paperback" | "ebook"; quantity: number; };
type AbandonedCart = {
  cart_group_id: string; 
  user_id: number;
  imprint: "agph" | "agclassics";
  customerName: string; 
  email: string; 
  phone: string;
  items: CartItem[]; 
  totalValue: number; 
  lastActive: string; 
  status: string;
};

// --- Helper Functions ---
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const ImprintBadge = ({ imprint }: { imprint: string }) => {
  const isClassics = imprint === 'agclassics';
  return (
    <span className={`px-2 py-1 text-[9px] font-bold tracking-wider uppercase border rounded ${
      isClassics ? "bg-[#06060a] text-[#c9a84c] border-[#c9a84c]" : "bg-blue-50 text-blue-600 border-blue-200"
    }`}>
      {isClassics ? "AGClassics" : "AGPH"}
    </span>
  );
};

export default function AbandonedCartTable() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection & Sending State
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [sendingGroups, setSendingGroups] = useState<string[]>([]);

  const [toast, setToast] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; action: () => void } | null>(null);

  useEffect(() => { fetchCarts(); }, []);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/abandoned-carts/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });
      if (res.ok) setCarts(await res.json());
    } catch (error) {
      showToast("Failed to fetch carts", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, open: false })), 3000);
  };

  // --- Actions ---
  const handleSendReminder = async (groupKeys: string[]) => {
    setConfirmModal(null);
    setSendingGroups(groupKeys);

    // Transform keys ("userId_imprint") back to structured target objects
    const targets = groupKeys.map(key => {
      const [userId, imprint] = key.split('_');
      return { userId: Number(userId), imprint };
    });

    try {
      const res = await fetch(`${API_URL}/api/admin/abandoned-carts/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: JSON.stringify({ targets })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(data.msg, "success");
        setSelectedGroups(new Set());
      } else {
        showToast(data.msg || "Failed to send email.", "error");
      }
    } catch (error) {
      showToast("Something went wrong.", "error");
    } finally {
      setSendingGroups([]);
    }
  };

  // --- Filtering & Pagination Logic ---
  const filteredCarts = carts.filter(cart => 
    cart.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cart.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCarts.length / itemsPerPage) || 1;
  const paginatedCarts = filteredCarts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- Selection Logic ---
  const toggleSelectAll = () => {
    if (selectedGroups.size === paginatedCarts.length && paginatedCarts.length > 0) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(paginatedCarts.map(c => c.cart_group_id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedGroups);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedGroups(newSet);
  };

  const isCurrentlySending = sendingGroups.length > 0;

  return (
    <div className="bg-white m-5 border border-gray-200 rounded-xl shadow-sm relative">
      
      {/* --- Header --- */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-500" /> Abandoned Carts
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage incomplete checkouts and send store-specific recovery emails.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedGroups.size > 0 && (
            <button 
              disabled={isCurrentlySending}
              onClick={() => setConfirmModal({
                open: true,
                title: "Send Bulk Reminders",
                message: `Are you sure you want to send recovery emails to ${selectedGroups.size} selected carts?`,
                action: () => handleSendReminder(Array.from(selectedGroups))
              })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {sendingGroups.length > 1 ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send ({selectedGroups.size}) Reminders</>
              )}
            </button>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-4 w-12">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  checked={selectedGroups.size > 0 && selectedGroups.size === paginatedCarts.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-4">Customer Details</th>
              <th className="px-6 py-4">Store Imprint</th>
              <th className="px-6 py-4">Cart Items</th>
              <th className="px-6 py-4">Value & Time</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-3" /><p>Loading...</p></td></tr>
            ) : paginatedCarts.length > 0 ? (
              paginatedCarts.map((cart) => (
                <tr key={cart.cart_group_id} className={`hover:bg-gray-50/50 transition-colors ${selectedGroups.has(cart.cart_group_id) ? "bg-blue-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedGroups.has(cart.cart_group_id)}
                      onChange={() => toggleSelectOne(cart.cart_group_id)}
                    />
                  </td>
                  <td className="px-2 py-4">
                    <div className="font-semibold text-gray-800">{cart.customerName}</div>
                    <div className="text-xs text-gray-500">{cart.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{cart.phone || "No phone"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <ImprintBadge imprint={cart.imprint} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {cart.items.map((item, idx) => (
                        <div key={idx} className="text-xs line-clamp-1"><span className="font-medium text-gray-700">{item.quantity}x</span> {item.title} <span className="text-gray-400">({item.format})</span></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">₹{cart.totalValue?.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatDateTime(cart.lastActive)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        disabled={isCurrentlySending}
                        onClick={() => setConfirmModal({
                          open: true, title: "Send Reminder", message: `Send ${cart.imprint === 'agclassics' ? 'AG Classics' : 'AGPH'} recovery email to ${cart.email}?`,
                          action: () => handleSendReminder([cart.cart_group_id])
                        })}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors" title="Send Recovery Email"
                      >
                        {sendingGroups.includes(cart.cart_group_id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500"><ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-3" /><p>No abandoned carts found.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination --- */}
      {!loading && filteredCarts.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <p>Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCarts.length)}</span> of <span className="font-medium">{filteredCarts.length}</span> results</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"><ChevronLeft className="w-5 h-5" /></button>
            <span className="font-medium px-2">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* --- Custom Confirm Modal --- */}
      {confirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={confirmModal.action} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom Toast Notification --- */}
      {toast.open && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transform transition-all ${toast.type === 'success' ? 'bg-green-800 text-white' : 'bg-red-800 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}