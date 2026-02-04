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

const ShippingZonesTable: React.FC<Props> = ({
  zones,
  onEdit,
  onDelete,
  onAdd,
}) => {
  return (
    <div className="bg-white rounded-xl  overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 ">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Shipping Zones
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define regions and shipping methods
          </p>
        </div>

        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 bg-blue-100 cursor-pointer text-blue-600  px-3 py-2 rounded-md text-xs shadow-md"
        >
          + Add Zone
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-gray-200">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left font-medium">
                Zone Name
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Regions
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Methods
              </th>
              <th className="px-6 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {zones.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No shipping zones created yet
                </td>
              </tr>
            )}

            {zones.map((z) => (
              <tr
                key={z.id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {z.zone_name}
                </td>

                <td className="px-6 py-4 text-gray-600 max-w-sm truncate">
                  {z.regions || "—"}
                </td>

                <td className="px-6 py-4">
                  {z.methods ? (
                    <div className="flex flex-wrap gap-2">
                      {z.methods.split(", ").map((m) => (
                        <span
                          key={m}
                          className="bg-blue-50 text-gray-700 text-xs font-medium px-3 py-1 rounded-lg"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No methods</span>
                  )}
                </td>


                <td className="px-6 py-4 text-right">
                  <div className="inline-flex gap-3">
                    <button
                      onClick={() => onEdit(z)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-xs cursor-pointer"
                    >
                      Edit
                    </button>
                    <div>|</div>
                    <button
                      onClick={() => onDelete(z.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShippingZonesTable;
