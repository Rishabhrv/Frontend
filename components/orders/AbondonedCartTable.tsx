"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Search, Eye, Trash2, ShoppingCart, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// --- Types ---
type CartItem = { title: string; format: "paperback" | "ebook"; quantity: number; };
type AbandonedCart = {
  user_id: number; customerName: string; email: string; phone: string;
  items: CartItem[]; totalValue: number; lastActive: string; status: string;
};

// --- Helper Functions ---
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = { pending: "bg-yellow-100 text-yellow-700", recovered: "bg-green-100 text-green-700", lost: "bg-red-100 text-red-700" };
  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
};

export default function AbandonedCartTable() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selection & Sending State
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [sendingIds, setSendingIds] = useState<number[]>([]); // Tracks who is currently receiving an email

  // Custom Popup States
  const [toast, setToast] = useState<{ open: boolean; message: string; type: "success" | "error" }>({ open: false, message: "", type: "success" });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; action: () => void } | null>(null);

  useEffect(() => { fetchCarts(); }, []);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/abandoned-carts/all/`, {
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
  const handleSendReminder = async (userIds: number[]) => {
    setConfirmModal(null); // Close the popup
    setSendingIds(userIds); // Start loading spinner on buttons

    try {
      const res = await fetch(`${API_URL}/api/admin/abandoned-carts/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        body: JSON.stringify({ userIds })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(data.msg, "success");
        setSelectedUsers(new Set()); // clear selection after bulk send
      } else {
        showToast(data.msg || "Failed to send email.", "error");
      }
    } catch (error) {
      showToast("Something went wrong.", "error");
    } finally {
      setSendingIds([]); // Stop loading spinner
    }
  };

  const handleDeleteCart = async (userId: number) => {
    setConfirmModal(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/abandoned-carts/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
      });

      if (res.ok) {
        setCarts(carts.filter(c => c.user_id !== userId));
        showToast("Cart cleared successfully", "success");
      }
    } catch (error) {
      showToast("Failed to delete cart.", "error");
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
    if (selectedUsers.size === paginatedCarts.length && paginatedCarts.length > 0) {
      setSelectedUsers(new Set()); // Deselect all on current page
    } else {
      setSelectedUsers(new Set(paginatedCarts.map(c => c.user_id))); // Select all on current page
    }
  };

  const toggleSelectOne = (id: number) => {
    const newSet = new Set(selectedUsers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedUsers(newSet);
  };

  // Global flag to disable buttons if ANY sending is happening
  const isCurrentlySending = sendingIds.length > 0;

  return (
    <div className="bg-white m-5 border border-gray-200 rounded-xl shadow-sm relative">
      
      {/* --- Header --- */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-500" /> Abandoned Carts
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage incomplete checkouts and send recovery emails.</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedUsers.size > 0 && (
            <button 
              disabled={isCurrentlySending}
              onClick={() => setConfirmModal({
                open: true,
                title: "Send Bulk Reminders",
                message: `Are you sure you want to send recovery emails to ${selectedUsers.size} selected customers?`,
                action: () => handleSendReminder(Array.from(selectedUsers))
              })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {sendingIds.length > 1 ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send ({selectedUsers.size}) Reminders</>
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
                  checked={selectedUsers.size > 0 && selectedUsers.size === paginatedCarts.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-4">Customer Details</th>
              <th className="px-6 py-4">Cart Items</th>
              <th className="px-6 py-4 text-right">Cart Value</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Active</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-3" /><p>Loading...</p></td></tr>
            ) : paginatedCarts.length > 0 ? (
              paginatedCarts.map((cart) => (
                <tr key={cart.user_id} className={`hover:bg-gray-50/50 transition-colors ${selectedUsers.has(cart.user_id) ? "bg-blue-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedUsers.has(cart.user_id)}
                      onChange={() => toggleSelectOne(cart.user_id)}
                    />
                  </td>
                  <td className="px-2 py-4">
                    <div className="font-semibold text-gray-800">{cart.customerName}</div>
                    <div className="text-xs text-gray-500">{cart.email}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{cart.phone || "No phone"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {cart.items.map((item, idx) => (
                        <div key={idx} className="text-xs line-clamp-1"><span className="font-medium text-gray-700">{item.quantity}x</span> {item.title} <span className="text-gray-400">({item.format})</span></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">₹{cart.totalValue?.toFixed(2)}</td>
                  <td className="px-6 py-4"><StatusBadge status={cart.status} /></td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDateTime(cart.lastActive)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        disabled={isCurrentlySending}
                        onClick={() => setConfirmModal({
                          open: true, title: "Send Reminder", message: `Send recovery email to ${cart.email}?`,
                          action: () => handleSendReminder([cart.user_id])
                        })}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors tooltip" title="Send Recovery Email"
                      >
                        {/* Show Spinner ONLY on the specific row being sent */}
                        {sendingIds.includes(cart.user_id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500"><ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-3" /><p>No abandoned carts found.</p></td></tr>
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