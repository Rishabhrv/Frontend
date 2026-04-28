'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Replace these with your actual image paths
  const images = [
    "/images/fourcategory/4.png",
    "/images/fourcategory/2.png", 
    "/images/fourcategory/3.png"
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // 7000ms = 7 seconds

    return () => clearInterval(slideInterval);
  }, [images.length]);

  return (
    <div className="relative w-full group p-5 pb-4 pt-10">
      
      {/* Slider Container */}
      <div className="relative overflow-hidden rounded-lg">
        {images.map((src, index) => (
          <Link 
            href="/" 
            key={index} 
            className={`w-full block transition-opacity duration-1500 ease-in-out ${
              index === 0 ? 'relative' : 'absolute top-0 left-0 h-full'
            } ${
              currentIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={src}
              alt={`AGPH Books Store Slide ${index + 1}`}
              width={90}
              height={68}
              className="block rounded-lg w-full h-full object-cover"
              unoptimized
            />
          </Link>
        ))}
      </div>
      
    </div>
  );
}