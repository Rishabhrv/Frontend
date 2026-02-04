import React from "react";
import { ChevronLeft } from 'lucide-react';
import WeightBasedRulesTable, {
  WeightRule,
} from "./WeightBasedRulesTable";

interface Props {
  zoneName: string;
  setZoneName: (v: string) => void;

  regions: string[];
  setRegions: (v: string[]) => void;
  regionInput: string;
  setRegionInput: (v: string) => void;

  shippingMethods: { free: boolean; weight: boolean };
  setShippingMethods: (v: { free: boolean; weight: boolean }) => void;

  regionOptions: string[];
  loading: boolean;
  onSave: () => void;
  onCancel: () => void;
  editing: boolean;

  weightRules: WeightRule[];
setWeightRules: (v: WeightRule[]) => void;
}

const ShippingZoneForm: React.FC<Props> = ({
  zoneName,
  setZoneName,
  regions,
  setRegions,
  regionInput,
  setRegionInput,
  shippingMethods,
  setShippingMethods,
  regionOptions,
  loading,
  onSave,
  onCancel,
  editing,
  weightRules,        // ✅ ADD
  setWeightRules,
}) => {
  const addRegion = (r: string) => {
    if (regions.includes(r)) return;
    setRegions(
      r === "Everywhere"
        ? ["Everywhere"]
        : regions.filter((x) => x !== "Everywhere").concat(r)
    );
    setRegionInput("");
  };

  const removeRegion = (r: string) => {
    const u = regions.filter((x) => x !== r);
    setRegions(u.length ? u : ["Everywhere"]);
  };




  const filtered = regionOptions.filter(
    (r) =>
      r.toLowerCase().includes(regionInput.toLowerCase()) &&
      !regions.includes(r)
  );

  return (
    <div className="max-w-4xl ">
      {/* 🔹 Breadcrumb */}
        <div className="text-xs text-gray-500 mb-2">
            <button onClick={onCancel} className="hover:text-red-500 cursor-pointer ">Shipping</button>  <span className="mx-1">/</span>
            {editing ? zoneName || "Back" : "Add zone"}
        </div>

        <div className="rounded-md p-6 space-y-6 ">
        {/* Zone Name */}
            <div className="grid grid-cols-3 gap-6 items-start">
            {/* LEFT TEXT */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Zone name
              </label>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Give your zone a name! Eg:<br />
                Local, or Worldwide.
              </p>
            </div>
            {/* RIGHT INPUT */}
            <div className="col-span-2">
              <input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Eg: Local, National, International"
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
        </div>



        <div className="rounded-md space-y-6 ">
            {/* Zone Name */}
                <div className="grid grid-cols-3 gap-6 items-start">
                {/* LEFT TEXT */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Zone regions
                      </label>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        List the regions you'd like to<br /> 
                        include in your shipping zone.<br />
                        Customers will be matched against <br />
                        these regions.
                      </p>
                    </div>
                    {/* RIGHT INPUT */}
                    <div className="col-span-2">
                        <div className="border border-gray-200 rounded-md p-2 flex flex-wrap gap-2 mt-1">
                          {regions.map((r) => (
                            <span
                              key={r}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              {r}
                              <button
                                onClick={() => removeRegion(r)}
                                className="hover:text-red-500"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          <input
                            value={regionInput}
                            onChange={(e) => setRegionInput(e.target.value)}
                            placeholder="Start typing to filter zones"
                            className="flex-1 outline-none text-sm px-1"
                          />
                        </div>

                        {regionInput && filtered.length > 0 && (
                          <div className="border border-gray-200 rounded-md mt-1 bg-white shadow-sm max-h-48 overflow-auto">
                            {filtered.map((r) => (
                              <div
                                key={r}
                                onClick={() => addRegion(r)}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                              >
                                {r}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                </div>
        </div>



        <div className="rounded-md space-y-6 ">
            {/* Zone Name */}
                <div className="grid grid-cols-3 gap-6 items-start">
                {/* LEFT TEXT */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Shipping method
                      </label>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Add the shipping methods <br />
                        you'd like to make available <br />
                        to customers in this zone.
                      </p>
                    </div>
                    {/* RIGHT INPUT */}
                    <div className="col-span-2">
                        <div className="relative mt-1">
                          <select
                            value={shippingMethods.free ? "free" : "weight"}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "free") {
                                setShippingMethods({ free: true, weight: false });
                              } else {
                                setShippingMethods({ free: false, weight: true });
                              }
                            }}
                            className="w-full appearance-none border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                          >
                            <option value="free">Free Shipping</option>
                            <option value="weight">Weight Based Shipping</option>
                          </select>
              
                          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
                            ▼
                          </span>
                        </div>
                       
                    </div>
                </div>
        </div>

        {/* Save */}
        <div>
          <button
            onClick={onSave}
            disabled={loading}
            className="bg-blue-100 hover:bg-white text-blue-500 px-6 py-2 rounded-md text-sm shadow-sm font-medium disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

{shippingMethods.weight && (
  <WeightBasedRulesTable
    rules={weightRules}
    setRules={setWeightRules}
  />
)}



    </div>
  );
};

export default ShippingZoneForm;
