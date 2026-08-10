"use client";

import React, { useState, useEffect } from "react";
import AlertPopup from "../Popups/AlertPopup";

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function SalesForm({
    sale,
    onClose,
    onSuccess,
}: {
    sale?: any;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: sale?.name || "",
        discount_type: sale?.discount_type || "percent",
        discount_value: sale?.discount_value || "",
        start_date: sale?.start_date ? sale.start_date.split("T")[0] : "",
        end_date: sale?.end_date ? sale.end_date.split("T")[0] : "",
        applicable_on: sale?.applicable_on || "all",
        usage_limit_per_user: sale?.usage_limit_per_user || "",
        product_ids: sale?.products ? sale.products.map((p: any) => p.id) : [],
        category_ids: sale?.categories ? sale.categories.map((c: any) => c.id) : [],
        timer_duration_hours: sale?.timer_duration_hours || "",
    });

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const [productSearch, setProductSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    const [alertConfig, setAlertConfig] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
        open: false,
        message: "",
        type: "success",
    });

    useEffect(() => {
        // Fetch products and categories for selection
        const fetchOptions = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    fetch(`${API}/api/products`).then((r) => r.json()),
                    fetch(`${API}/api/categories`).then((r) => r.json()),
                ]);
                setProducts(Array.isArray(prodRes) ? prodRes : prodRes.products || []);
                setCategories(Array.isArray(catRes) ? catRes : catRes.categories || []);
            } catch (err) {
                console.error("Error fetching options", err);
            }
        };
        fetchOptions();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("admin_token");

            const payload = {
                ...formData,
                usage_limit_per_user: formData.usage_limit_per_user
                    ? parseInt(formData.usage_limit_per_user.toString())
                    : null,
                timer_duration_hours: formData.timer_duration_hours
                    ? parseInt(formData.timer_duration_hours.toString())
                    : null,
            };

            if (sale) {
                const res = await fetch(`${API}/api/admin/discount/manage-sales/${sale.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to update sale");
            } else {
                const res = await fetch(`${API}/api/admin/discount/manage-sales`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error("Failed to create sale");
            }
            onSuccess();
        } catch (error) {
            console.error("Error saving sale", error);
            setAlertConfig({ open: true, message: "Failed to save sale", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const displayedProducts = React.useMemo(() => {
        const searchLower = productSearch.toLowerCase();
        const matching = products.filter(p => (p.name || p.title || "").toLowerCase().includes(searchLower));
        
        matching.sort((a, b) => {
            const aSelected = formData.product_ids.includes(a.id);
            const bSelected = formData.product_ids.includes(b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });

        // Always show all selected items, otherwise cap at 10 to avoid long lists
        const maxToDisplay = Math.max(10, formData.product_ids.length);
        return matching.slice(0, maxToDisplay);
    }, [products, productSearch, formData.product_ids]);

    const displayedCategories = React.useMemo(() => {
        const searchLower = categorySearch.toLowerCase();
        const matching = categories.filter(c => (c.name || "").toLowerCase().includes(searchLower));
        
        matching.sort((a, b) => {
            const aSelected = formData.category_ids.includes(a.id);
            const bSelected = formData.category_ids.includes(b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return 0;
        });

        const maxToDisplay = Math.max(10, formData.category_ids.length);
        return matching.slice(0, maxToDisplay);
    }, [categories, categorySearch, formData.category_ids]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 shrink-0">
                    <h3 className="text-xl font-bold text-gray-900">
                        {sale ? "Edit Sale" : "Create New Sale"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 rounded-full hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0 flex-1">
                    {/* Scrollable Form Body */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sale Name</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Summer 50% Off"
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Type</label>
                                <select
                                    name="discount_type"
                                    value={formData.discount_type}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all bg-white"
                                >
                                    <option value="percent">Percentage (%)</option>
                                    <option value="flat">Flat Amount (₹)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Discount Value</label>
                                <input
                                    required
                                    type="number"
                                    name="discount_value"
                                    value={formData.discount_value}
                                    onChange={handleChange}
                                    placeholder="e.g. 20"
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date</label>
                                <input
                                    required
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Date</label>
                                <input
                                    required
                                    type="date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Applicable On</label>
                                <select
                                    name="applicable_on"
                                    value={formData.applicable_on}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all bg-white"
                                >
                                    <option value="all">Entire Site</option>
                                    <option value="product">Specific Products</option>
                                    <option value="category">Specific Categories</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Usage Limit Per User</label>
                                <input
                                    type="number"
                                    name="usage_limit_per_user"
                                    value={formData.usage_limit_per_user}
                                    onChange={handleChange}
                                    placeholder="Unlimited if blank"
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Flash Timer (Hours)</label>
                                <input
                                    type="number"
                                    name="timer_duration_hours"
                                    value={formData.timer_duration_hours}
                                    onChange={handleChange}
                                    placeholder="Optional (e.g. 2 for 2 hours)"
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder-gray-400"
                                />
                            </div>

                            {formData.applicable_on === "product" && (
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Products</label>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        {/* Search Bar */}
                                        <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                                            <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                className="w-full text-sm px-1 py-1 focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                                                value={productSearch}
                                                onChange={(e) => setProductSearch(e.target.value)}
                                            />
                                        </div>
                                        {/* Select All */}
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                            <label className="flex items-center gap-3 text-sm cursor-pointer select-none text-gray-700 group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                                                    checked={formData.product_ids.length === products.length && products.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, product_ids: products.map((p) => p.id) });
                                                        } else {
                                                            setFormData({ ...formData, product_ids: [] });
                                                        }
                                                    }}
                                                />
                                                <span className="font-semibold group-hover:text-black transition-colors">Select All</span>
                                            </label>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                                                {formData.product_ids.length} selected
                                            </span>
                                        </div>
                                        {/* Product List */}
                                        <div className="max-h-52 overflow-y-auto p-2 custom-scrollbar">
                                            {displayedProducts.length === 0 ? (
                                                <div className="text-sm text-gray-400 text-center py-8">No products found</div>
                                            ) : (
                                                <>
                                                    {displayedProducts.map((p) => (
                                                        <label
                                                            key={p.id}
                                                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                                                                checked={formData.product_ids.includes(p.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, product_ids: [...formData.product_ids, p.id] });
                                                                    } else {
                                                                        setFormData({
                                                                            ...formData,
                                                                            product_ids: formData.product_ids.filter((id: any) => id !== p.id),
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            <span className="truncate">{p.name || p.title}</span>
                                                        </label>
                                                    ))}
                                                    {products.filter(p => (p.name || p.title || "").toLowerCase().includes(productSearch.toLowerCase())).length > displayedProducts.length && (
                                                        <div className="text-xs text-center text-gray-400 py-2">
                                                            Use search to find more products...
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.applicable_on === "category" && (
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Categories</label>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        {/* Search Bar */}
                                        <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                                            <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                placeholder="Search categories..."
                                                className="w-full text-sm px-1 py-1 focus:outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                                                value={categorySearch}
                                                onChange={(e) => setCategorySearch(e.target.value)}
                                            />
                                        </div>
                                        {/* Select All */}
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                            <label className="flex items-center gap-3 text-sm cursor-pointer select-none text-gray-700 group">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                                                    checked={formData.category_ids.length === categories.length && categories.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, category_ids: categories.map((c) => c.id) });
                                                        } else {
                                                            setFormData({ ...formData, category_ids: [] });
                                                        }
                                                    }}
                                                />
                                                <span className="font-semibold group-hover:text-black transition-colors">Select All</span>
                                            </label>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                                                {formData.category_ids.length} selected
                                            </span>
                                        </div>
                                        {/* Category List */}
                                        <div className="max-h-52 overflow-y-auto p-2 custom-scrollbar">
                                            {displayedCategories.length === 0 ? (
                                                <div className="text-sm text-gray-400 text-center py-8">No categories found</div>
                                            ) : (
                                                <>
                                                    {displayedCategories.map((c) => (
                                                        <label
                                                            key={c.id}
                                                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700 transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black cursor-pointer"
                                                                checked={formData.category_ids.includes(c.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, category_ids: [...formData.category_ids, c.id] });
                                                                    } else {
                                                                        setFormData({
                                                                            ...formData,
                                                                            category_ids: formData.category_ids.filter((id: any) => id !== c.id),
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            <span className="truncate">{c.name}</span>
                                                        </label>
                                                    ))}
                                                    {categories.filter(c => (c.name || "").toLowerCase().includes(categorySearch.toLowerCase())).length > displayedCategories.length && (
                                                        <div className="text-xs text-center text-gray-400 py-2">
                                                            Use search to find more categories...
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors bg-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Save Sale"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <AlertPopup
                open={alertConfig.open}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, open: false })}
            />
        </div>
    );
}


