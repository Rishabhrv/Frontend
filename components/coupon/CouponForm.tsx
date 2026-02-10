"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL!;

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
  

  /* FETCH PRODUCTS & CATEGORIES */
  useEffect(() => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(setProducts);

    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then(setCategories);
  }, []);

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


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6">

        <h3 className="text-lg font-semibold mb-4">
          {coupon ? "Edit Coupon" : "Add Coupon"}
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

          {/* CODE */}
          <input
            className="border px-3 py-2 rounded col-span-2"
            placeholder="SAVE20"
            value={form.code}
            onChange={e =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
          />

          {/* DISCOUNT */}
          <select
            className="border px-3 py-2 rounded"
            value={form.discount_type}
            onChange={e =>
              setForm({ ...form, discount_type: e.target.value })
            }
          >
            <option value="percent">Percentage (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>

          <input
            type="number"
            className="border px-3 py-2 rounded"
            placeholder="Discount value"
            value={form.discount_value}
            onChange={e =>
              setForm({ ...form, discount_value: e.target.value })
            }
          />

          {/* CART RULES */}
          <input
            type="number"
            className="border px-3 py-2 rounded"
            placeholder="Minimum cart value"
            value={form.min_cart_value}
            onChange={e =>
              setForm({ ...form, min_cart_value: e.target.value })
            }
          />

          <input
            type="number"
            className="border px-3 py-2 rounded"
            placeholder="Max discount (optional)"
            value={form.max_discount}
            onChange={e =>
              setForm({ ...form, max_discount: e.target.value })
            }
          />

          {/* USAGE LIMITS */}
          <input
            type="number"
            className="border px-3 py-2 rounded"
            placeholder="Usage limit (total)"
            value={form.usage_limit}
            onChange={e =>
              setForm({ ...form, usage_limit: e.target.value })
            }
          />

          <input
            type="number"
            className="border px-3 py-2 rounded"
            placeholder="Usage per user"
            value={form.usage_per_user}
            onChange={e =>
              setForm({ ...form, usage_per_user: e.target.value })
            }
          />

          {/* APPLY ON */}
          <select
            className="border px-3 py-2 rounded col-span-2"
            value={form.applicable_on}
            onChange={e =>
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

          {/* PRODUCT TYPE */}
          <select
            className="border px-3 py-2 rounded col-span-2"
            value={form.product_type}
            onChange={e =>
              setForm({ ...form, product_type: e.target.value })
            }
          >
            <option value="all">All Product Types</option>
            <option value="ebook">eBooks Only</option>
            <option value="physical">Physical Only</option>
          </select>

          {/* PRODUCTS */}
          {form.applicable_on === "product" && (
            <select
  multiple
  className="border col-span-2 px-3 py-2 rounded h-40"
  value={form.selected_products.map(String)}
  onChange={e =>
    setForm({
      ...form,
      selected_products: Array.from(
        e.target.selectedOptions,
        o => Number(o.value)
      ),
    })
  }
>

              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name || p.title}
                </option>
              ))}
            </select>
          )}

          {/* CATEGORIES */}
          {form.applicable_on === "category" && (
            <select
  multiple
  className="border col-span-2 px-3 py-2 rounded h-40"
  value={form.selected_categories.map(String)}
  onChange={e =>
    setForm({
      ...form,
      selected_categories: Array.from(
        e.target.selectedOptions,
        o => Number(o.value)
      ),
    })
  }
>

              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* DATES */}
          <input
            type="date"
            className="border px-3 py-2 rounded"
            value={form.start_date}
            onChange={e =>
              setForm({ ...form, start_date: e.target.value })
            }
          />

          <input
            type="date"
            className="border px-3 py-2 rounded"
            value={form.expiry_date}
            onChange={e =>
              setForm({ ...form, expiry_date: e.target.value })
            }
          />

          {/* STATUS */}
          <select
            className="border px-3 py-2 rounded col-span-2"
            value={form.status}
            onChange={e =>
              setForm({ ...form, status: e.target.value })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={submit}
            className="bg-black text-white px-5 py-2 rounded"
          >
            Save Coupon
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponForm;
