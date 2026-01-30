"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  {
    id: 1,
    image: "/images/banners/banner1.png",
    alt: "Buy Premium Ebooks Online",
  },
  {
    id: 2,
    image: "/images/banners/banner2.png",
    alt: "Self Publishing with AGPH",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  // 🔁 Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* SLIDES */}
      <div className="relative h-120 md:h-110 w-full overflow-hidden">
  {banners.map((banner, index) => (
    <div
      key={banner.id}
      className={`absolute inset-0 transition-opacity duration-700 ${
        index === current ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src={banner.image}
        alt={banner.alt}
        fill
        sizes="100vw"
        priority={index === 0}
        className="object-cover w-full h-full"
      />
    </div>
  ))}
</div>


      {/* ARROWS */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
      >
        <ChevronLeft />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
      >
        <ChevronRight />
      </button>

      {/* DOTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 w-2 rounded-full ${
              index === current
                ? "bg-white"
                : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
