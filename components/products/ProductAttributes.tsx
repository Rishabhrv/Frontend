"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { ChevronDown } from "lucide-react";

type Attribute = {
  id: number;
  name: string;
  values: string;
  open: boolean;
  isCustom: boolean;
};

type ProductAttributesProps = {
  mode?: "add" | "edit";
  productId?: number;
  error?: string;
  onValidChange?: () => void;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Define our fixed attributes so we can easily filter them
const FIXED_ATTRIBUTES = ["No. Of Pages", "Publication Date", "ISBN"];

const ProductAttributes = forwardRef<any, ProductAttributesProps>(
  ({ mode = "add", productId, error, onValidChange }, ref) => {
    
    // Initialize state with the 3 fixed attributes
    const [attributes, setAttributes] = useState<Attribute[]>([
      { id: 1, name: "No. Of Pages", values: "", open: true, isCustom: false },
      { id: 2, name: "Publication Date", values: "", open: true, isCustom: false },
      { id: 3, name: "ISBN", values: "", open: true, isCustom: false },
    ]);
    
    const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [localError, setLocalError] = useState(""); // ← NEW: Tracks missing required fields

    const filteredAttributes = availableAttributes.filter(
      (attr) =>
        attr.toLowerCase().includes(search.toLowerCase()) &&
        !attributes.some((a) => a.name === attr)
    );

    const addExisting = (name: string) => {
      setAttributes([
        ...attributes,
        { id: Date.now(), name, values: "", open: true, isCustom: false },
      ]);
      setSearch("");
      onValidChange?.();
    };

    useEffect(() => {
      fetch(`${API_URL}/api/attributes`)
        .then((res) => res.json())
        .then((data: { id: number; name: string }[]) => {
          setAvailableAttributes(data.map((a) => a.name));
        });
    }, []);

    useEffect(() => {
      if (mode !== "edit" || !productId) return;
      fetch(`${API_URL}/api/attributes/${productId}/attributes`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            setAttributes((prev) => {
              const newAttrs = [...prev];
              data.forEach((attr: any) => {
                const existingIndex = newAttrs.findIndex((a) => a.name === attr.name);
                if (existingIndex >= 0) {
                  // Update value if it's one of our fixed attributes
                  newAttrs[existingIndex] = { ...newAttrs[existingIndex], values: attr.value };
                } else {
                  // Append as a new dynamic attribute
                  newAttrs.push({
                    id: Date.now() + Math.random(),
                    name: attr.name,
                    values: attr.value,
                    open: true,
                    isCustom: false,
                  });
                }
              });
              return newAttrs;
            });
          }
        });
    }, [mode, productId]);

    const addNew = () => {
      setAttributes([
        ...attributes,
        { id: Date.now(), name: "", values: "", open: true, isCustom: true },
      ]);
      onValidChange?.();
    };

    const update = (id: number, field: keyof Attribute, value: any) => {
      setAttributes((attrs) =>
        attrs.map((a) => (a.id === id ? { ...a, [field]: value } : a))
      );
      setLocalError(""); // Clear local error when user types
      if (field === "values" || field === "name") onValidChange?.();
    };

    const remove = (id: number) => {
      setAttributes((attrs) => attrs.filter((a) => a.id !== id));
    };

    // ── INTERCEPT PARENT VALIDATION ──
    useImperativeHandle(ref, () => ({
      getAttributes: () => {
        // 1. Check if any of our 3 required fields are empty
        const missingFixed = FIXED_ATTRIBUTES.filter((name) => {
          const attr = attributes.find((a) => a.name === name);
          return !attr || attr.values.trim() === "";
        });

        // 2. If missing, set a local error and return empty to fail the parent form's validation
        if (missingFixed.length > 0) {
          setLocalError(`Required attributes missing: ${missingFixed.join(", ")}`);
          return []; 
        }

        setLocalError(""); // Clear if passed
        
        // 3. Return all valid filled attributes to the parent
        return attributes.filter(
          (a) => a.name.trim() !== "" && a.values.trim() !== ""
        );
      },
    }));

    // Split attributes for rendering
    const dynamicAttributes = attributes.filter((a) => !FIXED_ATTRIBUTES.includes(a.name));
    const displayError = localError || error;

    return (
      <div className={`bg-white rounded-xl border p-6 border-gray-300`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-700">
            Attributes <span className="text-red-500">*</span>
          </h2>
        </div>

        {/* Error message (Shows Parent Errors OR Local Missing Field Errors) */}
        {displayError && (
          <p className="text-red-500 text-xs mb-3 rounded px-2 py-1.5 bg-red-50 border border-red-200">
            {displayError}
          </p>
        )}

        {/* ── FIXED ATTRIBUTES (3 Column Grid) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {FIXED_ATTRIBUTES.map((name) => {
            const attr = attributes.find((a) => a.name === name);
            if (!attr) return null;

            // Determine input type based on attribute name
            let inputType = "text";
            if (name === "Publication Date") inputType = "date";
            if (name === "No. Of Pages") inputType = "number";

            // HTML date inputs require YYYY-MM-DD format. 
            // If the DB returns a timestamp (e.g., 2026-01-14T00:00:00.000Z), we trim it.
            let displayValue = attr.values;
            if (name === "Publication Date" && displayValue.includes("T")) {
              displayValue = displayValue.split("T")[0];
            }

            return (
              <div key={attr.id}>
                <label className="block text-sm mb-1 text-gray-700">
                  {attr.name} <span className="text-red-500">*</span>
                </label>
                <input
                  type={inputType}
                  value={displayValue}
                  onChange={(e) => update(attr.id, "values", e.target.value)}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${localError && attr.values.trim() === "" ? "border-red-400" : "border-gray-300"}`}
                  placeholder={`Enter ${attr.name.toLowerCase()}`}
                  min={name === "No. Of Pages" ? "1" : undefined}
                />
              </div>
            );
          })}
        </div>

        <hr className="border-gray-200 mb-5" />

        {/* ── DYNAMIC ATTRIBUTES (Existing Layout) ── */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={addNew}
            className="rounded border border-gray-300 px-3 py-1 text-sm cursor-pointer hover:bg-gray-50"
          >
            Add new
          </button>

          <div className="relative w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search existing attribute"
              className="w-full rounded border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search.length >= 2 && filteredAttributes.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow-lg max-h-48 overflow-y-auto">
                {filteredAttributes.map((attr) => (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => addExisting(attr)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer"
                  >
                    {attr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {dynamicAttributes.map((attr) => (
            <div key={attr.id} className="border border-gray-300 rounded overflow-hidden">
              <div className="flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200">
                <strong className="text-sm text-gray-700">{attr.name || "New attribute"}</strong>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => remove(attr.id)}
                    className="text-red-500 text-sm hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => update(attr.id, "open", !attr.open)}
                    className="p-1 hover:bg-gray-200 rounded cursor-pointer"
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${attr.open ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {attr.open && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1 text-gray-600">Name</label>
                    <input
                      type="text"
                      value={attr.name}
                      disabled={!attr.isCustom}
                      onChange={(e) => update(attr.id, "name", e.target.value)}
                      className={`w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${!attr.isCustom ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1 text-gray-600">Value(s)</label>
                    <textarea
                      rows={2}
                      placeholder="Use | to separate values"
                      value={attr.values}
                      onChange={(e) => update(attr.id, "values", e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default ProductAttributes;