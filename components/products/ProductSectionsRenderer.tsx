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

export default function ProductSectionsRenderer({ sections }: { sections?: Section[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="mt-12 sm:mt-20  px-5 xl:px-1 border-b border-gray-200 pb-10">
      {sections.map((section, idx) => {
        const { type, data } = section;

        return (
          <div key={section.id || idx} className="w-full">
            {/* Section Title */}
            {data.title && (
              <h2 className="text-xl sm:text-2xl font-serif font-semibold my-6 mt-7 sm:mt-8 sm:my-6">
                {data.title}
              </h2>
            )}

            {/* ── Single Image ── */}
            {type === "single_image" && data.image && (
              <div className="flex flex-col ">
                <div className="relative w-full rounded-lg overflow-hidden shadow-sm group">
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
                  <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 py-4  pb-0 sm:pb-0">
                    {data.heading}
                  </h3>
                )}
                {data.caption && (
                  <p className=" mt-2 sm:mt-0 text-sm text-gray-500 text-left content-justify italic">{data.caption}</p>
                )}
              </div>
            )}

            {/* ── Two Images ── */}
            {type === "two_image" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.imageLeft && (
                  <div className="flex flex-col">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-sm group">
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
                      <p className="mt-3 text-sm text-gray-500 italic text-justify">{data.captionLeft}</p>
                    )}
                  </div>
                )}
                {data.imageRight && (
                  <div className="flex flex-col">
                    <div className="relative w-full rounded-lg overflow-hidden shadow-sm group">
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
                      <p className="mt-3 text-sm text-gray-500 italic text-justify">{data.captionRight}</p>
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
                <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-sm group relative">
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
                    <h3 className="text-lg sm:text-xl font-serif font-semibold text-gray-900 leading-tight">
                      {data.heading}
                    </h3>
                  )}
                  {data.content && (
                    <p className="text-gray-600 leading-relaxed text-justify whitespace-pre-wrap">
                      {data.content}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Four Columns ── */}
            {type === "four_column" && data.items && data.items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col group border border-gray-200 rounded-lg ">
                    {item.image && (
                      <div className="relative w-full mb-6 rounded-t-lg overflow-hidden shadow-sm bg-gray-50">

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
                      <h4 className="text-md font-semibold text-gray-900 mb-2 px-3">
                        {item.heading}
                      </h4>
                    )}
                    {item.content && (
                      <p className="text-sm text-gray-500 leading-relaxed pb-2 px-3">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
