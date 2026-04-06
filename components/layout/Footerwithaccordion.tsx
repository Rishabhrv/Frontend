"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Footer from "./Footer";

export default function FooterWithAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full pb-16 md:pb-0">
      {/* ── MOBILE TOGGLE BUTTON (Only visible on small screens) ── */}
      <div className="md:hidden ">
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
      </div>

      {/* ── UNIFIED FOOTER CONTAINER ── */}
      {/* 1. overflow-hidden + transition: handles mobile accordion animation */}
      {/* 2. ${open ? "max-h-[3000px]" : "max-h-0"} : controls mobile expansion */}
      {/* 3. md:max-h-none md:block : Overrides mobile constraints for desktop */}
      <div
        className={`
          overflow-hidden transition-all duration-500 ease-in-out
          ${open ? "max-h-[3000px]" : "max-h-0"} 
          md:max-h-none md:block
        `}
      >
        {/* Adds padding only on mobile so it doesn't overlap the fixed nav bar */}
        <div className="pb-16 md:pb-0">
          <Footer />
        </div>
      </div>
    </div>
  );
}