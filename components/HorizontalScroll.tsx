// components/HorizontalScroll.tsx
"use client";

import { useRef, useState } from "react";
import { ChevronRight, X, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

type HorizontalScrollProps = {
  title: string;
  items: any[];
  onItemClick?: (itemId: string) => void;
  onHideItem?: (itemId: string) => void;
  showHideOption?: boolean;
};

export default function HorizontalScroll({ 
  title, 
  items, 
  onItemClick, 
  onHideItem,
  showHideOption = false 
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;

    const x = e.touches[0].clientX;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      setIsDragging(true);
      setStartX(e.clientX);
      setScrollLeft(scrollRef.current.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;

    e.preventDefault();
    const x = e.clientX;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleHideItem = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    onHideItem?.(itemId);
    setActiveMenu(null);
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-8 sm:mb-12">
      <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-white mb-3 sm:mb-4 px-1">
        {title}
      </h3>

      <div className="relative">
        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex gap-2.5 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 scroll-smooth -mx-1 px-1"
          style={{
            scrollBehavior: "smooth",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="flex-shrink-0 w-36 sm:w-48 md:w-56 group/card cursor-pointer select-none relative"
              draggable={false}
            >
              {/* Card */}
              <div 
                onClick={() => {
                  if (!isDragging && activeMenu !== item.id) {
                    onItemClick?.(item.id);
                    router.push(`/listing/${item.id}`);
                  }
                }}
                className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/10 group-hover/card:border-red-600/50 transition-all duration-300 shadow-lg"
              >
                {item.cover_image ? (
                  <img
                    src={item.cover_image}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover/card:scale-110 group-hover/card:opacity-100"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-mono text-[10px] sm:text-xs text-white/20 uppercase">No Image</span>
                  </div>
                )}

                {/* Status Badge */}
                {item.status === "sold" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <span className="text-red-600 font-bold uppercase text-xs sm:text-sm">Sold</span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-wider rounded border border-white/10">
                    {item.category}
                  </span>
                </div>

                {/* Hide Button (Mobile: always visible, Desktop: on hover) */}
                {showHideOption && (
                  <button
                    onClick={(e) => handleHideItem(e, item.id)}
                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-6 h-6 sm:w-7 sm:h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center 
                      opacity-100 sm:opacity-0 group-hover/card:opacity-100 transition-opacity duration-200
                      hover:bg-red-600 active:scale-95"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </button>
                )}

                {/* Hover Action Arrow (Desktop only) */}
                <div className="absolute bottom-2 right-2 bg-white/10 backdrop-blur-md text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full hidden sm:flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* Info */}
              <div className="mt-1.5 sm:mt-2 px-0.5 sm:px-1">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate">{item.title}</h4>
                <p className="text-sm sm:text-md text-white/60 font-medium">₹{item.price?.toLocaleString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
