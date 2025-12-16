// hooks/useOffers.ts
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  offered_price: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  created_at: string;
  expires_at: string;
  buyer_name?: string;
};

export function useOffers(listingId: string) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch offers for a listing
  const fetchOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("offers")
        .select(`
          *,
          buyer:buyer_id(full_name)
        `)
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });

      if (err) throw err;

      const mappedOffers = (data || []).map((offer: any) => ({
        ...offer,
        buyer_name: offer.buyer?.full_name || "Anonymous Buyer",
      }));

      setOffers(mappedOffers);
    } catch (err) {
      console.error("Error fetching offers:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch offers");
    } finally {
      setLoading(false);
    }
  };

  // Create a new offer
  const createOffer = async (buyerId: string, sellerId: string, offeredPrice: number, message?: string) => {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const { data, error: err } = await supabase
        .from("offers")
        .insert([
          {
            listing_id: listingId,
            buyer_id: buyerId,
            seller_id: sellerId,
            offered_price: offeredPrice,
            message: message || null,
            status: "pending",
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          },
        ])
        .select();

      if (err) throw err;

      await fetchOffers(); // Refresh offers list
      return data?.[0];
    } catch (err) {
      console.error("Error creating offer:", err);
      throw err;
    }
  };

  // Accept an offer
  const acceptOffer = async (offerId: string) => {
    try {
      const { error: err } = await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offerId);

      if (err) throw err;

      // Also mark other offers as rejected
      const offerToAccept = offers.find((o) => o.id === offerId);
      if (offerToAccept) {
        await supabase
          .from("offers")
          .update({ status: "rejected" })
          .eq("listing_id", offerToAccept.listing_id)
          .neq("id", offerId)
          .eq("status", "pending");
      }

      await fetchOffers();
    } catch (err) {
      console.error("Error accepting offer:", err);
      throw err;
    }
  };

  // Reject an offer
  const rejectOffer = async (offerId: string) => {
    try {
      const { error: err } = await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offerId);

      if (err) throw err;

      await fetchOffers();
    } catch (err) {
      console.error("Error rejecting offer:", err);
      throw err;
    }
  };

  // Counter offer
  const counterOffer = async (offerId: string, counterPrice: number, message?: string) => {
    try {
      const { error: err } = await supabase
        .from("offers")
        .update({
          status: "countered",
          offered_price: counterPrice,
          message: message || null,
        })
        .eq("id", offerId);

      if (err) throw err;

      await fetchOffers();
    } catch (err) {
      console.error("Error countering offer:", err);
      throw err;
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchOffers();
    }
  }, [listingId]);

  return {
    offers,
    loading,
    error,
    createOffer,
    acceptOffer,
    rejectOffer,
    counterOffer,
    refetch: fetchOffers,
  };
}
