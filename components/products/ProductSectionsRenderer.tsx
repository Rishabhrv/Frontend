"use client";

import React from "react";
import Image from "next/image";
import { SectionType } from "@/utils/sectionTypes";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

type Section = {
  id: number;
  type: SectionType;
  data: Record<string, any>;
};

const formatValue = (val: any) => {
  if (!val) return undefined;
  if (typeof val === "string" && /^\d+$/.test(val.trim())) {
    return `${val}px`;
  }
  return val;
};

const getStyle = (styles?: any) => {
  if (!styles) return undefined;
  const style: React.CSSProperties = {};
  if (styles.marginTop) style.marginTop = formatValue(styles.marginTop);
  if (styles.marginRight) style.marginRight = formatValue(styles.marginRight);
  if (styles.marginBottom) style.marginBottom = formatValue(styles.marginBottom);
  if (styles.marginLeft) style.marginLeft = formatValue(styles.marginLeft);
  if (styles.paddingTop) style.paddingTop = formatValue(styles.paddingTop);
  if (styles.paddingRight) style.paddingRight = formatValue(styles.paddingRight);
  if (styles.paddingBottom) style.paddingBottom = formatValue(styles.paddingBottom);
  if (styles.paddingLeft) style.paddingLeft = formatValue(styles.paddingLeft);
  return Object.keys(style).length > 0 ? style : undefined;
};

