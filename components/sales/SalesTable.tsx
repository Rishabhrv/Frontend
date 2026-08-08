




"use client";

import React, { useEffect, useState } from "react";
import SalesForm from "./SalesForm";

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function SalesTable() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editSale, setEditSale] = useState<any>(null);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API}/api/admin/discount/manage-sales`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch sales");
            const data = await res.json();
            setSales(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch sales", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this sale?")) return;
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API}/api/admin/discount/manage-sales/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete sale");
            fetchSales();
        } catch (error) {
            console.error("Error deleting sale", error);
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: string) => {
        try {
            const newStatus = currentStatus === "active" ? "inactive" : "active";
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API}/api/admin/discount/manage-sales/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error("Failed to toggle status");
            fetchSales();
        } catch (error) {
            console.error("Error toggling status", error);
        }
    };

    const handleEdit = (sale: any) => {
        setEditSale(sale);
        setIsFormOpen(true);
    };

    return (
        <div className="bg-white  overflow-hidden">
            {/* Header section */}
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Sales Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your store's sales and discount rules.</p>
                </div>
                <button
                    onClick={() => {
                        setEditSale(null);
                        setIsFormOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-900 transition-all shadow-sm active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Sale
                </button>
            </div>

            {/* Table section */}
            <div className="p-0 rounded-2xl shadow-sm border border-gray-100">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <svg className="animate-spin h-8 w-8 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm font-medium">Loading sales data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4 font-semibold">Name</th>
                                    <th className="px-6 py-4 font-semibold">Discount</th>
                                    <th className="px-6 py-4 font-semibold">Valid Period</th>
                                    <th className="px-6 py-4 font-semibold">Limit/User</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                <p className="text-base font-medium text-gray-500">No active sales</p>
                                                <p className="text-sm mt-1">Get started by creating a new sale.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-900">{sale.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700">
                                                    {sale.discount_type === "percent" ? `${sale.discount_value}% OFF` : `₹${sale.discount_value} OFF`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <span>{new Date(sale.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="text-gray-400">-</span>
                                                    <span>{new Date(sale.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {sale.usage_limit_per_user ? (
                                                    <span className="inline-flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                        {sale.usage_limit_per_user}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Unlimited</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(sale.id, sale.status)}
                                                    className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-full border transition-all ${sale.status === "active"
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                        : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sale.status === "active" ? "bg-green-500" : "bg-gray-400"}`}></span>
                                                    {sale.status === "active" ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(sale)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit Sale"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(sale.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Sale"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <SalesForm
                    sale={editSale}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        fetchSales();
                    }}
                />
            )}
        </div>
    );
}


