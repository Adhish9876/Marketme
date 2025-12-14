"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export default function ImageGalleryModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
        >
          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto px-4 sm:px-6 md:px-8 flex flex-col items-center justify-center"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:text-red-600 transition-all group"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>

            {/* Image Container */}
            <div className="relative w-full h-full max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] flex items-center justify-center">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                src={images[currentIndex]}
                alt={`Gallery image ${currentIndex + 1}`}
                className="w-full h-full object-contain rounded-lg sm:rounded-xl md:rounded-2xl"
              />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 md:-translate-x-12 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:text-red-600 transition-all group"
                  >
                    <ChevronLeft className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 group-hover:-translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 md:translate-x-12 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 hover:text-red-600 transition-all group"
                  >
                    <ChevronRight className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Info Bar */}
            {images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-auto max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 flex items-center justify-center gap-3 sm:gap-4"
              >
                {/* Thumbnail Indicators */}
                <div className="flex gap-1 sm:gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full transition-all ${
                        i === currentIndex ? "bg-red-600 w-6 sm:w-8" : "bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="border-l border-white/20 pl-3 sm:pl-4 md:pl-5">
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold font-mono tracking-widest text-white/80">
                    {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Keyboard Hint (Desktop Only) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
            >
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                ← → arrows to navigate • ESC to close
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
