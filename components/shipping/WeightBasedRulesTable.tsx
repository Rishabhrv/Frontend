import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

/* ================= TYPES ================= */

export type ShippingChargeType =
  | "free"
  | "flat"
  | "progressive"
  | "flat_progressive";

export interface WeightRule {
  min: number;
  max: number | null;
  type: ShippingChargeType;

  flatCost?: number;
  perKgCost?: number;

  baseCost?: number;
  baseWeight?: number;
  extraCost?: number;
}

interface Props {
  rules: WeightRule[];
  setRules: (rules: WeightRule[]) => void;
}

/* ================= COMPONENT ================= */

const WeightBasedRulesTable: React.FC<Props> = ({ rules, setRules }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tempRule, setTempRule] = useState<WeightRule | null>(null);

  /* ---------- Helpers ---------- */

  const addRule = () => {
    setRules([
      ...rules,
      { min: 0, max: null, type: "flat", flatCost: 0 },
    ]);
  };

  const removeRule = (i: number) => {
    setRules(rules.filter((_, idx) => idx !== i));
  };

  const updateRange = (
    i: number,
    key: "min" | "max",
    value: number | null
  ) => {
    const updated = [...rules];
    updated[i] = { ...updated[i], [key]: value };
    setRules(updated);
  };

  const shippingLabel = (r: WeightRule) => {
    switch (r.type) {
      case "free":
        return "Free";
      case "flat":
        return `₹${r.flatCost}`;
      case "progressive":
        return `₹${r.perKgCost} / kg`;
      case "flat_progressive":
        return `₹${r.baseCost} + ₹${r.extraCost}/kg`;
    }
  };

  /* ================= UI ================= */

  return (
    <div className="mt-8 border border-gray-200 rounded-md bg-white overflow-visible">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h4 className="text-sm font-medium text-gray-800">
          Weight Based Shipping
        </h4>
        <p className="text-xs text-gray-500">
          Matching rules are combined when multiple apply
        </p>
      </div>

      {/* Table */}
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left">Weight</th>
            <th className="px-3 py-2 text-left">Shipping</th>
            <th className="px-3 py-2 text-right"></th>
          </tr>
        </thead>

        <tbody>
          {rules.map((rule, i) => (
            <tr key={i} className="">
              {/* Weight */}
              <td className="px-3 py-2 ">
                <div className="flex items-center gap-2">
                  <TextField
                    variant="standard"
                    type="number"
                    value={rule.min}
                    onChange={(e) =>
                      updateRange(i, "min", Number(e.target.value))
                    }
                    InputProps={{
                      disableUnderline: false,
                    }}
                  />
                  <span className="text-xs">to</span>
                  <TextField
                    variant="standard"
                    type="number"
                    value={rule.max ?? ""}
                    placeholder="∞"
                    onChange={(e) =>
                      updateRange(
                        i,
                        "max",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    InputProps={{
                      disableUnderline: false,
                    }}
                  />

                  <span className="text-xs">kg</span>
                </div>
              </td>

              {/* Shipping (RELATIVE CELL) */}
              <td className="px-3 py-2 relative">
                <button
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => {
                    setActiveIndex(i);
                    setTempRule({ ...rule });
                  }}
                >
                  {shippingLabel(rule)}
                </button>

                {/* ===== SIDE POPOVER (Woo style) ===== */}
                {activeIndex === i && tempRule && (
                  <div className="absolute bottom-10 left-0 ml-4 z-1000">
                    <div className="w-[320px] bg-white border border-gray-200 rounded-md shadow-xl">
                      {/* Header */}
                      <div className="flex justify-between items-center px-4 py-3">
                        <h4 className="text-sm font-medium">
                          Shipping cost
                        </h4>
                        <button
                          onClick={() => {
                            setActiveIndex(null);
                            setTempRule(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Body */}
<div className=" text-sm">

  {/* FREE */}
  <div
    className={`p-4 cursor-pointer ${
      tempRule.type === "free" ? "bg-blue-50" : ""
    }`}
    onClick={() =>
      setTempRule({ ...tempRule, type: "free" })
    }
  >
    <div className="flex justify-between">
      <div>
        <div className="font-medium">Free</div>
        <div className="text-xs text-gray-500">₹0.00</div>
      </div>
    </div>
  </div>

  {/* FLAT */}
  <div
    className={`p-4 cursor-pointer ${
      tempRule.type === "flat" ? "bg-blue-50" : ""
    }`}
    onClick={() =>
      setTempRule({ ...tempRule, type: "flat" })
    }
  >
    <div className="font-medium">Flat</div>
    <div className="text-xs text-gray-500">
      e.g. ₹79.50 for everything
    </div>

    {tempRule.type === "flat" && (
      <TextField
  variant="standard"
  type="number"
  value={tempRule.flatCost ?? ""}
  onChange={(e) =>
    setTempRule({
      ...tempRule,
      flatCost: Number(e.target.value),
    })
  }
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">₹</InputAdornment>
    ),
    disableUnderline: false,
  }}
  fullWidth
/>

    )}
  </div>

  {/* PROGRESSIVE */}
  <div
    className={`p-4 cursor-pointer ${
      tempRule.type === "progressive" ? "bg-blue-50" : ""
    }`}
    onClick={() =>
      setTempRule({ ...tempRule, type: "progressive" })
    }
  >
    <div className="font-medium">Progressive</div>
    <div className="text-xs text-gray-500">
      e.g. ₹1.50 every 0.5 kg
    </div>

    {tempRule.type === "progressive" && (
      <div className="flex items-end gap-2">
  <TextField
    variant="standard"
    type="number"
    value={tempRule.perKgCost ?? ""}
    onChange={(e) =>
      setTempRule({
        ...tempRule,
        perKgCost: Number(e.target.value),
      })
    }
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">₹</InputAdornment>
      ),
    }}
  />
  <span className="text-xs text-gray-500 mb-1">
    every kg
  </span>
</div>

    )}
  </div>

  {/* FLAT + PROGRESSIVE */}
  <div
    className={`p-4 cursor-pointer ${
      tempRule.type === "flat_progressive"
        ? "bg-blue-50"
        : ""
    }`}
    onClick={() =>
      setTempRule({
        ...tempRule,
        type: "flat_progressive",
      })
    }
  >
    <div className="font-medium">Flat + Progressive</div>
    <div className="text-xs text-gray-500">
      e.g. ₹79 for first 5kg, then ₹39/kg
    </div>

    {tempRule.type === "flat_progressive" && (
     <div className="space-y-3">
  <div className="flex gap-2 items-end">
    <TextField
      variant="standard"
      type="number"
      placeholder="for first"
      value={tempRule.baseCost ?? ""}
      onChange={(e) =>
        setTempRule({
          ...tempRule,
          baseCost: Number(e.target.value),
        })
      }
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">₹</InputAdornment>
        ),
      }}
      fullWidth
    />

    <TextField
      variant="standard"
      type="number"
      placeholder="kg"
      value={tempRule.baseWeight ?? ""}
      onChange={(e) =>
        setTempRule({
          ...tempRule,
          baseWeight: Number(e.target.value),
        })
      }
      sx={{ width: 80 }}
    />
  </div>

  <TextField
    variant="standard"
    type="number"
    placeholder="per kg"
    value={tempRule.extraCost ?? ""}
    onChange={(e) =>
      setTempRule({
        ...tempRule,
        extraCost: Number(e.target.value),
      })
    }
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">₹</InputAdornment>
      ),
    }}
    fullWidth
  />
</div>

    )}
  </div>
</div>


                      {/* Footer */}
                      <div className="flex justify-end gap-3 px-4 py-3">
                        <button
                          className="text-xs text-gray-500 cursor-pointer"
                          onClick={() => {
                            setActiveIndex(null);
                            setTempRule(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="bg-blue-600 text-white text-xs px-4 py-1 rounded cursor-pointer"
                          onClick={() => {
                            const updated = [...rules];
                            updated[i] = tempRule;
                            setRules(updated);
                            setActiveIndex(null);
                            setTempRule(null);
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </td>

              {/* Delete */}
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => removeRule(i)}
                  className="text-xs text-red-500 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <button
          onClick={addRule}
          className="text-blue-600 text-sm font-medium hover:underline cursor-pointer"
        >
          + Add rule
        </button>
      </div>
    </div>
  );
};

export default WeightBasedRulesTable;
