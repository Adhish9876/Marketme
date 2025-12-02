"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SellerProfilePage() {
  const router = useRouter();
  const params = useParams();

  const [seller, setSeller] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSellerData() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single();

    setSeller(profile);

    const { data: sellerListings } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", params.id);

    setListings(sellerListings || []);
    setLoading(false);
  }

  useEffect(() => {
    loadSellerData();
  }, []);

  if (loading) return <p className="pt-20 text-center">Loading...</p>;

  if (!seller) return <p className="pt-20 text-center">Seller not found</p>;

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-20 px-4">
      {/* Seller Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          {seller.avatar_url ? (
            <img
              src={seller.avatar_url}
              alt={seller.username || seller.name}
              className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-100"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl ring-4 ring-blue-100">
              {seller.username?.charAt(0)?.toUpperCase() || seller.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}

          {/* Seller Info */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {seller.username || seller.name || "Unnamed Seller"}
            </h1>
            {seller.name && seller.username && (
              <p className="text-gray-500">{seller.name}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{seller.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{seller.city || "Not provided"}</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {listings.length} listing{listings.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Contact Button */}
          <button
            onClick={() => router.push(`/chat/${seller.id}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contact Seller
          </button>
        </div>
      </div>

      {/* Listings Section */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Listings by this seller</h2>

      {listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">This seller has no listings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div
              key={listing.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/listing/${listing.id}`)}
            >
              {listing.cover_image ? (
                <img
                  src={listing.cover_image}
                  alt={listing.title}
                  className="w-full h-40 object-cover"
                />
              ) : listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <div className="p-3">
                <h2 className="font-semibold text-gray-900 truncate">{listing.title}</h2>
                <p className="text-lg font-bold text-blue-600">₹{listing.price?.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
