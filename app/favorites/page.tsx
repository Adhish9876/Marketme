"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFavorites() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    if (!data) {
      setLoading(false);
      return;
    }

    const listingIds = data.map(fav => fav.listing_id);

    const { data: listings } = await supabase
      .from("listings")
      .select("*")
      .in("id", listingIds);

    setFavorites(listings || []);
    setLoading(false);
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  if (loading) return <p className="pt-20 text-center">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-20">
      <h1 className="text-2xl mb-6 font-semibold">My Favorites</h1>

      {favorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map(listing => (
            <div
              key={listing.id}
              className="border p-2 rounded cursor-pointer"
              onClick={() => router.push(`/listing/${listing.id}`)}
            >
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt="item"
                  className="w-full h-40 object-cover rounded"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded" />
              )}

              <h2 className="font-semibold mt-2">{listing.title}</h2>
              <p className="text-sm text-gray-600">₹{listing.price}</p>
              <p className="text-sm text-gray-500">{listing.location}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
