"use client";

import { useEffect, useMemo, useState } from "react";
import CouponForm from "./CouponForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export default function CouponTable() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [open, setOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);

  /* ================= FETCH ================= */
  const fetchCoupons = async () => {
    const res = await fetch(`${API_URL}/api/admin/coupons`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    });

    if (!res.ok) {
      setCoupons([]);
      return;
    }

    const data = await res.json();
    setCoupons(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  /* ================= FILTER + PAGINATION ================= */
  const filtered = useMemo(() => {
    return coupons.filter((c) =>
      c.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [coupons, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (page - 1) * perPage,
    page * perPage
  );

  /* ================= ACTIONS ================= */
  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const deleteCoupon = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;

    await fetch(`${API_URL}/api/admin/coupons/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
      },
    });

    fetchCoupons();
  };

  const editCouponHandler = async (id: number) => {
  const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
    },
  });

  const data = await res.json();
  setEditCoupon(data);
  setOpen(true);
};


  return (
    <div className="bg-white rounded">

      {/* TOP BAR */}
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Coupons</h2>

        <button
          onClick={() => {
            setEditCoupon(null);
            setOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Add new coupon
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 flex justify-between items-center text-sm">
        <div className="flex gap-2">
          <select className="border px-3 py-2 rounded">
            <option>Bulk actions</option>
            <option>Delete</option>
          </select>
          <button className="border px-3 py-2 rounded">
            Apply
          </button>
        </div>

        <div className="flex gap-2">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Search coupons"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />

        </div>
      </div>

      {/* TABLE */}
      <table className="w-full text-sm bg-gray-50">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="p-3 w-10">
              <input
                type="checkbox"
                onChange={(e) =>
                  setSelected(
                    e.target.checked ? paginated.map((c) => c.id) : []
                  )
                }
              />
            </th>
            <th className="text-left">Code</th>
            <th>Discount</th>
            <th>Type</th>
            <th>Min Cart</th>
            <th>Expiry</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginated.map((c) => (
            <tr key={c.id} className=" hover:bg-gray-50">
              <td className="p-3 text-center">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
              </td>

              <td className="p-3 font-medium">{c.code}</td>

              <td className="text-center">
                {c.discount_type === "percent"
                  ? `${c.discount_value}%`
                  : `₹${c.discount_value}`}
              </td>

              <td className="text-center capitalize">
                {c.discount_type}
              </td>

              <td className="text-center">
                ₹{c.min_cart_value || 0}
              </td>

                <td className="text-center text-xs">
                  {c.expiry_date
                    ? new Date(c.expiry_date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </td>

              <td className="text-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    c.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {c.status}
                </span>
              </td>

              <td className=" space-x-2 flex justify-center">
              <button
  onClick={() => editCouponHandler(c.id)}
  className="text-blue-600"
>
  Edit
</button>

                <div>|</div>
                <button
                  onClick={() => deleteCoupon(c.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {!paginated.length && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-400">
                No coupons found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FOOTER */}
      <div className="p-4 flex justify-between items-center text-sm">
        <select
          value={perPage}
          onChange={(e) => {
            setPage(1);
            setPerPage(Number(e.target.value));
          }}
          className="border px-3 py-2 rounded"
        >
          <option value={10}>10 rows</option>
          <option value={20}>20 rows</option>
          <option value={50}>50 rows</option>
        </select>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Previous
          </button>

          <span className="px-3 py-1 border rounded bg-blue-600 text-white">
            {page}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <CouponForm
          coupon={editCoupon}
          onClose={() => setOpen(false)}
          onSaved={fetchCoupons}
        />
      )}
    </div>
  );
}