export default function ProductSectionsRenderer({ sections, className }: { sections?: Section[], className?: string }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className={className || "mt-12 sm:mt-20  px-5 xl:px-1 border-b border-gray-200 pb-10"}>
      {sections.map((section, idx) => {
        const { type, data } = section;

        return (
          <div key={section.id || idx} className="w-full">
            {/* Section Title */}
            {data.title && (
              <h2 className="text-xl sm:text-2xl font-serif font-semibold my-6 mt-7 sm:mt-8 sm:my-6" style={getStyle(data.titleStyles)}>
                {data.title}
              </h2>
            )}

            {/* ── Single Image ── */}
            {type === "single_image" && data.image && (
              <div className="flex flex-col ">
                <div className="relative w-full rounded-lg overflow-hidden shadow-sm group" style={getStyle(data.imageStyles)}>
                  <Image
                    src={`${API_URL}${data.image}`}
                    alt={data.heading || data.alt || "Product image"}
                    width={1200}
                    height={600}
                    unoptimized
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                {data.heading && (
                  <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 py-4  pb-0 sm:pb-0" style={getStyle(data.headingStyles)}>
                    {data.heading}
                  </h3>
                )}
                {data.caption && (
                  <p className=" mt-2 sm:mt-0 text-sm text-gray-500 text-left content-justify italic" style={getStyle(data.captionStyles)}>{data.caption}</p>
                )}
              </div>
            )}

            {/* ── Two Images ── */}
            {type === "two_image" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.imageLeft && (
                  <div className="flex flex-col">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-sm group" style={getStyle(data.imageLeftStyles)}>
                      <Image
                        src={`${API_URL}${data.imageLeft}`}
                        alt={data.altLeft || "Product image"}
                        width={600}
                        height={600}
                        unoptimized
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                    {data.captionLeft && (
                      <p className="mt-3 text-sm text-gray-500 italic text-justify" style={getStyle(data.captionLeftStyles)}>{data.captionLeft}</p>
                    )}
                  </div>
                )}
                {data.imageRight && (
                  <div className="flex flex-col">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-sm group" style={getStyle(data.imageRightStyles)}>
                      <Image
                        src={`${API_URL}${data.imageRight}`}
                        alt={data.altRight || "Product image"}
                        width={600}
                        height={600}
                        unoptimized
                        className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                    {data.captionRight && (
                      <p className="mt-3 text-sm text-gray-500 italic text-justify" style={getStyle(data.captionRightStyles)}>{data.captionRight}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Image + Content ── */}
            {type === "image_content" && data.image && (
              <div
                className={`flex flex-col gap-8 sm:gap-12 items-start ${data.layout === "image-right" ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
              >
                <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-sm group relative" style={getStyle(data.imageStyles)}>
                  <Image
                    src={`${API_URL}${data.image}`}
                    alt={data.alt || "Product image"}
                    width={800}
                    height={800}
                    unoptimized
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-start space-y-4 mb-auto">
                  {data.heading && (
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 leading-tight" style={getStyle(data.headingStyles)}>
                      {data.heading}
                    </h3>
                  )}
                  {data.content && (
                    <p className="text-gray-600 leading-relaxed text-justify whitespace-pre-wrap" style={getStyle(data.contentStyles)}>
                      {data.content}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Two Videos Side-by-Side ── */}
            {type === "two_video" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.videoUrlLeft && (
                  <div className="flex flex-col">
                    <div 
                      className="w-full rounded-lg overflow-hidden shadow-sm bg-black relative" 
                      style={{ paddingBottom: '56.25%', ...getStyle(data.videoLeftStyles) }}
                    >
                      {(() => {
                        let embedUrl = data.videoUrlLeft;
                        try {
                          const parsed = new URL(embedUrl);
                          if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
                            const videoId = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
                            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                          } else if (parsed.hostname.includes("facebook.com")) {
                            embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(data.videoUrlLeft)}&show_text=0`;
                          } else if (parsed.hostname.includes("instagram.com")) {
                            embedUrl = `${data.videoUrlLeft.replace(/\/$/, "")}/embed`;
                          } else if (parsed.hostname.includes("vimeo.com")) {
                            const videoId = parsed.pathname.split("/").pop();
                            if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
                          }
                        } catch(e) {}
                        return (
                          <iframe
                            src={embedUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      })()}
                    </div>
                    {data.captionLeft && (
                      <p className="mt-4 text-sm text-gray-500 italic text-justify" style={getStyle(data.captionLeftStyles)}>{data.captionLeft}</p>
                    )}
                  </div>
                )}
                {data.videoUrlRight && (
                  <div className="flex flex-col">
                    <div 
                      className="w-full rounded-lg overflow-hidden shadow-sm bg-black relative" 
                      style={{ paddingBottom: '56.25%', ...getStyle(data.videoRightStyles) }}
                    >
                      {(() => {
                        let embedUrl = data.videoUrlRight;
                        try {
                          const parsed = new URL(embedUrl);
                          if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
                            const videoId = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
                            if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                          } else if (parsed.hostname.includes("facebook.com")) {
                            embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(data.videoUrlRight)}&show_text=0`;
                          } else if (parsed.hostname.includes("instagram.com")) {
                            embedUrl = `${data.videoUrlRight.replace(/\/$/, "")}/embed`;
                          } else if (parsed.hostname.includes("vimeo.com")) {
                            const videoId = parsed.pathname.split("/").pop();
                            if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
                          }
                        } catch(e) {}
                        return (
                          <iframe
                            src={embedUrl}
                            className="absolute top-0 left-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      })()}
                    </div>
                    {data.captionRight && (
                      <p className="mt-4 text-sm text-gray-500 italic text-justify" style={getStyle(data.captionRightStyles)}>{data.captionRight}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Four Columns ── */}
            {type === "four_column" && data.items && data.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col group border border-gray-200 rounded-lg ">
                    {item.image && (
                      <div className="relative w-full mb-6 rounded-t-lg overflow-hidden shadow-sm bg-gray-50" style={getStyle(item.imageStyles)}>

                        <Image
                          src={`${API_URL}${item.image}`}
                          alt={item.heading || item.alt || "Feature icon"}
                          width={800}
                          height={800}
                          unoptimized
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    {item.heading && (
                      <h4 className="text-md font-semibold text-gray-900 mb-2 px-3" style={getStyle(item.headingStyles)}>
                        {item.heading}
                      </h4>
                    )}
                    {item.content && (
                      <p className="text-sm text-gray-500 leading-relaxed pb-2 px-3" style={getStyle(item.contentStyles)}>
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Video ── */}
            {type === "video" && data.videoUrl && (
              <div className="flex flex-col">
                <div 
                  className="w-full rounded-lg overflow-hidden shadow-sm bg-black relative" 
                  style={{ paddingBottom: '56.25%', ...getStyle(data.videoUrlStyles) }}
                >
                  {(() => {
                    let embedUrl = data.videoUrl;
                    try {
                      const parsed = new URL(embedUrl);
                      if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
                        const videoId = parsed.hostname.includes("youtu.be") ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
                        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                      } else if (parsed.hostname.includes("facebook.com")) {
                        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(data.videoUrl)}&show_text=0`;
                      } else if (parsed.hostname.includes("instagram.com")) {
                        embedUrl = `${data.videoUrl.replace(/\/$/, "")}/embed`;
                      } else if (parsed.hostname.includes("vimeo.com")) {
                        const videoId = parsed.pathname.split("/").pop();
                        if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
                      }
                    } catch(e) {}
                    return (
                      <iframe
                        src={embedUrl}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
                {data.caption && (
                  <p className="mt-4 text-sm text-gray-500 italic text-justify" style={getStyle(data.captionStyles)}>{data.caption}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
