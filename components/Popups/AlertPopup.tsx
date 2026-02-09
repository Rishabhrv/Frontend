"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number; // auto close (ms)
};

export default function AlertPopup({
  open,
  message,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="bg-red-600 text-white px-6 py-3 rounded-md shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  );
}
