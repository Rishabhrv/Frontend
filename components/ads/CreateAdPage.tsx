"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Image, Link2, Clock, Target, Calendar,
  ChevronDown, Upload, X, Eye, Save, Loader2
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ─── shared sub-components ─── */
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-medium text-gray-600 mb-1.5">
    {children}
  </label>
);

const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-1 text-xs text-gray-700">{children}</p>
);

const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
      <span className="text-blue-500">{icon}</span>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
    </div>
    <div className="p-5 flex flex-col gap-5">{children}</div>
  </div>
);

const inputCls =
  "w-full bg-white border border-gray-200 text-gray-800 text-sm px-3.5 py-2.5 rounded-lg outline-none placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all duration-150";

const selectCls = `${inputCls} cursor-pointer appearance-none`;

type AdForm = {
  title: string;
  ad_type: string;
  image_url: string;
  alt_text: string;
  link_url: string;
  link_target: string;
  html_content: string;
  popup_delay_seconds: number;
  popup_frequency: string;
  show_on: string;
  target_imprint: string;
  start_date: string;
  end_date: string;
  priority: number;
  status: string;
};

const DEFAULTS: AdForm = {
  title: "",
  ad_type: "popup",
  image_url: "",
  alt_text: "",
  link_url: "",
  link_target: "_blank",
  html_content: "",
  popup_delay_seconds: 3,
  popup_frequency: "once_per_session",
  show_on: "all",
  target_imprint: "all",
  start_date: "",
  end_date: "",
  priority: 0,
  status: "inactive",
};

const AD_TYPES = [
  { value: "popup",         label: "Popup",         desc: "Overlay shown after a delay" },
  { value: "top_banner",    label: "Top Banner",    desc: "Full-width bar at page top" },
  { value: "bottom_banner", label: "Bottom Banner", desc: "Full-width bar at page bottom" },
  { value: "sidebar",       label: "Sidebar",       desc: "Appears in the page sidebar" },
];

const SHOW_ON_OPTIONS: Record<string, { value: string; label: string }[]> = {
  popup: [
    { value: "all",      label: "All Pages" },
    { value: "home",     label: "Home" },
    { value: "category", label: "Category Pages" },
    { value: "product",  label: "Product Pages" },
  ],
  top_banner: [
    { value: "all",      label: "All Pages" },
    { value: "home",     label: "Home" },
    { value: "category", label: "Category Pages" },
  ],
  bottom_banner: [
    { value: "all",      label: "All Pages" },
    { value: "home",     label: "Home" },
    { value: "category", label: "Category Pages" },
    { value: "product",  label: "Product Pages" },
  ],
};

