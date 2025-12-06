"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SaveButtonProps {
  listingId: string;
  className?: string;
}

export default function SaveButton({ listingId, className = "" }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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
      // Redirect to login if not authenticated
      window.location.href = "/auth/login";
      return;
    }

    setLoading(true);

    try {
      if (isSaved) {
        // Remove from saved
        await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);
        setIsSaved(false);
      } else {
        // Add to saved
        await supabase
          .from("saved_listings")
          .insert([
            {
              user_id: user.id,
              listing_id: listingId,
            }
          ]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling saved listing:", error);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
        isSaved
          ? "bg-red-100 text-red-600 hover:bg-red-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      } disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`}
      />
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}
