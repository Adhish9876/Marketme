"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfileData() {
    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/auth/login");
      return;
    }

    setUser(authUser);

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      console.log("Profile error:", profileError);
    }

    setProfile(profileData);

    // Get user's listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    setListings(listingsData || []);
    setLoading(false);
  }

  async function deleteListing(listingId: string, listingTitle: string) {
    if (!confirm(`Are you sure you want to delete "${listingTitle}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      alert("Error deleting listing");
      return;
    }

    // Remove from local state
    setListings(prev => prev.filter(listing => listing.id !== listingId));
  }

  useEffect(() => {
    loadProfileData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-semibold text-gray-900">My Profile</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Account Information</h2>
            <button
              onClick={() => router.push("/profile/edit")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          {/* Avatar and Username Section */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="relative">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {profile?.username || "No username set"}
              </h3>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <p className="text-lg text-gray-900">{profile?.username || "Not set"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-lg text-gray-900">{profile?.name || "Not set"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <p className="text-lg text-gray-900">{profile?.phone || "Not set"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <p className="text-lg text-gray-900">{profile?.city || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* My Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              My Listings ({listings.length})
            </h2>
            <button
              onClick={() => router.push("/listing/create")}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Listing
            </button>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No listings yet</h3>
              <p className="mt-2 text-sm text-gray-500">Start selling by creating your first listing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col"
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
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {listing.status === "sold" && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold text-lg">
                          SOLD
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="p-4 flex-grow cursor-pointer"
                    onClick={() => router.push(`/listing/${listing.id}`)}
                  >
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      ₹{listing.price.toLocaleString()}
                    </p>
                    {listing.location && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.location}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/listing/edit/${listing.id}`);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteListing(listing.id, listing.title);
                      }}
                      className="px-3 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                      title="Delete listing"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}