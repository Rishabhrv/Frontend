"use client";

import React, { useEffect, useState } from "react";
import ShippingZonesTable from "./ShippingZonesTable";
import ShippingZoneForm from "./ShippingZoneForm";
import { WeightRule } from "./WeightBasedRulesTable";
import AlertPopup from "@/components/Popups/AlertPopup";
import ConfirmPopup from "@/components/Popups/ConfirmPopup";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export interface ShippingZone {
  id: number;
  zone_name: string;
  regions?: string | null;
}

const REGION_OPTIONS = [
  "Everywhere",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const ShippingZonesPage: React.FC = () => {
  /* ===== DATA ===== */
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [weightRules, setWeightRules] = useState<WeightRule[]>([]);

  /* ===== FORM STATE ===== */
  const [zoneName, setZoneName] = useState("");
  const [regions, setRegions] = useState<string[]>(["Everywhere"]);
  const [regionInput, setRegionInput] = useState("");

  const [shippingMethods, setShippingMethods] = useState({
    free: true,
    weight: false,
  });

  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<number | null>(null);

  /* ===== FETCH ===== */
  const fetchZones = async () => {
    const token = localStorage.getItem("admin_token");
    const res = await fetch(`${API_URL}/api/shipping/zones`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setZones(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  /* ===== CREATE ===== */
  const openCreate = () => {
    setEditingZoneId(null);
    setZoneName("");
    setRegions(["Everywhere"]);
    setShippingMethods({ free: true, weight: false });
    setShowForm(true);
  };

  /* ===== EDIT ===== */
  const openEdit = async (zone: ShippingZone) => {
  setEditingZoneId(zone.id);
  setZoneName(zone.zone_name);
  setRegions(
    zone.regions ? zone.regions.split(", ").filter(Boolean) : ["Everywhere"]
  );
  setShowForm(true);

  const token = localStorage.getItem("admin_token");

  const res = await fetch(
    `${API_URL}/api/shipping/zones/${zone.id}/methods`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const data: { method_type: "free" | "weight"; enabled: number }[] =
    await res.json();

  const methods = { free: false, weight: false };

  data.forEach((m) => {
    methods[m.method_type] = m.enabled === 1;
  });

  setShippingMethods(methods);

  const wmRes = await fetch(
  `${API_URL}/api/shipping/zones/${zone.id}/weight-method`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const weightMethod = await wmRes.json();

if (weightMethod?.id) {
  const rulesRes = await fetch(
    `${API_URL}/api/shipping/methods/${weightMethod.id}/weight-rules`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const rules = await rulesRes.json();

  setWeightRules(
    rules.map((r: any) => ({
      min: Number(r.weight_from),
      max: r.weight_to,
      type: r.charge_type,
      flatCost: r.flat_cost,
      perKgCost: r.per_kg_cost,
      baseCost: r.base_cost,
      baseWeight: r.base_weight,
      extraCost: r.extra_cost_per_kg,
    }))
  );
}

};


  /* ===== SAVE ===== */
  const saveZone = async () => {
    if (!zoneName.trim()) {
      setToastMsg("Zone name required");
      setToastOpen(true);
      return;
    }

  setLoading(true);
  const token = localStorage.getItem("admin_token");

  const zoneUrl = editingZoneId
    ? `${API_URL}/api/shipping/zones/${editingZoneId}`
    : `${API_URL}/api/shipping/zones`;

  const method = editingZoneId ? "PUT" : "POST";

  // 1️⃣ Save zone + regions
  const res = await fetch(zoneUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ zone_name: zoneName, regions }),
  });

  const result = await res.json();
  const zoneId = editingZoneId || result.insertId;

  // 2️⃣ Save shipping methods ✅
  await fetch(`${API_URL}/api/shipping/zones/${zoneId}/methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      methods: [
        { method_type: "free", enabled: shippingMethods.free },
        { method_type: "weight", enabled: shippingMethods.weight },
      ],
    }),
  });
  if (shippingMethods.weight) {
  const wmRes = await fetch(
    `${API_URL}/api/shipping/zones/${zoneId}/weight-method`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const weightMethod = await wmRes.json();

  if (weightMethod?.id) {
    await fetch(
      `${API_URL}/api/shipping/methods/${weightMethod.id}/weight-rules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rules: weightRules }),
      }
    );
  }
}


  setShowForm(false);
  setEditingZoneId(null);
  setLoading(false);
  fetchZones();
};

const askDeleteZone = (id: number) => {
  setZoneToDelete(id);
  setConfirmOpen(true);
};



  const confirmDeleteZone = async () => {
  if (!zoneToDelete) return;

  const token = localStorage.getItem("admin_token");

  await fetch(`${API_URL}/api/shipping/zones/${zoneToDelete}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  setConfirmOpen(false);
  setZoneToDelete(null);

  fetchZones();

  // optional toast
  setToastMsg("Zone deleted successfully");
  setToastOpen(true);
};


  return (
    <>
      {!showForm && (
        <ShippingZonesTable
          zones={zones}
          onEdit={openEdit}
          onDelete={askDeleteZone}
          onAdd={openCreate}
        />
      )}

      {showForm && (
        <ShippingZoneForm
          zoneName={zoneName}
          setZoneName={setZoneName}
          regions={regions}
          setRegions={setRegions}
          regionInput={regionInput}
          setRegionInput={setRegionInput}
          shippingMethods={shippingMethods}
          setShippingMethods={setShippingMethods}
          regionOptions={REGION_OPTIONS}
          loading={loading}
          onSave={saveZone}
          onCancel={() => setShowForm(false)}
          editing={!!editingZoneId}
          weightRules={weightRules}
          setWeightRules={setWeightRules}
        />
      )}

                            <AlertPopup
                              open={toastOpen}
                              message={toastMsg}
                              onClose={() => setToastOpen(false)}
                            />

                            <ConfirmPopup
                              open={confirmOpen}
                              title="Delete zone?"
                              message="This zone and all related shipping rules will be permanently removed."
                              confirmText="Delete"
                              onCancel={() => {
                                setConfirmOpen(false);
                                setZoneToDelete(null);
                              }}
                              onConfirm={confirmDeleteZone}
                            />

    </>
  );
};

export default ShippingZonesPage;
