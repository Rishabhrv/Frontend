"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Upload,
  Image as ImageIcon, Columns2, PanelLeft, Grid2x2,
  Sparkles, LayoutGrid
} from "lucide-react";
import { SECTION_TYPES, getSectionDef, SectionType } from "@/utils/sectionTypes";
import SectionPickerModal from "./SectionPickerModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type SectionItem = { uid: string; id?: number; type: SectionType; data: Record<string, any> };

type Props = {
  productId?: number;
  initialSections?: { id: number; type: string; data: Record<string, any> }[];
};

let uidCounter = 0;
const nextUid = () => `sec_${Date.now()}_${uidCounter++}`;

/* ── Section type visual config ─────────────────────────── */
const SECTION_META: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  single_image: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", icon: ImageIcon },
  two_image: { color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", icon: Columns2 },
  image_content: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: PanelLeft },
  four_column: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Grid2x2 },
};

const ProductSections = forwardRef(({ productId, initialSections }: Props, ref) => {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  // Pending local files, keyed by placeholder string. Not React state —
  // File objects don't need re-renders, only the placeholder keys in `data` do.
  const imageFilesRef = useRef<Record<string, File>>({});

  useEffect(() => {
    if (initialSections?.length) {
      setSections(
        initialSections.map((s) => ({ uid: nextUid(), id: s.id, type: s.type as SectionType, data: s.data }))
      );
    }
  }, [initialSections]);

  useImperativeHandle(ref, () => ({
    getSectionsData: () => sections.map((s) => ({ type: s.type, data: s.data })),
    getSectionImageFiles: () => imageFilesRef.current,
  }));

  const addSection = (type: SectionType) => {
    if (sections.length >= 10) {
      alert("Maximum of 10 sections allowed.");
      setPickerOpen(false);
      return;
    }
    const def = getSectionDef(type);
    setSections((prev) => [...prev, { uid: nextUid(), type, data: { ...(def?.defaultData || {}) } }]);
    setPickerOpen(false);
  };

  const updateField = (uid: string, field: string, value: any) =>
    setSections((prev) => prev.map((s) => (s.uid === uid ? { ...s, data: { ...s.data, [field]: value } } : s)));

  const updateItemField = (uid: string, index: number, field: string, value: any) =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.uid !== uid) return s;
        const items = [...(s.data.items || [])];
        items[index] = { ...items[index], [field]: value };
        return { ...s, data: { ...s.data, items } };
      })
    );

  const removeSection = (uid: string) => {
    Object.keys(imageFilesRef.current).forEach((key) => {
      if (key.startsWith(`__FILE__${uid}__`)) delete imageFilesRef.current[key];
    });
    setSections((prev) => prev.filter((s) => s.uid !== uid));
    setCollapsed((prev) => { const next = { ...prev }; delete next[uid]; return next; });
  };

  const moveSection = (index: number, dir: -1 | 1) =>
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const toggleCollapse = (uid: string) =>
    setCollapsed((prev) => ({ ...prev, [uid]: !prev[uid] }));

  // Top-level field (e.g. single_image.image)
  const handleFileSelect = (uid: string, field: string, file: File | null) => {
    if (!file) return;
    const key = `__FILE__${uid}__${field}`;
    imageFilesRef.current[key] = file;
    updateField(uid, field, key);
  };

  // Nested item field (e.g. four_column items[idx].image)
  const handleItemFileSelect = (uid: string, idx: number, field: string, file: File | null) => {
    if (!file) return;
    const key = `__FILE__${uid}__item${idx}__${field}`;
    imageFilesRef.current[key] = file;
    updateItemField(uid, idx, field, key);
  };

  const clearImage = (uid: string, field: string) => {
    const key = `__FILE__${uid}__${field}`;
    delete imageFilesRef.current[key];
    updateField(uid, field, "");
  };

  const clearItemImage = (uid: string, idx: number, field: string) => {
    const key = `__FILE__${uid}__item${idx}__${field}`;
    delete imageFilesRef.current[key];
    updateItemField(uid, idx, field, "");
  };

  const previewSrc = (value: string | undefined) => {
    if (!value) return "";
    if (value.startsWith("__FILE__")) {
      const file = imageFilesRef.current[value];
      return file ? URL.createObjectURL(file) : "";
    }
    return `${API_URL}${value}`;
  };

  /* ── Reusable image upload zone ────────────────────────── */
  const ImageUploadZone = ({
    value, uid, field, height = "h-40", onFileSelect, onClear,
  }: {
    value: string; uid: string; field: string; height?: string;
    onFileSelect: (uid: string, field: string, file: File | null) => void;
    onClear: (uid: string, field: string) => void;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const src = previewSrc(value);

    return (
      <div className={`relative group ${height} rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-100 transition-all duration-200 hover:border-blue-400 hover:shadow-sm`}>
        {src ? (
          <>
            <img src={src} className="h-full w-full object-cover" alt="" />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-700 hover:bg-white transition-colors shadow-sm cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onClear(uid, field)}
                className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg text-xs font-medium text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
              >
                Remove
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFileSelect(uid, field, e.target.files?.[0] || null)}
            />
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Upload className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
              Click to upload
            </span>
            <span className="text-[10px] text-gray-400">PNG, JPG, WebP</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFileSelect(uid, field, e.target.files?.[0] || null)}
            />
          </label>
        )}
      </div>
    );
  };

  /* ── Reusable item-level image upload zone (for four_column) ── */
  const ItemImageUploadZone = ({
    value, uid, idx, field, height = "h-28",
  }: {
    value: string; uid: string; idx: number; field: string; height?: string;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const src = previewSrc(value);

    return (
      <div className={`relative group ${height} rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-slate-100 transition-all duration-200 hover:border-blue-400 hover:shadow-sm`}>
        {src ? (
          <>
            <img src={src} className="h-full w-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-[10px] font-medium text-gray-700 hover:bg-white transition-colors shadow-sm cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => clearItemImage(uid, idx, field)}
                className="px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded text-[10px] font-medium text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
              >
                Remove
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleItemFileSelect(uid, idx, field, e.target.files?.[0] || null)}
            />
          </>
        ) : (
          <label className="cursor-pointer flex flex-col items-center justify-center h-full w-full gap-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Upload className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-blue-600 transition-colors">Upload</span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleItemFileSelect(uid, idx, field, e.target.files?.[0] || null)}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-[15px]">A+ Content</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {sections.length === 0
                  ? "Build your product page layout"
                  : `${sections.length} section${sections.length > 1 ? "s" : ""} added`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (sections.length < 10) setPickerOpen(true);
            }}
            disabled={sections.length >= 10}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-all ${sections.length >= 10
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow cursor-pointer"
              }`}
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="p-5">
        {sections.length === 0 && (
          <div
            onClick={() => setPickerOpen(true)}
            className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-200 transition-all duration-200 shadow-sm">
              <Sparkles className="w-6 h-6 text-blue-500 group-hover:text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
                Add your first section
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Choose from images, content blocks, and multi-column layouts
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sections.map((section, index) => {
            const def = getSectionDef(section.type);
            const meta = SECTION_META[section.type] || SECTION_META.single_image;
            const Icon = meta.icon;
            const isCollapsed = collapsed[section.uid];

            return (
              <div
                key={section.uid}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${isCollapsed ? "border-gray-200" : "border-gray-200 shadow-sm"
                  }`}
              >
                {/* ── Section header bar ─────────────────────── */}
                <div
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors ${isCollapsed ? "bg-gray-50" : "bg-white border-b border-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab" />
                    {/* Number badge */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    {/* Type badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${meta.bg} ${meta.color} ${meta.border} border`}>
                      <Icon className="w-3 h-3" />
                      {def?.label || section.type}
                    </span>
                    {/* Section title preview */}
                    {section.data.title && (
                      <span className="text-xs text-gray-400 truncate max-w-[180px] hidden sm:inline">
                        — {section.data.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSection(index, -1)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(index, 1)}
                      disabled={index === sections.length - 1}
                      className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(section.uid)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expand" : "Collapse"}
                    >
                      <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""
                          }`}
                      />
                    </button>
                    <div className="w-px h-5 bg-gray-200 mx-1" />
                    <button
                      type="button"
                      onClick={() => removeSection(section.uid)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Section body (collapsible) ─────────────── */}
                {!isCollapsed && (
                  <div className="p-5 bg-white">
                    {/* Section Title */}
                    <div className="mb-5">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Section Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Behind the Scenes"
                        value={section.data.title || ""}
                        onChange={(e) => updateField(section.uid, "title", e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                      />
                    </div>

                    {/* ── Single Image ────────────────────────── */}
                    {section.type === "single_image" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Image
                          </label>
                          <ImageUploadZone
                            value={section.data.image}
                            uid={section.uid}
                            field="image"
                            onFileSelect={handleFileSelect}
                            onClear={clearImage}
                          />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Heading & Alt Text
                            </label>
                            <input
                              type="text"
                              value={section.data.heading || section.data.alt || ""}
                              onChange={(e) => {
                                updateField(section.uid, "heading", e.target.value);
                                updateField(section.uid, "alt", e.target.value);
                              }}
                              placeholder="Enter heading and alt text"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Caption <span className="text-gray-300 normal-case tracking-normal">(max 100 words)</span>
                            </label>
                            <textarea
                              rows={3}
                              value={section.data.caption || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.split(/\s+/).filter(Boolean).length <= 100) {
                                  updateField(section.uid, "caption", val);
                                }
                              }}
                              placeholder="Visible caption below the image"
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Two Images ──────────────────────────── */}
                    {section.type === "two_image" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {(["Left", "Right"] as const).map((side) => {
                          const imgField = `image${side}`;
                          const altField = `alt${side}`;
                          const capField = `caption${side}`;
                          return (
                            <div key={side} className="space-y-2">
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                {side} Image
                              </label>
                              <ImageUploadZone
                                value={section.data[imgField]}
                                uid={section.uid}
                                field={imgField}
                                onFileSelect={handleFileSelect}
                                onClear={clearImage}
                              />
                              <input
                                type="text"
                                placeholder="Alt text"
                                value={section.data[altField] || ""}
                                onChange={(e) => updateField(section.uid, altField, e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                              />
                              <textarea
                                rows={2}
                                placeholder="Caption (max 35 words)"
                                value={section.data[capField] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.split(/\s+/).filter(Boolean).length <= 35) {
                                    updateField(section.uid, capField, val);
                                  }
                                }}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all resize-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Image + Content ─────────────────────── */}
                    {section.type === "image_content" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                            Layout
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: "image-left", label: "Image Left" },
                              { value: "image-right", label: "Image Right" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateField(section.uid, "layout", opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${(section.data.layout || "image-left") === opt.value
                                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                              Image
                            </label>
                            <ImageUploadZone
                              value={section.data.image}
                              uid={section.uid}
                              field="image"
                              onFileSelect={handleFileSelect}
                              onClear={clearImage}
                            />
                            <input
                              type="text"
                              placeholder="Alt text"
                              value={section.data.alt || ""}
                              onChange={(e) => updateField(section.uid, "alt", e.target.value)}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                            />
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Heading
                              </label>
                              <input
                                type="text"
                                value={section.data.heading || ""}
                                onChange={(e) => updateField(section.uid, "heading", e.target.value)}
                                placeholder="Section heading"
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                                Content
                              </label>
                              <textarea
                                rows={5}
                                value={section.data.content || ""}
                                onChange={(e) => updateField(section.uid, "content", e.target.value)}
                                placeholder="Write your content here..."
                                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Four Columns ────────────────────────── */}
                    {section.type === "four_column" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(section.data.items || []).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-gradient-to-b from-gray-50 to-white rounded-xl p-3.5 space-y-2.5 hover:border-gray-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Column {idx + 1}
                              </span>
                              <span className="w-5 h-5 rounded bg-gray-100 text-[10px] font-semibold text-gray-400 flex items-center justify-center">
                                {idx + 1}
                              </span>
                            </div>
                            <ItemImageUploadZone
                              value={item.image}
                              uid={section.uid}
                              idx={idx}
                              field="image"
                            />
                            <input
                              type="text"
                              placeholder="Heading & Alt text"
                              value={item.heading || item.alt || ""}
                              onChange={(e) => {
                                updateItemField(section.uid, idx, "heading", e.target.value);
                                updateItemField(section.uid, idx, "alt", e.target.value);
                              }}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all"
                            />
                            <textarea
                              rows={3}
                              placeholder="Content (max 35 words)"
                              value={item.content || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.split(/\s+/).filter(Boolean).length <= 35) {
                                  updateItemField(section.uid, idx, "content", val);
                                }
                              }}
                              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none  focus:border-blue-400 transition-all resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Add another section (when sections exist) ───── */}
        {sections.length > 0 && sections.length < 10 && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add another section
          </button>
        )}
        {sections.length >= 10 && (
          <div className="mt-3 w-full py-2.5 rounded-xl text-sm text-gray-400 text-center bg-gray-50 border border-gray-200">
            Maximum limit of 10 sections reached.
          </div>
        )}
      </div>

      <SectionPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addSection}
      />
    </div>
  );
});

ProductSections.displayName = "ProductSections";
export default ProductSections;