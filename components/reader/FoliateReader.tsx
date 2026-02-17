"use client";

import { useEffect, useRef } from "react";

// IMPORTANT: import the web component
import "@/lib/foliate/view.js";

export default function FoliateReader({
  url,
}: {
  url: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = document.createElement(
      "foliate-view"
    ) as any;

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(view);

    view.addEventListener("relocate", (e: any) => {
      console.log("Progress:", e.detail.fraction);
    });

    view.open(url);

    return () => {
      view?.remove();
    };
  }, [url]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
    />
  );
}
