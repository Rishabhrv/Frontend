"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { forwardRef, useImperativeHandle } from "react";

/* MASTER ATTRIBUTES (EXISTING) */
const EXISTING_ATTRIBUTES = [
  "Author",
  "ISBN Number",
  "No. Of Pages",
  "Language",
  "Publisher",
  "Edition",
];

/* ATTRIBUTE TYPE */
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
};


const API_URL = process.env.NEXT_PUBLIC_API_URL!;


const ProductAttributes = forwardRef<
  any,
  ProductAttributesProps
>(({ mode = "add", productId }, ref) => {
  /* STATE */
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  /* FILTER EXISTING ATTRIBUTES (SEARCH + REMOVE ADDED ONES) */
  const filteredAttributes = availableAttributes.filter(
  (attr) =>
    attr.toLowerCase().includes(search.toLowerCase()) &&
    !attributes.some((a) => a.name === attr)
);

  /* ADD EXISTING ATTRIBUTE */
  const addExisting = (name: string) => {
    setAttributes([
      ...attributes,
      {
        id: Date.now(),
        name,
        values: "",
        open: true,
        isCustom: false,
      },
    ]);
    setSearch("");
  };

useEffect(() => {
  fetch(`${API_URL}/api/attributes`)
    .then(res => res.json())
    .then((data: { id: number; name: string }[]) => {
      setAvailableAttributes(data.map((a) => a.name));
    });
}, []);

useEffect(() => {
  if (mode !== "edit" || !productId) return;

  fetch(`${API_URL}/api/attributes/${productId}/attributes`)
    .then(res => res.json())
    .then((data) => {
      const mapped = data.map((attr: any) => ({
        id: Date.now() + Math.random(),
        name: attr.name,
        values: attr.value,
        open: true,
        isCustom: false,
      }));

      setAttributes(mapped);
    });
}, [mode, productId]);




  /* ADD NEW CUSTOM ATTRIBUTE */
  const addNew = () => {
    setAttributes([
      ...attributes,
      {
        id: Date.now(),
        name: "",
        values: "",
        open: true,
        isCustom: true,
      },
    ]);
  };

  /* UPDATE ATTRIBUTE */
  const update = (
    id: number,
    field: keyof Attribute,
    value: any
  ) => {
    setAttributes((attrs) =>
      attrs.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      )
    );
  };

  /* REMOVE ATTRIBUTE */
  const remove = (id: number) => {
    setAttributes((attrs) =>
      attrs.filter((a) => a.id !== id)
    );
  };

useImperativeHandle(ref, () => ({
  getAttributes: () =>
    attributes.filter(
      (a) => a.name.trim() !== "" && a.values.trim() !== ""
    ),
}));


  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6">
      <h2 className="mb-4 font-medium text-gray-700">
        Attributes
      </h2>

      {/* TOP BAR */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={addNew}
          className="rounded border border-gray-300 px-3 py-1 text-sm"
        >
          Add new
        </button>

        {/* SEARCH EXISTING ATTRIBUTE */}
        <div className="relative w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search existing attribute"
            className="w-full rounded border border-gray-300 px-3 py-1 text-sm"
          />

          {/* SUGGESTIONS */}
          {search.length >= 2 &&
            filteredAttributes.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded border border-gray-300 bg-white shadow">
                {filteredAttributes.map((attr) => (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => addExisting(attr)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    {attr}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* ATTRIBUTE LIST */}
      <div className="space-y-4">
        {attributes.map((attr) => (
          <div key={attr.id} className="border border-gray-300 rounded">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-gray-50 px-4 py-2">
              <strong className="text-sm">
                {attr.name || "New attribute"}
              </strong>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    update(attr.id, "open", !attr.open)
                  }
                >
                  <ChevronDown className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => remove(attr.id)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* BODY */}
            {attr.open && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={attr.name}
                    disabled={!attr.isCustom}
                    onChange={(e) =>
                      update(attr.id, "name", e.target.value)
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Value(s)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Use | to separate values"
                    value={attr.values}
                    onChange={(e) =>
                      update(
                        attr.id,
                        "values",
                        e.target.value
                      )
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
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
)
export default ProductAttributes;
