"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  type?: "success" | "error"; // <-- Add the type prop
  onClose: () => void;
  duration?: number;
};

export default function AlertPopup({
  open,
  message,
  type = "error", // <-- Default to error
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  // 👇 Dynamically set background color based on the type
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
      <div className={`${bgColor} text-white px-6 py-3 rounded-md shadow-lg text-sm font-medium transition-colors duration-300`}>
        {message}
      </div>
    </div>
  );
}