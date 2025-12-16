// components/OfferModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

type OfferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  listingPrice: number;
  listingTitle: string;
  onSubmit: (offeredPrice: number, message: string) => Promise<void>;
  loading?: boolean;
};

export default function OfferModal({
  isOpen,
  onClose,
  listingPrice,
  listingTitle,
  onSubmit,
  loading = false,
}: OfferModalProps) {
  const [offeredPrice, setOfferedPrice] = useState(Math.floor(listingPrice * 0.8));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const discount = ((listingPrice - offeredPrice) / listingPrice * 100).toFixed(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (offeredPrice <= 0 || offeredPrice >= listingPrice) {
      alert("Offer price must be less than listing price");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(offeredPrice, message);
      setOfferedPrice(Math.floor(listingPrice * 0.8));
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error submitting offer:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-auto z-50"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <h2 className="text-xl font-bold uppercase text-white">Make an Offer</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Listing Info */}
              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Item</p>
                <h3 className="text-sm font-bold text-white truncate mb-2">{listingTitle}</h3>
                <p className="text-[10px] uppercase font-bold text-white/50 mb-1">Asking Price</p>
                <p className="text-xl font-bold text-red-600">₹{listingPrice.toLocaleString()}</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Offered Price */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">
                    Your Offer
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                    <input
                      type="number"
                      value={offeredPrice}
                      onChange={(e) => setOfferedPrice(Number(e.target.value))}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg pl-8 pr-4 py-3 text-lg font-bold text-white outline-none focus:border-red-600 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  {offeredPrice > 0 && offeredPrice < listingPrice && (
                    <p className="text-[10px] text-green-400 mt-1">
                      {discount}% discount ({`₹${(listingPrice - offeredPrice).toLocaleString()}`} off)
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the seller why you're interested..."
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-red-600 transition-colors resize-none h-24"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Sending..." : "Send Offer"}
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-[9px] text-white/40 text-center mt-3">
                  The seller will review your offer and can accept, reject, or counter it.
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
