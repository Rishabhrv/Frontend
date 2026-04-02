"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const INTERVAL_MS = 5000;

export default function SidebarAd({ pageType }: { pageType: string }) {
  const [ads, setAds] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/public-ads?page_type=${pageType}&target_imprint=agph`)
      .then((res) => res.json())
      .then((data) => {
        const sidebars = data.filter((a: any) => a.ad_type === "sidebar");
        setAds(sidebars);
        if (sidebars.length > 0)
          fetch(`${API_URL}/api/public-ads/${sidebars[0].id}/view`, { method: "POST" }).catch(() => {});
      })
      .catch(console.error);
  }, [pageType]);

  const goTo = (i: number, allAds: any[]) => {
    setIndex(i);
    setProgress(0);
    fetch(`${API_URL}/api/public-ads/${allAds[i].id}/view`, { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    if (ads.length <= 1) return;

    // Progress bar tick
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (100 / (INTERVAL_MS / 100)), 100));
    }, 100);

    // Slide advance
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ads.length;
        setProgress(0);
        fetch(`${API_URL}/api/public-ads/${ads[next].id}/view`, { method: "POST" }).catch(() => {});
        return next;
      });
    }, INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [ads]);

  const handleAction = (ad: any) => {
    fetch(`${API_URL}/api/public-ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="w-full rounded-xl overflow-hidden mb-6 py-5">
      <div className="relative">
        <Link href={ad.link_url || "#"} target={ad.link_target} onClick={() => handleAction(ad)} className="block">
          <img
            src={`${API_URL}${ad.image_url}`}
            alt={ad.alt_text || "Advertisement"}
            className="w-full h-auto object-cover hover:opacity-95 transition rounded-xl"
          />
          {ad.html_content && (
            <div className="p-4 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: ad.html_content }} />
          )}
        </Link>

        {/* Progress bar — only when multiple ads */}
        {ads.length > 1 && (
          <div className="mt-2 h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 transition-none rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Dot nav */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, ads)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? "w-4 h-1.5 bg-gray-700" : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}