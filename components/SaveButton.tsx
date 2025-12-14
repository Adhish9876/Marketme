"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface SaveButtonProps {
  listingId: string;
  className?: string;
}

export default function SaveButton({ listingId, className = "" }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) return;

      const { data } = await supabase
        .from("saved_listings")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      setIsSaved(!!data);
    }

    checkSaved();
  }, [listingId]);

  const handleToggleSave = async () => {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    setLoading(true);

    try {
      if (isSaved) {
        await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        setIsSaved(false);
      } else {
        await supabase
          .from("saved_listings")
          .insert([{ user_id: user.id, listing_id: listingId }]);

        setIsSaved(true);
      }

      // Trigger pulse animation
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 600);

    } catch (error) {
      console.error("Error toggling saved listing:", error);
    }

    setLoading(false);
  };

  return (
    <div className="relative inline-block">
      {/* Pulse ripple effect */}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 w-12 h-12 rounded-full bg-red-600 pointer-events-none"
            style={{ left: 0, top: 0 }}
          />
        )}
      </AnimatePresence>

      <button
        onClick={handleToggleSave}
        disabled={loading}
        className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          isSaved
            ? "bg-red-600 hover:bg-red-700"
            : "bg-white/10 hover:bg-white/20 border border-white/20"
        } disabled:opacity-50 ${className}`}
      >
        <motion.div
          animate={showPulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Heart
            className={`w-5 h-5 ${isSaved ? "fill-current text-white" : "text-white"}`}
          />
        </motion.div>
      </button>
    </div>
  );
}
