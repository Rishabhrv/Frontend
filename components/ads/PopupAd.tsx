"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function PopupAd({ pageType }: { pageType: string }) {
  const [ads, setAds] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/public-ads?page_type=${pageType}&target_imprint=agph`)
      .then((res) => res.json())
      .then((data) => {
        const popups = data
          .filter((a: any) => a.ad_type === "popup")
          .filter((a: any) => {
            if (a.popup_frequency === "once_per_session" && sessionStorage.getItem(`ad_closed_${a.id}`)) return false;
            if (a.popup_frequency === "once_ever" && localStorage.getItem(`ad_closed_${a.id}`)) return false;
            return true;
          });

        if (popups.length === 0) return;
        setAds(popups);

        const delayMs = (popups[0].popup_delay_seconds || 0) * 1000;
        setTimeout(() => {
          setShowPopup(true);
          fetch(`${API_URL}/api/public-ads/${popups[0].id}/view`, { method: "POST" }).catch(() => {});
        }, delayMs);
      })
      .catch(console.error);
  }, [pageType]);

  // Auto-slide when multiple ads
  useEffect(() => {
    if (!showPopup || ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ads.length;
        fetch(`${API_URL}/api/public-ads/${ads[next].id}/view`, { method: "POST" }).catch(() => {});
        return next;
      });
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showPopup, ads]);

  const goTo = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIndex(i);
    fetch(`${API_URL}/api/public-ads/${ads[i].id}/view`, { method: "POST" }).catch(() => {});
  };

  const handleClose = () => {
    setShowPopup(false);
    ads.forEach((ad) => {
      if (ad.popup_frequency === "once_per_session") sessionStorage.setItem(`ad_closed_${ad.id}`, "true");
      if (ad.popup_frequency === "once_ever") localStorage.setItem(`ad_closed_${ad.id}`, "true");
    });
  };

  const handleAction = () => {
    const ad = ads[index];
    if (ad) fetch(`${API_URL}/api/public-ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  if (!showPopup || ads.length === 0) return null;

  const ad = ads[index];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex  items-center justify-center sm:p-4 backdrop-blur-xs animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white w-full sm:w-auto sm:max-w-lg md:max-w-xl m-4 rounded-2xl sm:rounded-2xl shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 bg-black hover:bg-black/70 text-white cursor-pointer rounded-full p-1.5 z-10 transition"
        >
          <X size={16} />
        </button>

        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Slide area */}
        <div className="relative overflow-hidden">
          {/* Slides */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {ads.map((a) => (
              <div key={a.id} className="w-full flex-shrink-0">
                <Link href={a.link_url || "#"} target={a.link_target} onClick={handleAction}>
                  {a.image_url && (
                    <img
                      src={`${API_URL}${a.image_url}`}
                      alt={a.alt_text || "Advertisement"}
                      className="w-full h-auto object-cover max-h-[50vh] sm:max-h-[60vh]"
                    />
                  )}
                  {a.html_content && (
                    <div
                      className="p-4 sm:p-6 text-center text-gray-800 text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: a.html_content }}
                    />
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Prev / Next arrows — only when multiple */}
          {ads.length > 1 && (
            <>
              <button
                onClick={() => goTo((index - 1 + ads.length) % ads.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 transition cursor-pointer z-10"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => goTo((index + 1) % ads.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 transition cursor-pointer z-10"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators — only when multiple */}
        {ads.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? "w-4 h-1.5 bg-gray-800" : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-500"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}