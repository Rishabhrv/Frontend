"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// --- TYPES ---
type SubscriptionRow = {
  subscription_id: number;
  name: string;
  email: string;
  plan_title: string;
  plan_key: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: string;
};

type UserOption = {
  id: number;
  name: string;
  email: string;
};

type SubscriptionPlan = {
  id: number;
  plan_key: string;
  title: string;
  base_price: number;
  discount_price: number | null; // <-- Added discount price
  duration_months: number;
  description: string;
  status: string;
  features: string[]; 
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function SubscriptionTable() {
  // --- STATE ---
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // User Subscription Modal State
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    plan_key: "",
    months: 1,
    amount_paid: "",
    payment_id: "",
  });

  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // User Subscription Delete State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<number | null>(null);

  // Plan Management State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    plan_key: "monthly",
    title: "",
    base_price: "",
    discount_price: "", // <-- Added to state
    duration_months: 1,
    description: "",
    status: "active",
    features: [] as string[],
  });

  // Plan Deletion State
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [planConfirmOpen, setPlanConfirmOpen] = useState(false);

  // --- AUTOMATIC DURATIONS MAP ---
  const PLAN_DURATIONS: Record<string, number> = {
    monthly: 1,
    quarterly: 3,
    "half-yearly": 6, // <-- Added half-yearly
    yearly: 12,
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    fetch(`${API_URL}/api/admin/subscriptions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then(r => r.json())
      .then(setRows);

    fetch(`${API_URL}/api/admin/subscription-plans`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then(r => r.json())
      .then(setPlans);
  }, []);

  useEffect(() => {
    if (plans.length > 0 && !form.plan_key) {
      setForm(prev => ({
        ...prev,
        plan_key: plans[0].plan_key,
        months: PLAN_DURATIONS[plans[0].plan_key],
      }));
    }
  }, [plans]);

  /* ================= FILTER + SEARCH ================= */
  const filtered = useMemo(() => {
    return rows.filter(row => {
      const matchesSearch =
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.email.toLowerCase().includes(search.toLowerCase()) ||
        row.plan_title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  /* ================= PLAN RESTRICTION LOGIC ================= */
  const availablePlanKeys = useMemo(() => {
    const usedKeys = plans.map(p => p.plan_key);
    // Added 'half-yearly' to the available options pool
    return ["monthly", "quarterly", "half-yearly", "yearly"].filter(key => !usedKeys.includes(key));
  }, [plans]);

  const canAddNewPlan = availablePlanKeys.length > 0;

  useEffect(() => {
    if (!showAdd) return;
    fetch(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    })
      .then(r => r.json())
      .then(setUsers);
  }, [showAdd]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  /* ================= USER SUBSCRIPTION DELETION ================= */
  const askDeleteSubscription = (id: number) => {
    setSubscriptionToDelete(id);
    setConfirmOpen(true);
  };

  const confirmDeleteSubscription = async () => {
    if (!subscriptionToDelete) return;
    const res = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setToastMsg(data.msg || "Failed to delete subscription");
      setToastOpen(true);
      return;
    }
    setRows(prev => prev.filter(s => s.subscription_id !== subscriptionToDelete));
    setConfirmOpen(false);
    setSubscriptionToDelete(null);
    setToastMsg("Subscription deleted");
    setToastOpen(true);
  };

  /* ================= PLAN MANAGEMENT (SAVE, EDIT, DELETE) ================= */
  const handleSavePlan = async () => {
    if (!planForm.title || !planForm.base_price) {
      setToastMsg("Title and Base Price are required");
      setToastOpen(true);
      return;
    }

    const method = editingPlan ? "PUT" : "POST";
    const url = editingPlan 
      ? `${API_URL}/api/admin/subscription-plans/${editingPlan.id}`
      : `${API_URL}/api/admin/subscription-plans`;

    // Clean up payload (handle empty discount price)
    const payload = {
      ...planForm,
      discount_price: planForm.discount_price === "" ? null : Number(planForm.discount_price)
    };

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setToastMsg(data.msg || "Failed to save plan");
      setToastOpen(true);
      return;
    }

    setShowPlanModal(false);
    window.location.reload(); 
  };

  const openPlanModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        plan_key: plan.plan_key,
        title: plan.title,
        base_price: plan.base_price.toString(),
        discount_price: plan.discount_price ? plan.discount_price.toString() : "", // Load discount
        duration_months: plan.duration_months,
        description: plan.description || "",
        status: plan.status,
        features: plan.features || [], 
      });
    } else {
      const defaultKey = availablePlanKeys[0] || "monthly";
      setEditingPlan(null);
      setPlanForm({
        plan_key: defaultKey, 
        title: "",
        base_price: "",
        discount_price: "",
        duration_months: PLAN_DURATIONS[defaultKey], 
        description: "",
        status: "active",
        features: [""], 
      });
    }
    setShowPlanModal(true);
  };

  const askDeletePlan = (id: number) => {
    setPlanToDelete(id);
    setPlanConfirmOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    
    const res = await fetch(`${API_URL}/api/admin/subscription-plans/${planToDelete}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      setToastMsg(data.msg || "Failed to delete plan");
      setToastOpen(true);
      setPlanConfirmOpen(false);
      setPlanToDelete(null);
      return;
    }
    
    setPlans(prev => prev.filter(p => p.id !== planToDelete));
    setPlanConfirmOpen(false);
    setPlanToDelete(null);
    setToastMsg("Plan deleted successfully");
    setToastOpen(true);
  };

  return (
    <div className="p-2 space-y-5 flex flex-col min-h-screen">
      
      {/* ================= PLANS SECTION ================= */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Manage Subscription Plans</h2>
          {canAddNewPlan && (
            <button
              onClick={() => openPlanModal()}
              className="bg-black text-white px-4 py-2 rounded text-sm cursor-pointer"
            >
              + Add New Plan
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-white flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{plan.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {plan.status}
                  </span>
                </div>
                
                {/* --- PRICE DISPLAY LOGIC --- */}
                <div className="flex items-baseline gap-2 mb-1">
                  {plan.discount_price ? (
                    <>
                      <p className="text-2xl font-semibold">₹{plan.discount_price}</p>
                      <p className="text-sm text-gray-400 line-through">₹{plan.base_price}</p>
                    </>
                  ) : (
                    <p className="text-2xl font-semibold">₹{plan.base_price}</p>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-2">{plan.duration_months} Month(s) - <span className="capitalize">{plan.plan_key.replace('-', ' ')}</span></p>
                <p className="text-xs text-gray-600 line-clamp-2">{plan.description}</p>
                
                <div className="mt-3 space-y-1">
                  {plan.features?.slice(0, 2).map((f, i) => (
                     <p key={i} className="text-xs text-gray-500">✓ {f}</p>
                  ))}
                  {plan.features?.length > 2 && <p className="text-xs text-gray-400 italic">+{plan.features.length - 2} more</p>}
                </div>
              </div>
              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-3">
                <button 
                  onClick={() => openPlanModal(plan)}
                  className="text-sm text-blue-600 hover:underline cursor-pointer font-medium"
                >
                  Edit
                </button>
                <span className="text-gray-300">|</span>
                <button 
                  onClick={() => askDeletePlan(plan.id)}
                  className="text-sm text-red-600 hover:underline cursor-pointer font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              No subscription plans created yet. Add one to get started.
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* ================= HEADER (USER SUBSCRIPTIONS) ================= */}
      <div className="flex justify-between items-center mt-4">
        <h1 className="text-2xl font-bold">User Subscriptions</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-black text-white px-4 py-2 rounded text-sm cursor-pointer"
        >
          + Assign Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap justify-between">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="text"
          placeholder="Search user, email, plan…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-600">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Validity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(row => (
              <tr key={row.subscription_id} className="border-t border-gray-200 hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-gray-500">{row.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">{row.plan_title}</td>
                <td className="px-4 py-3 text-center font-medium">₹{row.amount_paid}</td>
                <td className="px-4 py-3 text-xs text-gray-600 text-center">
                  {formatDate(row.start_date)} <br/>↓<br/> {formatDate(row.end_date)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/subscriptions/${row.subscription_id}`} className="text-blue-600 hover:underline text-xs">
                      View
                    </Link>
                    <span>|</span>
                    <button
                      onClick={() => askDeleteSubscription(row.subscription_id)}
                      className="text-red-600 hover:underline text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!paginated.length && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pb-4">
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2 text-sm cursor-pointer"
        >
          <option value={5}>5 rows</option>
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
        </select>

        {totalPages > 1 && (
          <div className="flex items-center gap-4 text-sm">
            <p className="text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer">Prev</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 border rounded cursor-pointer ${page === i + 1 ? "bg-black text-white" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Add User Subscription Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white w-full max-w-md rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Assign Subscription</h2>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Select User</label>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="">— Select a user —</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <select
              value={form.plan_key}
              onChange={e => {
                const newKey = e.target.value;
                setForm({ 
                  ...form, 
                  plan_key: newKey,
                  months: PLAN_DURATIONS[newKey] // Auto sets duration
                });
              }}
              className="w-full border rounded px-3 py-2 text-sm cursor-pointer capitalize"
            >
              {plans.map(p => (
                <option key={p.id} value={p.plan_key}>
                  {p.plan_key.replace('-', ' ')} ({p.title})
                </option>
              ))}
              {plans.length === 0 && <option value="">No plans available</option>}
            </select>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Months (Duration)"
                value={form.months}
                disabled
                className="w-full border rounded px-3 py-2 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                title="Duration is automatically set based on the selected plan"
              />
              <input
                type="number"
                placeholder="Custom Amount Paid (optional)"
                value={form.amount_paid}
                onChange={e => setForm({ ...form, amount_paid: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <input
              type="text"
              placeholder="Payment ID (optional)"
              value={form.payment_id || ""}
              onChange={e => setForm({ ...form, payment_id: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 border rounded text-sm cursor-pointer">Cancel</button>
              <button
                disabled={plans.length === 0}
                onClick={async () => {
                  if (!selectedUser) {
                    setToastMsg("Please select a user"); setToastOpen(true); return;
                  }
                  const res = await fetch(`${API_URL}/api/admin/subscriptions/create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                    body: JSON.stringify({
                      user_id: Number(selectedUser),
                      plan_key: form.plan_key || plans[0]?.plan_key,
                      months: form.months,
                      amount_paid: form.amount_paid === "" ? null : Number(form.amount_paid),
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    setToastMsg(data.msg || "Failed to create subscription"); setToastOpen(true); return;
                  }
                  window.location.reload();
                }}
                className="bg-black text-white px-4 py-2 rounded text-sm cursor-pointer disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add/Edit Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPlanModal(false)} />
          <div className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editingPlan ? "Edit Plan" : "Add New Plan"}</h2>

            <input
              type="text"
              placeholder="Plan Title (e.g., Premium Pack)"
              value={planForm.title}
              onChange={e => setPlanForm({ ...planForm, title: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />

            <select
              value={planForm.plan_key}
              onChange={e => {
                const newKey = e.target.value;
                setPlanForm({ 
                  ...planForm, 
                  plan_key: newKey,
                  duration_months: PLAN_DURATIONS[newKey] // Auto sets duration
                });
              }}
              className="w-full border rounded px-3 py-2 text-sm capitalize cursor-pointer"
              disabled={!!editingPlan} 
            >
              {editingPlan ? (
                <option value={editingPlan.plan_key}>{editingPlan.plan_key.replace('-', ' ')}</option>
              ) : (
                availablePlanKeys.map(key => (
                  <option key={key} value={key}>{key.replace('-', ' ')}</option>
                ))
              )}
            </select>

            {/* --- PRICE INPUTS --- */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Base Price (₹)"
                value={planForm.base_price}
                onChange={e => setPlanForm({ ...planForm, base_price: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Discount Price (₹) (Optional)"
                value={planForm.discount_price}
                onChange={e => setPlanForm({ ...planForm, discount_price: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>

            <textarea
              placeholder="Description"
              value={planForm.description}
              onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm h-16"
            />

            {/* --- DYNAMIC FEATURES UI --- */}
            <div className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase">Plan Features</label>
                <button 
                  onClick={() => setPlanForm(prev => ({ ...prev, features: [...prev.features, ""] }))}
                  className="text-xs bg-black text-white px-2 py-1 rounded cursor-pointer"
                >
                  + Add Feature
                </button>
              </div>
              
              {planForm.features.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-gray-400 text-xs">✓</span>
                  <input
                    type="text"
                    placeholder={`e.g., Read on any device`}
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...planForm.features];
                      newFeatures[index] = e.target.value;
                      setPlanForm(prev => ({ ...prev, features: newFeatures }));
                    }}
                    className="flex-1 border rounded px-2 py-1.5 text-sm"
                  />
                  <button 
                    onClick={() => {
                      const newFeatures = planForm.features.filter((_, i) => i !== index);
                      setPlanForm(prev => ({ ...prev, features: newFeatures }));
                    }}
                    className="text-red-500 hover:text-red-700 font-bold px-2 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
              {planForm.features.length === 0 && (
                <p className="text-xs text-gray-400 italic">No features added yet.</p>
              )}
            </div>

            <select
              value={planForm.status}
              onChange={e => setPlanForm({ ...planForm, status: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 border rounded text-sm cursor-pointer">Cancel</button>
              <button onClick={handleSavePlan} className="bg-black text-white px-4 py-2 rounded text-sm cursor-pointer">
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popups */}
      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
      
      <ConfirmPopup
        open={confirmOpen}
        title="Delete subscription?"
        message="This subscription will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        onCancel={() => {
          setConfirmOpen(false);
          setSubscriptionToDelete(null);
        }}
        onConfirm={confirmDeleteSubscription}
      />

      <ConfirmPopup
        open={planConfirmOpen}
        title="Delete Subscription Plan?"
        message="Are you sure you want to delete this plan? This action cannot be undone."
        confirmText="Delete Plan"
        onCancel={() => {
          setPlanConfirmOpen(false);
          setPlanToDelete(null);
        }}
        onConfirm={confirmDeletePlan}
      />
    </div>
  );
}