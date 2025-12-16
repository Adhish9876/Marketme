// components/SimpleSlider.tsx
"use client";

import { useRef } from "react";
import Slider from "react-slick";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

type SimpleSliderProps = {
  items: React.ReactNode[];
};

export default function SimpleSlider({ items }: SimpleSliderProps) {
  const sliderRef = useRef<Slider>(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden group relative">
      <Slider ref={sliderRef} {...settings}>
        {items.map((item, i) => (
          <div key={i} className="!flex items-center justify-center">
            {item}
          </div>
        ))}
      </Slider>

      {/* Left Arrow */}
      <button
        onClick={() => sliderRef.current?.slickPrev()}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Right Arrow */}
      <button
        onClick={() => sliderRef.current?.slickNext()}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
