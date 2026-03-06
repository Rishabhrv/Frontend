"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL!;

const Field = ({
  label,
  children,
  span = false,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
  hint?: string;
}) => (
  <div className={span ? "col-span-2" : ""}>
    <label className="block text-xs font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
  </div>
);

const inputCls =
  "w-full border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-300 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition";

const selectCls =
  "w-full border border-gray-200 bg-white text-sm text-gray-700 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition appearance-none";

const CouponForm = ({ coupon, onClose, onSaved }: any) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [form, setForm] = useState(
    coupon || {
      code: "",
      discount_type: "percent",
      discount_value: "",
      min_cart_value: "",
      max_discount: "",
      applicable_on: "all",
      product_type: "all",
      usage_limit: "",
      usage_per_user: 1,
      selected_products: [],
      selected_categories: [],
      start_date: "",
      expiry_date: "",
      status: "active",
    }
  );

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then(setProducts);

    fetch(`${API}/api/categories`)
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    if (coupon) {
      setForm({
        ...coupon,
        selected_products: coupon.selected_products || [],
        selected_categories: coupon.selected_categories || [],
        usage_limit: coupon.usage_limit ?? "",
        max_discount: coupon.max_discount ?? "",
        min_cart_value: coupon.min_cart_value ?? "",
      });
    }
  }, [coupon]);

  const submit = async () => {
    const method = coupon ? "PUT" : "POST";
    const url = coupon
      ? `${API}/api/admin/coupons/${coupon.id}`
      : `${API}/api/admin/coupons`;

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
      body: JSON.stringify(form),
    });

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              {coupon ? "Editing Coupon" : "New Coupon"}
            </p>
            <h3 className="text-lg font-bold text-gray-800 tracking-tight leading-tight">
              {coupon ? coupon.code : "Create Coupon"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">

            {/* ── SECTION: COUPON CODE ── */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Coupon Details</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>

            <Field label="Coupon Code" span hint="Customers will enter this at checkout">
              <input
                className={inputCls + " font-mono uppercase tracking-widest font-semibold"}
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
              />
            </Field>

            <Field label="Status">
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronIcon />
              </div>
            </Field>

            {/* ── SECTION: DISCOUNT ── */}
            <div className="col-span-2 pt-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Discount</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>

            <Field label="Discount Type">
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({ ...form, discount_type: e.target.value })
                  }
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <ChevronIcon />
              </div>
            </Field>

            <Field label="Discount Value">
              <input
                type="number"
                className={inputCls}
                placeholder={form.discount_type === "percent" ? "e.g. 20" : "e.g. 100"}
                value={form.discount_value}
                onChange={(e) =>
                  setForm({ ...form, discount_value: e.target.value })
                }
              />
            </Field>

            <Field label="Minimum Cart Value (₹)" hint="Leave blank for no minimum">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 500"
                value={form.min_cart_value}
                onChange={(e) =>
                  setForm({ ...form, min_cart_value: e.target.value })
                }
              />
            </Field>

            <Field label="Max Discount (₹)" hint="For % coupons only · optional">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 200"
                value={form.max_discount}
                onChange={(e) =>
                  setForm({ ...form, max_discount: e.target.value })
                }
              />
            </Field>

            {/* ── SECTION: APPLICABILITY ── */}
            <div className="col-span-2 pt-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Applicability</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>

            <Field label="Applicable On" span>
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.applicable_on}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      applicable_on: e.target.value,
                      selected_products: [],
                      selected_categories: [],
                    })
                  }
                >
                  <option value="all">All Products</option>
                  <option value="product">Specific Products</option>
                  <option value="category">Specific Categories</option>
                  <option value="subscription">Subscriptions</option>
                </select>
                <ChevronIcon />
              </div>
            </Field>

            <Field label="Product Type" span>
              <div className="relative">
                <select
                  className={selectCls}
                  value={form.product_type}
                  onChange={(e) =>
                    setForm({ ...form, product_type: e.target.value })
                  }
                >
                  <option value="all">All Product Types</option>
                  <option value="ebook">eBooks Only</option>
                  <option value="physical">Physical Only</option>
                </select>
                <ChevronIcon />
              </div>
            </Field>

            {form.applicable_on === "product" && (
              <Field
                label="Select Products"
                span
                hint="Hold Ctrl / Cmd to select multiple"
              >
                <select
                  multiple
                  className="w-full border border-gray-200 bg-white text-sm text-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition h-40"
                  value={form.selected_products.map(String)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selected_products: Array.from(
                        e.target.selectedOptions,
                        (o) => Number(o.value)
                      ),
                    })
                  }
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {form.applicable_on === "category" && (
              <Field
                label="Select Categories"
                span
                hint="Hold Ctrl / Cmd to select multiple"
              >
                <select
                  multiple
                  className="w-full border border-gray-200 bg-white text-sm text-gray-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 transition h-40"
                  value={form.selected_categories.map(String)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      selected_categories: Array.from(
                        e.target.selectedOptions,
                        (o) => Number(o.value)
                      ),
                    })
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* ── SECTION: USAGE LIMITS ── */}
            <div className="col-span-2 pt-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Usage Limits</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>

            <Field label="Total Usage Limit" hint="Leave blank for unlimited">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 500"
                value={form.usage_limit}
                onChange={(e) =>
                  setForm({ ...form, usage_limit: e.target.value })
                }
              />
            </Field>

            <Field label="Usage Per User">
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 1"
                value={form.usage_per_user}
                onChange={(e) =>
                  setForm({ ...form, usage_per_user: e.target.value })
                }
              />
            </Field>

            {/* ── SECTION: VALIDITY ── */}
            <div className="col-span-2 pt-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold tracking-widest text-gray-300 uppercase">Validity</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </div>

            <Field label="Start Date">
              <input
                type="date"
                className={inputCls}
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </Field>

            <Field label="Expiry Date">
              <input
                type="date"
                className={inputCls}
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
              />
            </Field>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {coupon ? "Update Coupon" : "Save Coupon"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChevronIcon = () => (
  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
);

export default CouponForm;