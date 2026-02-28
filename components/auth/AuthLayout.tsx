"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const slides = [
  {
    label: "Capturing Moments, Creating Memories",
    image: "images/login/slide3.jpg",
  },
  {
    label: "Publish Your Story with AGPH",
    image: "images/login/slide2.jpg",
  },
  {
    label: "India's Trusted Self-Publishing Platform",
    image: "images/login/slide.jpg",
  },
];

const AuthLayout = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      transition((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const transition = (updater: (c: number) => number) => {
    setFading(true);
    setTimeout(() => {
      setCurrent((c) => updater(c));
      setFading(false);
    }, 400);
  };

  const goTo = (i: number) => transition(() => i);

  return (
    <div className="flex items-center justify-center p-6">
      {/* Card wrapper */}
      <div className="w-full rounded-2xl overflow-hidden flex">

        {/* ─── LEFT IMAGE SLIDESHOW PANEL ─── */}
        <div className="relative hidden md:flex flex-col w-1/2 flex-shrink-0 overflow-hidden min-h-[620px]">

          {/* All slide images stacked, cross-fade via opacity */}
          {slides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? (fading ? 0 : 1) : 0 }}
            >
              <img
                src={slide.image}
                alt={slide.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.65) 100%)",
                }}
              />
            </div>
          ))}

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-6">
            <span
              className="text-white font-bold text-xl"
              style={{ fontFamily: "'Courier New', monospace", letterSpacing: "0.15em" }}
            >
              AGPH
            </span>

            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 backdrop-blur-sm"
            >
              Back to website
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Bottom caption + dots */}
          <div className="relative z-10 mt-auto px-8 pb-8">
            <p
              className="text-white text-xl font-semibold leading-snug mb-5 transition-opacity duration-400"
              style={{ fontFamily: "'Georgia', serif", opacity: fading ? 0 : 1 }}
            >
              {slides[current].label}
            </p>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="h-1 rounded-full transition-all duration-300 focus:outline-none cursor-pointer"
                  style={{
                    width: i === current ? "28px" : "12px",
                    backgroundColor: i === current ? "#ffffff" : "rgba(255,255,255,0.35)",
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT FORM PANEL ─── */}
        <div className="flex items-center justify-center px-6 mx-auto py-20">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-sm text-gray-600 mb-6">{subtitle}</p>
            {children}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;