"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Search, SlidersHorizontal, User, LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setCategory(searchParams.get("category") || "");
    setLocation(searchParams.get("location") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .maybeSingle();
        setProfile(profileData);
      }
    };
    loadUser();

    // Reload profile data when window regains focus
    window.addEventListener('focus', loadUser);
    return () => window.removeEventListener('focus', loadUser);
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    setShowFilters(false);
    router.push(`/?${params.toString()}`);
  };

  // Hide navbar on listing detail pages
  const isListingDetail = pathname.match(/^\/listing\/[^/]+$/);
  if (isListingDetail) return null;

  return (
    <>
     <nav 
  className={`sticky top-0 left-0 right-0 z-50 bg-[#EBEAE5] border-b border-black/10
    transition-[padding,box-shadow] duration-300 ease-in-out
    ${scrolled ? "py-2 shadow-md" : "py-5 shadow-none"}
  `}
>

        <div className="max-w-7xl mx-0  px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
           
          {/* Brand */}
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#2D2D2A] shrink-0 border border-[#2D2D2A] px-3 py-1 rounded">
            MarketMe.
          </Link>

          {/* CENTER: SEARCH & FILTER */}
          <div className="flex-1 max-w-2xl mx-auto flex items-center gap-2 relative">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[#757570]" />
              </div>
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-[#D6D5D0] rounded-lg text-sm text-[#2D2D2A] placeholder-[#757570] focus:outline-none focus:bg-white focus:border-[#A1A19D] transition-all shadow-sm font-medium"
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-all duration-200 flex-shrink-0
                ${showFilters 
                  ? "bg-[#2D2D2A] text-[#EBEAE5] border-[#2D2D2A]" 
                  : "bg-white/60 text-[#555] border-[#D6D5D0] hover:bg-white hover:border-[#A1A19D]"
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* --- FILTER DROPDOWN --- */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className="absolute top-full right-0 mt-3 w-80 p-4 z-50 bg-neutral-primary-medium border border-default-medium rounded-base shadow-xs text-body"
                >
                  <div className="flex justify-between items-center mb-6 border-b border-[#D6D5D0] pb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#757570]">Filter Attributes</span>
                    <button onClick={() => setShowFilters(false)} className="text-[#757570] hover:text-[#2D2D2A]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#555] uppercase tracking-wide">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Electronics"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#DAD9D6] border border-transparent rounded text-sm text-[#2D2D2A] placeholder-[#888] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#555] uppercase tracking-wide">Location</label>
                      <input
                        type="text"
                        placeholder="City or Area"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-[#DAD9D6] border border-transparent rounded text-sm text-[#2D2D2A] placeholder-[#888] focus:bg-white focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#555] uppercase tracking-wide">Price Range</label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#DAD9D6] border border-transparent rounded text-sm text-[#2D2D2A] focus:bg-white focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#DAD9D6] border border-transparent rounded text-sm text-[#2D2D2A] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={applyFilters}
                      className="w-full mt-2 bg-[#2D2D2A] text-[#EBEAE5] py-3 rounded text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Apply Filters
                    </button>
                    
                    <button 
                      onClick={() => {
                        setCategory(""); setLocation(""); setMinPrice(""); setMaxPrice(""); setSearchTerm("");
                        router.push('/');
                      }}
                      className="w-full text-center text-[10px] text-[#757570] hover:text-[#2D2D2A] uppercase tracking-widest"
                    >
                      Reset All
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/listing/create"
              className="hidden sm:inline-flex items-center justify-center px-6 py-2 text-xs font-bold text-[#2D2D2A] border border-[#2D2D2A] rounded-full hover:bg-[#2D2D2A] hover:text-[#EBEAE5] transition-all uppercase tracking-wide"
            >
              Sell +
            </Link>

            {user ? (
              <div className="relative group">
                <Link href="/profile">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-9 h-9 rounded-full object-cover border border-[#D6D5D0]"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#DAD9D6] flex items-center justify-center text-[#555] font-bold text-xs">
                      {profile?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </Link>
                {/* User Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-primary-medium border border-default-medium rounded-base shadow-xs py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-body">
                  <div className="px-4 py-2 border-b border-[#D6D5D0] mb-1">
                    <p className="text-sm font-semibold text-[#2D2D2A] truncate">{profile?.username}</p>
                    <p className="text-xs text-[#757570] truncate">{user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-[#555] hover:bg-[#DAD9D6]">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={() => supabase.auth.signOut().then(() => { setUser(null); router.push('/'); })} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="text-sm font-bold text-[#2D2D2A] hover:text-[#555] uppercase tracking-wide">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
      {/* Spacer */}
      <div className="h-20" /> 
    </>
  );
}