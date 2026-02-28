"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import AlertPopup from "@/components/Popups/AlertPopup";

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

/* ─── 6-box OTP input ─── */
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...value];
    next[idx]  = val;
    onChange(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0)
      refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {value.map((digit, idx) => (
        <input
          key={idx}
          ref={el => { refs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          className={`w-11 h-12 text-center text-lg font-bold border rounded-lg transition
            focus:outline-none focus:ring-2
            ${digit
              ? "border-black bg-black text-white"
              : "border-gray-200 bg-white text-gray-800 focus:ring-black/10 focus:border-gray-400"
            }`}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════ */
export default function AccountHome() {
  const [profile, setProfile]  = useState<Profile | null>(null);
  const [address, setAddress]  = useState<Address>({ address: "", city: "", state: "", country: "", pincode: "" });
  const [loading, setLoading]  = useState(true);

  /* password */
  const [showPassword,     setShowPassword]     = useState(false);
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");

  /* email change — 3 steps: "idle" | "input" | "otp" */
  const [emailStep,    setEmailStep]    = useState<"idle" | "input" | "otp">("idle");
  const [newEmail,     setNewEmail]     = useState("");
  const [emailOtp,     setEmailOtp]     = useState(["","","","","",""]);
  const [resendTimer,  setResendTimer]  = useState(0);

  /* loading states */
  const [savingProfile,  setSavingProfile]  = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingEmail,    setSavingEmail]    = useState(false);

  /* toast */
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg,  setToastMsg]  = useState("");
  const toast = (msg: string) => { setToastMsg(msg); setToastOpen(true); };

  /* resend countdown */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* load */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/api/account/profile`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_URL}/api/account/address`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([p, a]) => {
      setProfile(p);
      if (a) setAddress(a);
      setLoading(false);
    });
  }, []);

  const token = () => localStorage.getItem("token") || "";

  /* ── Save profile + address ── */
  const handleSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    await Promise.all([
      fetch(`${API_URL}/api/account/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      }),
      fetch(`${API_URL}/api/account/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(address),
      }),
    ]);
    setSavingProfile(false);
    toast("Profile & address saved successfully.");
  };

  /* ── Update password ── */
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6)          return toast("Password must be at least 6 characters.");
    if (newPassword !== confirmPassword)  return toast("Passwords do not match.");
    setSavingPassword(true);
    const res  = await fetch(`${API_URL}/api/account/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    setSavingPassword(false);
    toast(data.msg);
    if (res.ok) { setNewPassword(""); setConfirmPassword(""); setShowPassword(false); }
  };

  /* ── Send email OTP ── */
  const handleSendEmailOtp = async () => {
    if (!newEmail || !newEmail.includes("@"))  return toast("Enter a valid email address.");
    if (newEmail === profile?.email)            return toast("This is already your current email.");
    setSavingEmail(true);
    const res  = await fetch(`${API_URL}/api/account/send-email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ newEmail }),
    });
    const data = await res.json();
    setSavingEmail(false);
    if (!res.ok) { toast(data.msg); return; }
    setEmailStep("otp");
    setResendTimer(60);
    toast("Verification code sent to your new email.");
  };

  /* ── Verify OTP + update email ── */
  const handleVerifyEmail = async () => {
    if (emailOtp.join("").length < 6) return toast("Enter the complete 6-digit code.");
    setSavingEmail(true);
    const res  = await fetch(`${API_URL}/api/account/email`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ otp: emailOtp.join("") }),
    });
    const data = await res.json();
    setSavingEmail(false);
    toast(data.msg);
    if (res.ok) {
      setProfile(prev => prev ? { ...prev, email: data.email } : prev);
      setEmailStep("idle");
      setNewEmail("");
      setEmailOtp(["","","","","",""]);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setSavingEmail(true);
    const res  = await fetch(`${API_URL}/api/account/send-email-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ newEmail }),
    });
    const data = await res.json();
    setSavingEmail(false);
    toast(res.ok ? "New code sent!" : data.msg);
    if (res.ok) { setEmailOtp(["","","","","",""]); setResendTimer(60); }
  };

  /* ── Reset email flow ── */
  const cancelEmailChange = () => {
    setEmailStep("idle");
    setNewEmail("");
    setEmailOtp(["","","","","",""]);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400 gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Loading…
      </div>
    );
  }

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 " +
    "focus:border-gray-400 bg-white transition disabled:bg-gray-50 disabled:text-gray-400";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold mb-8">My Account</h1>

      <div className="space-y-6">

        {/* ══════════════════════════════════════
            SECTION 1 — Personal Info + Address
        ══════════════════════════════════════ */}
        <Section title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input className={inputCls} value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input className={inputCls} value={profile.phone || ""} placeholder="+91 00000 00000"
                onChange={e => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Saved Address</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Street Address</label>
                <input className={inputCls} value={address.address} placeholder="House no, Street, Area"
                  onChange={e => setAddress({ ...address, address: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input className={inputCls} value={address.city} placeholder="Mumbai"
                  onChange={e => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input className={inputCls} value={address.state} placeholder="Maharashtra"
                  onChange={e => setAddress({ ...address, state: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input className={inputCls} value={address.country} placeholder="India"
                  onChange={e => setAddress({ ...address, country: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Pincode</label>
                <input className={inputCls} value={address.pincode} placeholder="400001"
                  onChange={e => setAddress({ ...address, pincode: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <SaveBtn loading={savingProfile} onClick={handleSaveProfile} label="Save Changes" />
          </div>
        </Section>

        {/* ══════════════════════════════════════
            SECTION 2 — Email (3-step flow)
        ══════════════════════════════════════ */}
        <Section title="Email Address">

          {/* Current email row */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-700 flex-1 truncate">{profile.email}</span>

            {/* Google icon instead of badge */}
            {profile.google_id && (
              <Image src="/google-color.svg" alt="Google account" width={20} height={20} />
            )}
          </div>

          {/* STEP: idle — just the button */}
          {emailStep === "idle" && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setEmailStep("input")}
                className="text-sm font-semibold text-black border border-gray-200 rounded-lg
                           px-4 py-2.5 hover:bg-gray-50 transition cursor-pointer"
              >
                Change Email
              </button>
            </div>
          )}

          {/* STEP: input — enter new email + send code */}
          {emailStep === "input" && (
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls}>New Email Address</label>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="new@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400">
                A 6-digit verification code will be sent to your new email.
              </p>
              <div className="flex items-center gap-3">
                <SaveBtn loading={savingEmail} onClick={handleSendEmailOtp} label="Send Verification Code" />
                <button onClick={cancelEmailChange}
                  className="text-sm text-gray-400 hover:text-gray-700 transition cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP: otp — verify code */}
          {emailStep === "otp" && (
            <div className="mt-4 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Code sent to <strong>{newEmail}</strong>.{" "}
                <button
                  onClick={() => { setEmailStep("input"); setEmailOtp(["","","","","",""]); }}
                  className="underline hover:no-underline ml-1 cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div>
                <label className={labelCls}>Enter 6-digit verification code</label>
                <OtpInput value={emailOtp} onChange={setEmailOtp} />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-gray-400">
                  {resendTimer > 0 ? (
                    <>Resend in <span className="font-semibold text-gray-600">{resendTimer}s</span></>
                  ) : (
                    <button onClick={handleResend} disabled={savingEmail}
                      className="text-blue-600 hover:underline disabled:opacity-50 cursor-pointer">
                      Resend code
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={cancelEmailChange}
                    className="text-sm text-gray-400 hover:text-gray-700 transition cursor-pointer">
                    Cancel
                  </button>
                  <SaveBtn
                    loading={savingEmail}
                    disabled={emailOtp.join("").length < 6}
                    onClick={handleVerifyEmail}
                    label="Verify & Update Email"
                  />
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ══════════════════════════════════════
            SECTION 3 — Password
        ══════════════════════════════════════ */}
        <Section title="Password">
          {!showPassword ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Keep your account secure with a strong password.</p>
              <button
                onClick={() => setShowPassword(true)}
                className="text-sm font-semibold text-black border border-gray-200 rounded-lg cursor-pointer
                           px-4 py-2.5 hover:bg-gray-50 transition"
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>New Password</label>
                  <input type="password" className={inputCls} placeholder="Min. 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input type="password" className={inputCls} placeholder="Repeat password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
              )}
              {newPassword.length >= 6 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => { setShowPassword(false); setNewPassword(""); setConfirmPassword(""); }}
                  className="text-sm text-gray-400 hover:text-gray-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <SaveBtn loading={savingPassword} onClick={handleUpdatePassword} label="Update Password" />
              </div>
            </div>
          )}
        </Section>

      </div>

      <AlertPopup open={toastOpen} message={toastMsg} onClose={() => setToastOpen(false)} />
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  );
}

/* ─── Save button ─── */
function SaveBtn({ onClick, loading, label, disabled = false }: {
  onClick: () => void; loading: boolean; label: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading || disabled}
      className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg cursor-pointer
                 hover:bg-gray-800 disabled:opacity-50 transition flex items-center gap-2">
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {loading ? "Saving…" : label}
    </button>
  );
}