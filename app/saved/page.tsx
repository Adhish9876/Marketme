"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Heart, ArrowLeft } from "lucide-react";

interface SavedListing {
  id: string;
  title: string;
  price: number;
  location: string;
  cover_image?: string;
  created_at: string;
}

export default function SavedListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);

      // Get saved listings
      const { data: savedData } = await supabase
        .from("saved_listings")
        .select(`
          id,
          listing_id,
          listings (
            id,
            title,
            price,
            location,
            cover_image,
            created_at
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedData) {
        const formattedListings = savedData
          .map((item: any) => item.listings)
          .filter((listing): listing is SavedListing => listing !== null);
        setListings(formattedListings);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  const handleRemoveSaved = async (listingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    setListings(listings.filter(listing => listing.id !== listingId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading saved listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">Saved Listings</h1>
          <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {listings.length}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved listings yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Save listings to view them later
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
              >
                {/* Image */}
                <div
                  className="relative aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/listing/${listing.id}`)}
                >
                  {listing.cover_image ? (
                    <img
                      src={listing.cover_image}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-grow">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/listing/${listing.id}`)}
                  >
                    {listing.title}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    ₹{listing.price.toLocaleString()}
                  </p>
                  <div className="flex items-center text-sm text-gray-500 gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {listing.location}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="p-4 border-t border-border bg-muted">
                  <button
                    onClick={() => handleRemoveSaved(listing.id)}
                    className="w-full px-4 py-2 bg-red-100 text-red-600 font-medium rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    Remove from Saved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
