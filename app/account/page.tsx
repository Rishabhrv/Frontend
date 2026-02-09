"use client";

import { useEffect, useState } from "react";
import AlertPopup from "@/components/Popups/AlertPopup";

/* ================= TYPES ================= */

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  google_id?: string | null;
};

type Address = {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};


const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/* ================= PAGE ================= */

export default function AccountHome() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);

  const [editEmail, setEditEmail] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      fetch(`${API_URL}/api/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch(`${API_URL}/api/account/address`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]).then(([profileData, addressData]) => {
      setProfile(profileData);
      setAddress(addressData);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) return null;

  /* ================= API ================= */

const saveProfile = async (profile: Profile) => {
  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/api/account/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  setToastMsg("Profile updated successfully");
  setToastOpen(true);
};

const saveAddress = async (address: Address | null) => {
  if (!address) return;

  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/api/account/address`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(address),
  });

  setToastMsg("Address updated successfully");
  setToastOpen(true);
};

const updatePassword = async (
  newPassword: string,
  confirmPassword: string
) => {
  if (newPassword !== confirmPassword) {
    setToastMsg("Passwords do not match");
    setToastOpen(true);
    return;
  }

  const token = localStorage.getItem("token");

  await fetch(`${API_URL}/api/account/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  setToastMsg("Password updated successfully");
  setToastOpen(true);
};


  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Account</h1>


      <div className="bg-white border border-gray-300 rounded-lg p-8 space-y-10">

        {/* ================= NAME + PHONE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Full Name" value={profile.name} disabled />

          <Input
            label="Phone Number"
            value={profile.phone || ""}
            onChange={(v) =>
              setProfile({ ...profile, phone: v })
            }
          />
        </div>

        {/* ================= EMAIL ================= */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              label="Email Address"
              value={profile.email}
              disabled={!editEmail}
              onChange={(v) =>
                setProfile({ ...profile, email: v })
              }
            />
          </div>

          <button
            onClick={() => setEditEmail(!editEmail)}
            className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-100"
          >
            {editEmail ? "Cancel" : "Edit Email"}
          </button>

          {/* GOOGLE ICON */}
          {profile.google_id && (
            <img
              src="/google-color.svg"
              alt="Google"
              className="h-8 w-8"
            />
          )}
        </div>

        {/* ================= PASSWORD ================= */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input label="Password" value="********" disabled />
          </div>

          <button
            onClick={() => setChangePassword(!changePassword)}
            className="border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-100"
          >
            Change Password
          </button>
        </div>

        {/* ================= PASSWORD FORM ================= */}
        {changePassword && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <Input
      label="New Password"
      value={newPassword}
      onChange={(v) => {
        setNewPassword(v);
        setPasswordError("");
      }}
    />

    <Input
      label="Confirm Password"
      value={confirmPassword}
      onChange={(v) => {
        setConfirmPassword(v);
        setPasswordError("");
      }}
    />

    {/* ❌ ERROR MESSAGE */}
    {passwordError && (
      <div className="md:col-span-2 text-sm text-red-600">
        {passwordError}
      </div>
    )}

    <SaveButton
      label="Update Password"
      onClick={() => {
        if (newPassword.length < 6) {
          setPasswordError("Password must be at least 6 characters");
          return;
        }

        if (newPassword !== confirmPassword) {
          setPasswordError("Passwords do not match");
          return;
        }

        updatePassword(newPassword, confirmPassword);
      }}
    />
  </div>
)}


        {/* ================= ADDRESS ================= */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Saved Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Address"
              value={address?.address || ""}
              onChange={(v) =>
                setAddress({ ...address!, address: v })
              }
            />

            <Input
              label="City"
              value={address?.city || ""}
              onChange={(v) =>
                setAddress({ ...address!, city: v })
              }
            />

            <Input
              label="State"
              value={address?.state || ""}
              onChange={(v) =>
                setAddress({ ...address!, state: v })
              }
            />

            <Input
              label="Country"
              value={address?.country || ""}
              onChange={(v) =>
                setAddress({ ...address!, country: v })
              }
            />

            <Input
              label="Pincode"
              value={address?.pincode || ""}
              onChange={(v) =>
                setAddress({ ...address!, pincode: v })
              }
            />

            <div className="md:col-span-2 flex justify-end mt-2">
              <button
                onClick={() => saveAddress(address)}
                className="border border-gray-300 px-6 py-2 rounded text-sm hover:bg-gray-100 transition"
              >
                Save Address
              </button>
            </div>
          </div>

          
        </div>

        {/* ================= PROFILE SAVE ================= */}
        <SaveButton
          label="Save Profile"
          onClick={() => saveProfile(profile)}
        />
      </div>
      <AlertPopup
        open={toastOpen}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />

    </div>
  );
}

/* ================= UI ================= */

const StatBox = ({ title, value }: { title: string; value: string }) => (
  <div className="border border-gray-300 rounded-lg p-6 text-center bg-white">
    <p className="text-gray-500 text-sm">{title}</p>
    <p className="text-2xl font-semibold mt-2">{value}</p>
  </div>
);

const Input = ({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">
      {label}
    </label>
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full border border-gray-300 px-3 py-2 text-sm rounded disabled:bg-gray-100 focus:ring-1 focus:ring-black"
    />
  </div>
);

const SaveButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 text-sm mt-6 w-fit"
  >
    {label}
  </button>
);

