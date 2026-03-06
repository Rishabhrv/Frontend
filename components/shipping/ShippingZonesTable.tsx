import React from "react";

interface ShippingZone {
  id: number;
  zone_name: string;
  regions?: string | null;
  methods?: string | null;
}

interface Props {
  zones: ShippingZone[];
  onEdit: (zone: ShippingZone) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

const ShippingZonesTable: React.FC<Props> = ({ zones, onEdit, onDelete, onAdd }) => {
  return (
    <div className="font-sans">

      {/* PAGE HEADER */}
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Shipping Zones
        </h1>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors duration-150 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Zone
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Zone Name", "Regions", "Methods", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase ${
                      h === "Actions" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {zones.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-400">No shipping zones created yet</p>
                      <p className="text-xs text-gray-300">Click "Add Zone" to get started</p>
                    </div>
                  </td>
                </tr>
              )}

              {zones.map((z) => {
                const methodList = z.methods ? z.methods.split(", ").filter(Boolean) : [];
                const regionList = z.regions ? z.regions.split(",").map((r) => r.trim()).filter(Boolean) : [];

                return (
                  <tr key={z.id} className="hover:bg-gray-50/60 transition-colors duration-100">

                    {/* ZONE NAME */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-800">{z.zone_name}</span>
                      </div>
                    </td>

                    {/* REGIONS */}
                    <td className="px-5 py-4 max-w-xs">
                      {regionList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {regionList.slice(0, 3).map((r) => (
                            <span key={r} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {r}
                            </span>
                          ))}
                          {regionList.length > 3 && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              +{regionList.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* METHODS */}
                    <td className="px-5 py-4">
                      {methodList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {methodList.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">No methods</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => onEdit(z)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-gray-200">|</span>
                        <button
                          onClick={() => onDelete(z.id)}
                          className="text-xs font-medium text-gray-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        {zones.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {zones.length} zone{zones.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingZonesTable;