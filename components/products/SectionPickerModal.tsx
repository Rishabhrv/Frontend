"use client";

import React from "react";
import { X } from "lucide-react";
import { SECTION_TYPES, SectionType } from "@/utils/sectionTypes";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (type: SectionType) => void;
};

// ── Tiny visual mockups per layout type (inline styles = no Tailwind dependency) ──
const boxStyle: React.CSSProperties = {
  backgroundColor: "#d1d5db", // gray-300
  borderRadius: 4,
};

const lineStyle: React.CSSProperties = {
  backgroundColor: "#e5e7eb", // gray-200
  borderRadius: 4,
  height: 6,
};

const previewWrapStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  padding: 8,
  display: "flex",
  gap: 6,
};

const LayoutPreview: React.FC<{ type: SectionType }> = ({ type }) => {
  if (type === "single_image") {
    return (
      <div style={previewWrapStyle}>
        <div style={{ ...boxStyle, width: "100%", height: "100%" }} />
      </div>
    );
  }

  if (type === "two_image") {
    return (
      <div style={previewWrapStyle}>
        <div style={{ ...boxStyle, flex: 1 }} />
        <div style={{ ...boxStyle, flex: 1 }} />
      </div>
    );
  }

  if (type === "image_content") {
    return (
      <div style={previewWrapStyle}>
        <div style={{ ...boxStyle, width: "50%", height: "100%" }} />
        <div style={{ width: "50%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 6 }}>
          <div style={{ ...lineStyle, width: "75%" }} />
          <div style={{ ...lineStyle, width: "100%" }} />
          <div style={{ ...lineStyle, width: "100%" }} />
          <div style={{ ...lineStyle, width: "65%" }} />
        </div>
      </div>
    );
  }

  if (type === "four_column") {
    const col = (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ ...boxStyle, width: "100%", height: "100%" }} />
        <div style={{ ...lineStyle, width: "80%" }} />
        <div style={{ ...lineStyle, width: "100%" }} />
      </div>
    );
    return (
      <div style={previewWrapStyle}>
        {col}
        {col}
        {col}
        {col}
      </div>
    );
  }

  if (type === "video") {
    return (
      <div style={previewWrapStyle}>
        <div style={{ ...boxStyle, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "12px solid white" }} />
        </div>
      </div>
    );
  }

  // Fallback so a new/unmatched type is never blank
  return (
    <div style={previewWrapStyle}>
      <div style={{ ...boxStyle, width: "100%", height: "100%", opacity: 0.6 }} />
    </div>
  );
};

const SectionPickerModal: React.FC<Props> = ({ open, onClose, onSelect }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-medium text-gray-800">Choose a section layout</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SECTION_TYPES.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => onSelect(def.type)}
              className="group border border-gray-200 rounded-lg overflow-hidden text-left hover:border-blue-500 hover:shadow-card transition-all cursor-pointer flex flex-col"
            >
              <div style={{ position: "relative", height: 112, flexShrink: 0, backgroundColor: "#f9fafb" }}
                className="border-b border-gray-200">
                <LayoutPreview type={def.type} />
              </div>
              <div className="px-3 py-2 flex items-center gap-2">
                <def.icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                <span className="text-sm text-gray-700 group-hover:text-blue-600">{def.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SectionPickerModal;