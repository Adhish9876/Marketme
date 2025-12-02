"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);

    if (data.user) {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("is_admin, username, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (error) {
        console.log("Profile fetch error:", error);
      } else if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.is_admin || false);
      }
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <nav className="w-full border-b p-2 flex justify-between items-center bg-white">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold text-lg">
          Marketme
        </Link>

        <Link href="/" className="text-sm">
          Home
        </Link> 

        <Link href="/chat" className="text-sm">
          Chat
        </Link>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Link href="/listing/create" className="text-sm">
          Create Listing
        </Link>

        {isAdmin && (
          <Link href="/admin/dashboard" className="text-sm text-red-600">
            Admin
          </Link>
        )}

        {user ? (
          <>
            <div className="relative group">
              <Link href="/profile" className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || "Profile"}
                    className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-blue-300 transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold hover:ring-2 hover:ring-blue-300 transition-all">
                    {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </Link>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {profile?.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  View Profile
                </Link>
                
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Remove the separate logout button since it's now in dropdown */}
          </>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm border px-3 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
