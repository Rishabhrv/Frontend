"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

type ProductPixelData = {
  id: number;
  title: string;
  price: number;
  currency?: string;
};

export default function ProductMetaPixel({
  pixelIds,
  product,
}: {
  pixelIds: string[];
  product: ProductPixelData;
}) {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (!sdkLoaded || typeof window.fbq !== "function" || !pixelIds || pixelIds.length === 0) return;

    pixelIds.forEach((id) => window.fbq!("init", id));
    window.fbq("track", "PageView");
    window.fbq("track", "ViewContent", {
      content_ids: [String(product.id)],
      content_name: product.title,
      content_type: "product",
      value: product.price,
      currency: product.currency ?? "INR",
    });
  }, [sdkLoaded, pixelIds, product]);

  if (!pixelIds || pixelIds.length === 0) return null;

  return (
    <>
      <Script
        id="meta-pixel-sdk"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />
      <noscript>
        {pixelIds.map((id) => (
          <img
            key={id}
            height={1}
            width={1}
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
            alt=""
          />
        ))}
      </noscript>
    </>
  );
}
