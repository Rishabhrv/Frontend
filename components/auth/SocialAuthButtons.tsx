"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

const SocialAuthButtons = () => {
  const router = useRouter();
  const pathname = usePathname(); // /login or /register

  const isRegister = pathname === "/register";

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const endpoint = isRegister
      ? "google/register"
      : "google/login";

    const res = await fetch(
      `${API_URL}/api/auth/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email,
          google_id: user.uid,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg);
      return;
    }

    localStorage.setItem("token", data.token);
    window.dispatchEvent(new Event("auth-change"));

    router.push("/");
  };

  return (
    <button
      onClick={handleGoogle}
      className="w-full flex items-center cursor-pointer justify-center gap-3 border border-gray-300 rounded-md py-2.5 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
    >
      <img
        src="./google-color.svg"
        alt="Google"
        className="w-5 h-5"
      />
      Sign in with Google
    </button>

  );
};

export default SocialAuthButtons;
