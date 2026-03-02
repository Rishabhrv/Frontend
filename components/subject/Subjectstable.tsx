"use client";

import { useEffect, useState } from "react";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

/* ── Types ── */
type Subject = {
  id: number;
  name: string;
  slug: string;
  status: "active" | "inactive";
  product_count: number;
  created_at: string;
};

type FormState = { name: string; status: "active" | "inactive" };

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const token = () =>
  typeof window !== "undefined" ? localStorage.getItem("admin_token") ?? "" : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

/* ─────────────────────────────────────────────────────────────── */
export default function SubjectsTable() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  /* Delete */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Alert */
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  /* ── Helpers ── */
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setAlertOpen(true);
  };

  /* ── Fetch ── */
  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/subjects`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setSubjects(await res.json());
    } catch {
      showAlert("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  /* ── Open modal ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", status: "active" });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditTarget(s);
    setForm({ name: s.name, status: s.status });
    setFormError("");
    setModalOpen(true);
  };

  /* ── Save (create / update) ── */
  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Subject name is required"); return; }
    setSaving(true);
    setFormError("");

    const url    = editTarget
      ? `${API_URL}/api/subjects/${editTarget.id}`
      : `${API_URL}/api/subjects`;
    const method = editTarget ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");

      if (editTarget) {
        setSubjects(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...data } : s));
        showAlert("Subject updated successfully");
      } else {
        setSubjects(prev => [{ ...data, product_count: 0 }, ...prev]);
        showAlert("Subject created successfully");
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Toggle status ── */
  const handleToggle = async (s: Subject) => {
    try {
      const res = await fetch(`${API_URL}/api/subjects/${s.id}/toggle-status`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, status: data.status } : x));
      showAlert(`Subject ${data.status === "active" ? "activated" : "deactivated"}`);
    } catch {
      showAlert("Failed to update status");
    }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/subjects/${subjectToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setSubjects(prev => prev.filter(s => s.id !== subjectToDelete.id));
      setConfirmOpen(false);
      setSubjectToDelete(null);
      showAlert("Subject deleted successfully");
    } catch {
      showAlert("Failed to delete subject");
    } finally {
      setDeleting(false);
    }
  };

  /* ── Filtered ── */
  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  /* ────────────────────────────────── */
  return (
    <div className="min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lora:wght@400;500&display=swap');
        .display { font-family: 'Playfair Display', Georgia, serif; }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px) scale(.97) } to { opacity:1; transform:none } }
        .anim-fade { animation: fadeIn .35s ease both; }
        .anim-slide { animation: slideIn .25s cubic-bezier(.34,1.56,.64,1) both; }
        .card-shadow { box-shadow: 0 1px 0 #e2ddd6, 0 4px 24px -4px rgba(0,0,0,.08); }
        .toggle-track { transition: background .2s; }
      `}</style>

      {/* ── Header ── */}
      <div className="bg-white px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="display text-2xl font-bold text-stone-800">Subjects</h1>
          <p className="text-stone-400 text-sm mt-0.5">Manage book subject categories</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Subject
        </button>
      </div>

      <div className=" mx-auto px-4 py-8">

        {/* ── Stats + Search ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-3">
            {[
              { label: "Total",    count: subjects.length,                                       color: "bg-stone-100 text-stone-700" },
              { label: "Active",   count: subjects.filter(s => s.status === "active").length,   color: "bg-emerald-50 text-emerald-700" },
              { label: "Inactive", count: subjects.filter(s => s.status === "inactive").length, color: "bg-amber-50 text-amber-700" },
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} px-3 py-1.5 rounded-lg text-xs font-medium`}>
                <span className="font-bold text-sm">{stat.count}</span> {stat.label}
              </div>
            ))}
          </div>

          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search subjects…"
              className="pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 w-60"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white card-shadow rounded-lg border border-stone-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-stone-200 border-t-stone-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm italic">No subjects found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100 bg-gray-200">
                  {["Subject", "Slug", "Products", "Status", "Created", "Actions"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-5 py-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.map((s, i) => (
                  <tr key={s.id} className="anim-fade hover:bg-stone-50/50 transition-colors group"
                    style={{ animationDelay: `${i * 30}ms` }}>

                    <td className="px-5 py-4">
                      <p className="display font-semibold text-stone-800 text-sm">{s.name}</p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded">
                        {s.slug}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                        {s.product_count}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button onClick={() => handleToggle(s)}
                        className={`relative inline-flex items-center h-6 w-11 rounded-full toggle-track border
                          ${s.status === "active"
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-stone-200 border-stone-200"}`}>
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                          ${s.status === "active" ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                      <span className={`ml-2 text-xs font-medium ${s.status === "active" ? "text-emerald-600" : "text-stone-400"}`}>
                        {s.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-stone-400">
                      {new Date(s.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-stone-400 hover:text-amber-600 transition-colors"
                          title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setSubjectToDelete(s); setConfirmOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors"
                          title="Delete">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-xs text-stone-400 text-right mt-3">
            Showing {filtered.length} of {subjects.length} subjects
          </p>
        )}
      </div>

      {/* ────── Create / Edit Modal ────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md anim-slide">

            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <h2 className="display font-bold text-stone-800 text-lg">
                {editTarget ? "Edit Subject" : "New Subject"}
              </h2>
              <button onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                  Subject Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                  placeholder="e.g. Indian History"
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
                />
                {form.name && (
                  <p className="text-xs text-stone-400 mt-1.5 pl-1">
                    Slug: <span className="font-mono text-stone-500">
                      {form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <div className="flex gap-3">
                  {(["active", "inactive"] as const).map(opt => (
                    <label key={opt} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer text-sm transition-all
                      ${form.status === opt
                        ? opt === "active"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-stone-100 border-stone-300 text-stone-700"
                        : "border-stone-200 text-stone-400 hover:border-stone-300"}`}>
                      <input type="radio" className="sr-only" checked={form.status === opt}
                        onChange={() => setForm(f => ({ ...f, status: opt }))} />
                      <span className={`w-2 h-2 rounded-full ${form.status === opt
                        ? opt === "active" ? "bg-emerald-500" : "bg-stone-500"
                        : "bg-stone-300"}`} />
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                {editTarget ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────── Popups ────── */}
      <AlertPopup
        open={alertOpen}
        message={alertMsg}
        onClose={() => setAlertOpen(false)}
      />
      <ConfirmPopup
        open={confirmOpen}
        title="Delete Subject?"
        message={`"${subjectToDelete?.name}" will be permanently deleted. This action cannot be undone.`}
        confirmText="Delete"
        onCancel={() => { setConfirmOpen(false); setSubjectToDelete(null); }}
        onConfirm={handleDelete}
      />
    </div>
  );
}