export default function CreateAdPage({ adId }: { adId?: string | number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!adId;

  const [form, setForm] = useState<AdForm>(DEFAULTS);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AdForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // 1. Fetch Ad Data if in Edit Mode
  useEffect(() => {
    if (!isEditMode || !adId) return;

    const fetchAd = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/ads/${adId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
        });
        if (!res.ok) throw new Error("Failed to load ad data");
        const data = await res.json();

        // Format dates strictly to YYYY-MM-DD for the <input type="date">
        const formattedStart = data.start_date ? new Date(data.start_date).toISOString().split("T")[0] : "";
        const formattedEnd = data.end_date ? new Date(data.end_date).toISOString().split("T")[0] : "";

        setForm({
          ...DEFAULTS,
          ...data,
          start_date: formattedStart,
          end_date: formattedEnd,
        });

        // Set Image Preview if URL exists
        if (data.image_url) {
          setImagePreview(`${API_URL}${data.image_url}`);
        }
      } catch (err) {
        setError("Could not load advertisement data.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAd();
  }, [adId, isEditMode]);

  const handleAdTypeChange = (newType: string) => {
    let defaultShowOn = "all";
    if (newType === "top_banner" || newType === "bottom_banner") defaultShowOn = "home";
    if (newType === "sidebar") defaultShowOn = "category";
    setForm((prev) => ({ ...prev, ad_type: newType, show_on: defaultShowOn }));
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_URL}/api/admin/ads/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: fd,
      });
      const data = await res.json();
      set("image_url", data.file_path);
      // Update preview to the server-hosted URL
      setImagePreview(`${API_URL}${data.file_path}`);
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // 2. Dynamic Submit (POST for Create, PUT for Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError("Ad title is required.");
    if (form.status === "scheduled") {
      if (!form.start_date) return setError("Start date is required.");
      if (!form.end_date)   return setError("End date is required.");
      if (form.start_date > form.end_date) return setError("End date must be after start date.");
    }

    setSaving(true);
    const url = isEditMode ? `${API_URL}/api/admin/ads/${adId}` : `${API_URL}/api/admin/ads`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/admin/ads/AdPage");
    } catch {
      setError("Failed to save ad. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPopup   = form.ad_type === "popup";
  const isSidebar = form.ad_type === "sidebar";
  const showOnOptions = SHOW_ON_OPTIONS[form.ad_type];

  // Show a loading state while fetching the old data so the form doesn't flicker empty
  if (initialLoading) {
    return (
      <div className="w-full min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen  text-gray-800 pb-24 text-sm">

      {/* ── Page header ── */}
      <div className=" bg-white px-6 md:px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p onClick={() => router.push("/admin/ads/AdPage")} className="text-xs text-gray-400 mb-0.5 cursor-pointer hover:text-blue-500 transition">
            Ads Manager
          </p>
          {/* Dynamic Page Title */}
          <h1 className="text-xl font-semibold text-gray-800">
            {isEditMode ? "Edit Advertisement" : "Create New Advertisement"}
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 p-4"
      >
        {/* ══ LEFT COLUMN ══ */}
        <div className="flex flex-col gap-5">

          {/* 1. Basic Info */}
          <SectionCard title="Basic Info" icon={<Target size={15} />}>
            <div>
              <FieldLabel>Ad Title (internal) *</FieldLabel>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Homepage Summer Popup"
                className={inputCls}
              />
              <FieldHint>Only visible to admins. Shown in the ads list.</FieldHint>
            </div>

            <div>
              <FieldLabel>Ad Type *</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AD_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleAdTypeChange(t.value)}
                    className={`text-left p-3 rounded-xl border transition-all duration-150
                      ${form.ad_type === t.value
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                  >
                    <p className={`text-xs font-semibold mb-0.5 ${form.ad_type === t.value ? "text-blue-600" : "text-gray-700"}`}>
                      {t.label}
                    </p>
                    <p className="text-[11px] text-gray-700">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* 2. Creative */}
          <SectionCard title="Creative" icon={<Image size={15} />}>
            <div>
              <FieldLabel>Ad Image</FieldLabel>
              <div
                onClick={() => fileRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-2
                  border-2 border-dashed border-gray-200 rounded-xl
                  cursor-pointer transition-all duration-150 overflow-hidden bg-gray-50
                  hover:border-blue-300 hover:bg-blue-50/30
                  ${imagePreview ? "h-[180px]" : "h-[120px]"}
                `}
              >
                {imagePreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-white/60 opacity-0 hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
                      <Upload size={15} className="text-blue-500" />
                      <span className="text-xs text-blue-500 font-medium">Replace Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    {uploading
                      ? <Loader2 size={20} className="text-blue-400 animate-spin" />
                      : <Upload size={20} className="text-gray-300" />
                    }
                    <span className="text-xs text-gray-400">
                      {uploading ? "Uploading…" : "Click to upload image"}
                    </span>
                    <span className="text-[11px] text-gray-300">PNG, JPG, GIF, WebP</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
              {imagePreview && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setImagePreview(null); set("image_url", ""); }}
                  className="mt-2 text-[11px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <X size={10} /> Remove image
                </button>
              )}
            </div>

            <div>
              <FieldLabel>Image Alt Text</FieldLabel>
              <input
                value={form.alt_text || ""}
                onChange={(e) => set("alt_text", e.target.value)}
                placeholder="Describe the image for accessibility"
                className={inputCls}
              />
            </div>

            {/* HTML content only for popup */}
            {isPopup && (
              <div>
                <FieldLabel>HTML Content (optional)</FieldLabel>
                <textarea
                  value={form.html_content || ""}
                  onChange={(e) => set("html_content", e.target.value)}
                  placeholder='<h2>Sale ends tonight!</h2><p>Use code <strong>SAVE20</strong></p>'
                  rows={5}
                  className={`${inputCls} resize-y`}
                />
                <FieldHint>Rendered inside the popup. Leave blank to use image only.</FieldHint>
              </div>
            )}
          </SectionCard>

          {/* 3. Link */}
          <SectionCard title="Link & CTA" icon={<Link2 size={15} />}>
            <div>
              <FieldLabel>Destination URL</FieldLabel>
              <input
                value={form.link_url || ""}
                onChange={(e) => set("link_url", e.target.value)}
                placeholder="https://example.com/sale"
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>Open Link In</FieldLabel>
              <div className="relative">
                <select value={form.link_target} onChange={(e) => set("link_target", e.target.value)} className={selectCls}>
                  <option value="_blank">New tab</option>
                  <option value="_self">Same tab</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </SectionCard>

          {/* 4. Popup settings */}
          {isPopup && (
            <SectionCard title="Popup Behaviour" icon={<Clock size={15} />}>
              <div>
                <FieldLabel>Show after (seconds)</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.popup_delay_seconds}
                  onChange={(e) => set("popup_delay_seconds", +e.target.value)}
                  className={inputCls}
                />
                <FieldHint>How many seconds after page load before the popup appears.</FieldHint>
              </div>
              <div>
                <FieldLabel>Show Frequency</FieldLabel>
                <div className="relative">
                  <select value={form.popup_frequency} onChange={(e) => set("popup_frequency", e.target.value)} className={selectCls}>
                    <option value="every_visit">Every visit</option>
                    <option value="once_per_session">Once per session</option>
                    <option value="once_ever">Once ever (remember dismiss)</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="flex flex-col gap-5">

          {/* Publish / Status */}
          <SectionCard title="Publish" icon={<Eye size={15} />}>
            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="flex flex-col gap-2">
                {[
                  { value: "active",    label: "Active",    hint: "Live right now" },
                  { value: "inactive",  label: "Draft",     hint: "Hidden from visitors" },
                  { value: "scheduled", label: "Scheduled", hint: "Goes live on start date" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("status", s.value)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150 text-left
                      ${form.status === s.value
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      s.value === "active" ? "bg-emerald-400"
                      : s.value === "scheduled" ? "bg-amber-400"
                      : "bg-gray-300"
                    }`} />
                    <div>
                      <p className={`text-xs font-medium ${form.status === s.value ? "text-blue-600" : "text-gray-700"}`}>
                        {s.label}
                      </p>
                      <p className="text-[11px] text-gray-400">{s.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Priority</FieldLabel>
              <input
                type="number"
                min={0}
                max={100}
                value={form.priority}
                onChange={(e) => set("priority", +e.target.value)}
                className={inputCls}
              />
              <FieldHint>Higher number = shown first when multiple ads compete.</FieldHint>
            </div>
          </SectionCard>

          {/* Schedule — only visible when status = scheduled */}
          {form.status === "scheduled" && (
            <SectionCard title="Schedule" icon={<Calendar size={15} />}>
              <div>
                <FieldLabel>Start Date *</FieldLabel>
                <input type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <FieldLabel>End Date *</FieldLabel>
                <input type="date" value={form.end_date || ""} onChange={(e) => set("end_date", e.target.value)} className={inputCls} />
              </div>
            </SectionCard>
          )}

          {/* Targeting */}
          <SectionCard title="Targeting" icon={<Target size={15} />}>

            {/* Show On — only render if not sidebar */}
            <div>
              <FieldLabel>Show On Pages</FieldLabel>
              {isSidebar ? (
                /* Sidebar is always category — show as a locked badge */
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                  <span className="text-sm text-gray-700">Category Pages</span>
                  <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">fixed</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={form.show_on}
                    onChange={(e) => set("show_on", e.target.value)}
                    className={selectCls}
                  >
                    {showOnOptions?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
              <FieldHint>
                {isPopup && "Popup can appear on any page."}
                {(form.ad_type === "top_banner" || form.ad_type === "bottom_banner") &&
                  "Banner shows on Home, Category, or Product pages."}
                {isSidebar && "Sidebar only appears on Category pages."}
              </FieldHint>
            </div>

            <div>
              <FieldLabel>Target Imprint</FieldLabel>
              <div className="relative">
                <select value={form.target_imprint} onChange={(e) => set("target_imprint", e.target.value)} className={selectCls}>
                  <option value="all">Both AGPH & AG Classics</option>
                  <option value="agph">AGPH Only</option>
                  <option value="agclassics">AG Classics Only</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </SectionCard>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
              <X size={13} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          {/* Dynamic Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl transition-all duration-150 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> {isEditMode ? "Updating…" : "Saving…"}</>
            ) : (
              <><Save size={14} /> {isEditMode ? "Update Advertisement" : "Save Advertisement"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}