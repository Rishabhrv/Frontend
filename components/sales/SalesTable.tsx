"use client";

import React, { useEffect, useState } from "react";
import SalesForm from "./SalesForm";
import ConfirmPopup from "../Popups/ConfirmPopup";
import AlertPopup from "../Popups/AlertPopup";

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function SalesTable() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editSale, setEditSale] = useState<any>(null);
    const [currentFilter, setCurrentFilter] = useState<string>("All");

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
        open: false,
        message: "",
        type: "success",
    });

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

    const handleDeleteConfirmed = async () => {
        if (deleteConfirmId === null) return;
        try {
            const token = localStorage.getItem("admin_token");
            const res = await fetch(`${API}/api/admin/discount/manage-sales/${deleteConfirmId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete sale");
            setAlertConfig({ open: true, message: "Sale deleted successfully", type: "success" });
            fetchSales();
        } catch (error) {
            console.error("Error deleting sale", error);
            setAlertConfig({ open: true, message: "Failed to delete sale", type: "error" });
        } finally {
            setDeleteConfirmId(null);
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
            setAlertConfig({ open: true, message: `Sale ${newStatus === "active" ? "activated" : "deactivated"} successfully`, type: "success" });
            fetchSales();
        } catch (error) {
            console.error("Error toggling status", error);
            setAlertConfig({ open: true, message: "Failed to toggle status", type: "error" });
        }
    };

    const handleEdit = (sale: any) => {
        setEditSale(sale);
        setIsFormOpen(true);
    };

    const getSaleStatus = (sale: any) => {
        const now = new Date();
        const endDate = new Date(sale.end_date.substring(0, 10) + "T23:59:59");

        if (now > endDate) {
            return { label: "Expired", color: "text-red-700 bg-red-50", canToggle: false };
        }

        if (sale.status === "active") {
            return { label: "Active", color: "text-green-700 bg-green-50", canToggle: true };
        }

        return { label: "Inactive", color: "text-gray-600 bg-gray-100", canToggle: true };
    };

    const getDaysInfo = (sale: any) => {
        const now = new Date();
        const start = new Date(sale.start_date.substring(0, 10) + "T00:00:00");
        const end = new Date(sale.end_date.substring(0, 10) + "T23:59:59");
        const total = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        if (now > end) {
            return { text: "Ended", percent: 100, color: "bg-red-400" };
        }
        if (now < start) {
            const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { text: `Starts in ${daysUntil}d`, percent: 0, color: "bg-blue-400" };
        }
        const elapsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = total - elapsed;
        const percent = Math.round((elapsed / total) * 100);
        return { text: `${remaining}d left`, percent, color: "bg-green-500" };
    };

    const activeCount = sales.filter(s => getSaleStatus(s).label === "Active").length;
    const expiredCount = sales.filter(s => getSaleStatus(s).label === "Expired").length;
    const inactiveCount = sales.filter(s => getSaleStatus(s).label === "Inactive").length;

    const filteredSales = sales.filter(sale => {
        if (currentFilter === "All") return true;
        return getSaleStatus(sale).label === currentFilter;
    });

    const statCards = [
        {
            title: "Total Campaigns",
            value: sales.length,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            ),
            iconBg: "bg-blue-50 text-blue-600",
        },
        {
            title: "Active",
            value: activeCount,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ),
            iconBg: "bg-green-50 text-green-600",
        },
        {
            title: "Inactive",
            value: inactiveCount,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            ),
            iconBg: "bg-gray-100 text-gray-500",
        },
        {
            title: "Expired",
            value: expiredCount,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ),
            iconBg: "bg-red-50 text-red-500",
        },
    ];

    return (
        <div className="bg-white p-2">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
                <button
                    onClick={() => {
                        setEditSale(null);
                        setIsFormOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                >
                    Add new sale
                </button>
            </div>

            {/* Summary Cards */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {statCards.map((card, i) => (
                        <div
                            key={i}
                            className="border border-gray-200 rounded-lg p-4 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-default"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                                {card.icon}
                            </div>
                            <div>
                                <div className="text-[12px] text-gray-500 font-medium">{card.title}</div>
                                <div className="text-xl font-bold text-gray-800">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center text-[13px] text-gray-500 mb-4 gap-1.5">
                <button
                    onClick={() => setCurrentFilter("All")}
                    className={`${currentFilter === "All" ? "text-gray-800 font-medium" : "text-blue-600 hover:underline"} cursor-pointer`}
                >
                    All <span className="text-gray-400">({sales.length})</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => setCurrentFilter("Active")}
                    className={`${currentFilter === "Active" ? "text-gray-800 font-medium" : "text-blue-600 hover:underline"} cursor-pointer`}
                >
                    Active <span className="text-gray-400">({activeCount})</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => setCurrentFilter("Inactive")}
                    className={`${currentFilter === "Inactive" ? "text-gray-800 font-medium" : "text-blue-600 hover:underline"} cursor-pointer`}
                >
                    Inactive <span className="text-gray-400">({inactiveCount})</span>
                </button>
                <span className="text-gray-300">|</span>
                <button
                    onClick={() => setCurrentFilter("Expired")}
                    className={`${currentFilter === "Expired" ? "text-gray-800 font-medium" : "text-blue-600 hover:underline"}`}
                >
                    Expired <span className="text-gray-400">({expiredCount})</span>
                </button>
                <span className="ml-auto text-gray-400 text-[12px]">{filteredSales.length} items</span>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 text-gray-400 gap-3">
                        <svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Loading sales…</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[13px] text-gray-600">
                            <thead className="bg-gray-50/80 border-b border-gray-200">
                                <tr className="text-xs font-bold text-gray-600 uppercase">
                                    <th className="px-3 py-4">Campaign</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Discount</th>
                                    <th className="px-5 py-4">Limit</th>
                                    <th className="px-5 py-4">Timeline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSales.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                <span className="text-sm font-medium text-gray-500">No sales found</span>
                                                <span className="text-xs">Try a different filter or create a new sale.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSales.map((sale) => {
                                        const statusObj = getSaleStatus(sale);
                                        const daysInfo = getDaysInfo(sale);
                                        return (
                                            <tr key={sale.id} className="hover:bg-blue-50/30 group transition-colors">

                                                {/* Campaign name + actions */}
                                                <td className="px-3 py-4 align-top">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-500 flex items-center justify-center mt-0.5 shrink-0">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-800 text-[14px] leading-snug">{sale.name}</div>
                                                            <div className="text-[12px] flex items-center gap-1.5 mt-1">
                                                                <button
                                                                    onClick={() => handleEdit(sale)}
                                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <span className="text-gray-300">|</span>
                                                                <button
                                                                    onClick={() => setDeleteConfirmId(sale.id)}
                                                                    className="text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                                                                >
                                                                    Delete
                                                                </button>
                                                                {statusObj.canToggle && (
                                                                    <>
                                                                        <span className="text-gray-300">|</span>
                                                                        <button
                                                                            onClick={() => handleToggleStatus(sale.id, sale.status)}
                                                                            className="text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer"
                                                                        >
                                                                            {sale.status === "active" ? "Deactivate" : "Activate"}
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Status */}
                                                <td className="px-5 py-4 align-top pt-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusObj.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusObj.label === "Active" ? "bg-green-500" :
                                                            statusObj.label === "Expired" ? "bg-red-500" : "bg-gray-400"
                                                            }`}></span>
                                                        {statusObj.label}
                                                    </span>
                                                </td>
                                                {/* Discount */}
                                                <td className="px-5 py-4 align-top pt-5">
                                                    <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                                                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {sale.discount_type === "percent"
                                                            ? `${sale.discount_value}%`
                                                            : `₹${sale.discount_value}`}
                                                    </span>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                                        {sale.discount_type === "percent" ? "Percentage" : "Flat"}
                                                    </div>
                                                </td>
                                                {/* Limit */}
                                                <td className="px-5 py-4 align-top pt-5">
                                                    {sale.usage_limit_per_user ? (
                                                        <span className="inline-flex items-center gap-1 text-gray-600">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            {sale.usage_limit_per_user}/user
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-[12px]">Unlimited</span>
                                                    )}
                                                </td>
                                                {/* Timeline with progress bar */}
                                                <td className="px-5 py-4 align-top pt-4" style={{ minWidth: 170 }}>
                                                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                                                        <span>{new Date(sale.start_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                                        <span>{new Date(sale.end_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${daysInfo.color}`}
                                                            style={{ width: `${daysInfo.percent}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-1 text-right">{daysInfo.text}</div>
                                                </td>
                                            </tr>
                                        );
                                    })
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
                        setAlertConfig({ open: true, message: "Sale saved successfully", type: "success" });
                        fetchSales();
                    }}
                />
            )}

            <ConfirmPopup
                open={deleteConfirmId !== null}
                title="Delete Sale"
                message="Are you sure you want to delete this sale? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setDeleteConfirmId(null)}
            />

            <AlertPopup
                open={alertConfig.open}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, open: false })}
            />
        </div>
    );
}
