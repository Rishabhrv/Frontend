"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Footer from "./Footer";

export default function FooterWithAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile accordion (hidden on md+) ── */}
      {/* pb-16 keeps it above the fixed bottom nav bar */}
      <div className="md:hidden pb-16">

        <button
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-br from-[#070d1c] to-[#01040f] border-t border-gray-800"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-300">
              AGPH Books Store
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[11px] font-medium">
              {open ? " " : "About & Contact"}
            </span>
            <ChevronDown
              size={15}
              className="transition-transform duration-300"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </button>

        {/* Expandable footer content */}
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{ maxHeight: open ? "3000px" : "0px" }}
        >
          <Footer />
        </div>

      </div>

      {/* ── Desktop footer — always visible on md+ ── */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}