"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function TopBannerAd({ pageType }: { pageType: string }) {
  const [ads, setAds] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/public-ads?page_type=${pageType}&target_imprint=agph`)
      .then((res) => res.json())
      .then((data) => {
        const banners = data.filter((a: any) => a.ad_type === "top_banner");
        setAds(banners);
        // Track impression for first ad
        if (banners.length > 0)
          fetch(`${API_URL}/api/public-ads/${banners[0].id}/view`, { method: "POST" }).catch(() => {});
      })
      .catch(console.error);
  }, [pageType]);

  // Auto-slide
  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ads.length;
        fetch(`${API_URL}/api/public-ads/${ads[next].id}/view`, { method: "POST" }).catch(() => {});
        return next;
      });
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ads]);

  const handleAction = (ad: any) => {
    fetch(`${API_URL}/api/public-ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  if (ads.length === 0) return null;
  const ad = ads[index];

  return (
    <div className="w-full relative z-50 p-3">
      <div className="relative overflow-hidden rounded-lg">
        <Link href={ad.link_url || "#"} target={ad.link_target} onClick={() => handleAction(ad)}>
          <img
            src={`${API_URL}${ad.image_url}`}
            alt={ad.alt_text || "Advertisement"}
            className="w-full rounded-lg object-cover transition-opacity duration-500"
          />
        </Link>

        {/* Dots */}
        {ads.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}