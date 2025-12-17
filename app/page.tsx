"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Stack from "@/components/fancy/stack";
import Slider from "react-slick";
import { Slider as MUISlider, Box } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowUpRight, X, Sparkles, CornerRightDown, 
  Plus, User, LogOut, ArrowRight, Heart, Menu, SlidersHorizontal, MessageCircle
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import SimpleSlider from "@/components/SimpleSlider";
import HorizontalScroll from "@/components/HorizontalScroll";
import { openChatWithSeller } from "@/components/ChatWidget";

// Helper hook for debouncing (prevents API spam while typing)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- States ---
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());
  const [isSearchBarVisible, setIsSearchBarVisible] = useState(true);
  
  // --- ANIMATION STATES ---
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const scrollY = useRef(0);
  
  // UI States
  const [showMobileMenu, setShowMobileMenu] = useState(false); // Mobile Hamburger
  const [showFilters, setShowFilters] = useState(false); // Desktop Filter Popover (hover-based)
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [filterHoverTimeout, setFilterHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Filter & Sort States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [maxPriceInDB, setMaxPriceInDB] = useState(100000);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest");

  // Recently Viewed & Category Sections
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [categoryListings, setCategoryListings] = useState<{ [key: string]: any[] }>({});

  // Category and Condition options
  const CATEGORIES = ["electronics", "lifestyle", "collectables", "car", "bike"];
  const CONDITIONS = ["brand_new", "opened_not_used", "used"];

  // Live Search Debounce
  const debouncedSearch = useDebounce(search, 400);
  const debouncedMin = useDebounce(minPrice, 400);
  const debouncedMax = useDebounce(maxPrice, 400);
  const debouncedCategory = useDebounce(category, 400);
  const debouncedCondition = useDebounce(condition, 400);
  const debouncedSort = useDebounce(sortBy, 400);

  // --- 1. SESSION CHECK ---
  useEffect(() => {
    const hasVisited = localStorage.getItem("marketMeVisited");
    if (hasVisited) {
      setIntroComplete(true);
      setIsFirstVisit(false);
    } else {
      setIntroComplete(false);
      setIsFirstVisit(true);
      localStorage.setItem("marketMeVisited", "true");
    }
    setIsCheckComplete(true);
  }, []);

  // --- 2. ANIMATION SEQUENCER ---
  useEffect(() => {
    if (!isFirstVisit) return;
    if (!loading) {
      const timer = setTimeout(() => {
        setIntroComplete(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, isFirstVisit]);

  // --- 3. DATA FETCHING (Live Search Implementation) ---
  useEffect(() => {
    async function fetchData() {
      // Don't fetch until we know who the user is (prevents double renders)
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user && !profile) {
        const { data: p } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle();
        setProfile(p);
        const { data: savedData } = await supabase.from("saved_listings").select("listing_id").eq("user_id", user.id);
        setSavedListingIds(new Set(savedData?.map((item: any) => item.listing_id) || []));
      }

      // Get max price from DB
      const { data: maxPriceData } = await supabase
        .from("listings")
        .select("price")
        .order("price", { ascending: false })
        .limit(1);
      
      if (maxPriceData && maxPriceData.length > 0) {
        const dbMax = Math.ceil(maxPriceData[0].price / 1000) * 1000;
        setMaxPriceInDB(dbMax);
        setMaxPrice(dbMax);
      }

      let query = supabase
        .from("listings")
        .select("*");

      // Apply Filters directly to query
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      if (debouncedCategory) query = query.eq("category", debouncedCategory);
      if (debouncedCondition) query = query.eq("condition", debouncedCondition);
      if (debouncedMin > 0) query = query.gte("price", debouncedMin);
      if (debouncedMax < maxPriceInDB) query = query.lte("price", debouncedMax);

      // Apply Sorting
      switch (debouncedSort) {
        case "price-low":
          query = query.order("price", { ascending: true });
          break;
        case "price-high":
          query = query.order("price", { ascending: false });
          break;
        case "popular":
          query = query.order("views_count", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (!error) {
        setListings(data || []);
        
        // Organize listings by category for category sections
        const byCategory: { [key: string]: any[] } = {};
        CATEGORIES.forEach(cat => {
          byCategory[cat] = (data || []).filter((item: any) => item.category === cat).slice(0, 10);
        });
        setCategoryListings(byCategory);
      }

      // Fetch recently viewed if user is logged in
      if (user) {
        const { data: recentData } = await supabase
          .from("user_recently_viewed")
          .select("listing_id, listings(*)")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(8);
        
        setRecentlyViewed(recentData?.map((item: any) => item.listings) || []);
      }

      setLoading(false);
    }
    
    fetchData();
  }, [debouncedSearch, debouncedCategory, debouncedCondition, debouncedMin, debouncedMax, debouncedSort, isCheckComplete, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const clearFilters = () => {
    setSearch(""); 
    setCategory(""); 
    setCondition("");
    setMinPrice(0); 
    setMaxPrice(maxPriceInDB);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (loading) {
      document.body.classList.add("chat-hidden");
    } else {
      document.body.classList.remove("chat-hidden");
    }
    return () => {
      document.body.classList.remove("chat-hidden");
    };
  }, [loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < 60) {
        setIsSearchBarVisible(true);
      } else if (currentY > scrollY.current) {
        setIsSearchBarVisible(false);
      } else {
        setIsSearchBarVisible(true);
      }
      scrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isCheckComplete) return <div className="min-h-screen bg-[#121212]" />;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]"
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* --- HEADER & LOGO --- 
          Logic: If intro is NOT complete, it is Fixed (centered). 
          Once intro is complete, it becomes ABSOLUTE (scrolls with page).
      */}
      <motion.div 
        className={`z-50 pointer-events-none flex flex-col w-full ${introComplete ? "absolute top-0 left-0 my-0 p-3 sm:p-4 md:p-8" : "fixed inset-0 justify-center items-center"}`}
        initial={isFirstVisit ? "intro" : "header"}
        animate={introComplete ? "header" : "intro"}
        variants={{
          intro: { }, // Handled by classNames
          header: { } // Handled by classNames
        }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
          <div className={`flex flex-col ${introComplete ? "items-end w-full" : "items-center"}`}>
            <motion.h1 className={`font-black uppercase leading-[0.8] tracking-tighter transition-all duration-1000 ${introComplete ? "text-4xl sm:text-5xl md:text-7xl" : "text-5xl sm:text-7xl md:text-[10rem]"}`}>
               Market
            </motion.h1>
            
            <div className={`flex items-center gap-2 sm:gap-4 ${introComplete ? "justify-end" : "justify-center"}`}>
               {/* Sell Button - Moves into header */}
               <motion.div 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: introComplete ? 1 : 0, scale: introComplete ? 1 : 0 }} 
                  transition={{ delay: isFirstVisit ? 1.8 : 0, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto"
               >
                  <Link href="/listing/create" className="h-7 px-2.5 sm:h-8 sm:px-3 md:h-10 md:px-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg gap-1.5 sm:gap-2">
                     <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" /> Sell
                  </Link>
               </motion.div>

               <motion.h1 className={`font-black uppercase leading-[0.8] tracking-tighter text-red-600 transition-all duration-1000 ${introComplete ? "text-4xl sm:text-5xl md:text-7xl" : "text-5xl sm:text-7xl md:text-[10rem]"}`}>
                  Me.
               </motion.h1>
            </div>
            
            {/* Tagline */}
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: introComplete ? 1 : 0 }} 
              transition={{ delay: 2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }} 
              className={`text-white/40 mx-4 sm:mx-6 font-medium lowercase tracking-wide text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 ${introComplete ? "text-right" : "text-center"}`}
            >
               its mine!  
            </motion.p>
          </div>
      </motion.div>

      {/* Desktop My Space button (top-left) */}
      {introComplete && (
        <motion.div
          className="hidden md:block fixed top-0 left-0 z-40 pointer-events-auto"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: isFirstVisit ? 1.4 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={user ? "/profile" : "/auth/login"}
            className="h-10 px-5 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black rounded-br-xl flex items-center justify-center text-sm font-black uppercase tracking-[0.25em] transition-all shadow-lg"
          >
            My Space
          </Link>
        </motion.div>
      )}

      {/* --- MOBILE HAMBURGER MENU (Top Left) --- */}
      {user && !loading && introComplete && (
        <motion.div 
          className="md:hidden absolute top-0 left-0 z-40 pointer-events-auto"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: isFirstVisit ? 1.4 : 0, ease: [0.22, 1, 0.36, 1] }}
        >
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="bg-white/90 backdrop-blur-md rounded-br-xl px-4 py-4 flex items-center gap-3 hover:bg-red-600 transition-all shadow-lg group cursor-pointer"
          >
            <Menu className="w-5 h-5 text-black group-hover:text-white transition-colors" />
          </button>
        </motion.div>
      )}

      {/* --- MAIN CONTENT --- */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: isFirstVisit ? 1.2 : 0, duration: 1.0 }}
        className="relative z-10 pt-32 sm:pt-40 md:pt-48 pb-24 sm:pb-32 px-3 sm:px-4 md:px-8 max-w-[1800px] mx-auto"
      >

        {/* Divider */}
        {!loading && (
          <div className="flex items-end gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-12 opacity-80">
             <div className="flex flex-col gap-0.5 sm:gap-1">
                <span className="text-[8px] sm:text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Season 01</span>
                <h2 className="text-lg sm:text-2xl md:text-4xl font-thin uppercase tracking-wider sm:tracking-widest text-white">Latest Drops</h2>
             </div>
             <div className="h-px bg-white/20 flex-1 mb-2 sm:mb-3" />
             <CornerRightDown className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 mb-2 sm:mb-3" />
          </div>
        )}

        {/* Loader */}
        {loading && introComplete && (
          <div className="h-[50vh] flex items-center justify-center">
            <Stack />
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && !introComplete && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="flex flex-col gap-1 sm:gap-2">
                {/* Image Skeleton */}
                <div className="relative h-36 sm:h-48 md:h-56 lg:h-64 w-full rounded-lg sm:rounded-xl bg-[#1a1a1a] border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] animate-pulse" />
                </div>
                {/* Title Skeleton */}
                <div className="px-0.5 sm:px-1 space-y-1 sm:space-y-2">
                  <div className="h-3 sm:h-4 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-2.5 sm:h-3 bg-[#2a2a2a] rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ad Banner Slider */}
        {!loading && (
          <div className="mb-12 sm:mb-16">
            <SimpleSlider
              items={[
                <img key="banner1" src="/assets/banner1.png" alt="Banner 1" className="w-full h-65 sm:h-96 object-cover rounded-xl" />,
                <img key="banner2" src="/assets/banner2.png" alt="Banner 2" className="w-full h-65 sm:h-96 object-cover rounded-xl" />
              ]}
            />
          </div>
        )}

        {/* Recently Viewed Section */}
        {!loading && user && recentlyViewed.length > 0 && (
          <HorizontalScroll
            title="Recently Viewed"
            items={recentlyViewed}
            showHideOption={true}
            onHideItem={async (id: string) => {
              // Remove from local state immediately for instant feedback
              setRecentlyViewed(prev => prev.filter(item => item.id !== id));
              // Remove from database
              if (user) {
                await supabase
                  .from("user_recently_viewed")
                  .delete()
                  .eq("user_id", user.id)
                  .eq("listing_id", id);
              }
            }}
            onItemClick={(id: any) => {
              // Track this view again
              if (user) {
                supabase.from("user_recently_viewed").upsert({
                  user_id: user.id,
                  listing_id: id,
                  viewed_at: new Date().toISOString(),
                });
              }
            }}
          />
        )}

        {/* Category Wise Sections */}
        {!loading && (
          <>
            {CATEGORIES.map((cat) => 
              categoryListings[cat]?.length >=4 && (
                <HorizontalScroll
                  key={cat}
                  title={cat.toUpperCase()}
                  items={categoryListings[cat]}
                  onItemClick={(id:any) => {
                    if (user) {
                      supabase.from("user_recently_viewed").upsert({
                        user_id: user.id,
                        listing_id: id,
                        viewed_at: new Date().toISOString(),
                      });
                    }
                  }}
                />
              )
            )}
          </>
        )}

        {!loading && listings.length === 0 ? (
          <div className="h-[30vh] sm:h-[40vh] flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-2xl sm:rounded-3xl">
             <h2 className="text-base sm:text-xl font-bold text-white/20 uppercase tracking-widest">No Matches</h2>
             <button onClick={clearFilters} className="mt-3 sm:mt-4 text-[10px] sm:text-xs uppercase tracking-widest text-red-500 hover:text-white transition-colors">Reset</button>
          </div>
        ) : !loading && (
          <div>
            <div className="flex items-end gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-12 opacity-80">
               <div className="flex flex-col gap-0.5 sm:gap-1">
                  <span className="text-[8px] sm:text-[10px] font-bold text-red-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Browse</span>
                  <h2 className="text-lg sm:text-2xl md:text-4xl font-thin uppercase tracking-wider sm:tracking-widest text-white">All Listings</h2>
               </div>
               <div className="h-px bg-white/20 flex-1 mb-2 sm:mb-3" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="group cursor-pointer flex flex-col gap-1 sm:gap-2"
              >
                <div className="relative h-36 sm:h-48 md:h-56 lg:h-64 w-full overflow-hidden rounded-lg sm:rounded-xl bg-[#1a1a1a] border border-white/10 group-hover:border-red-600/50 transition-all duration-500 shadow-xl">
                   {listing.cover_image ? (
                     <img src={listing.cover_image} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><span className="font-mono text-[8px] text-white/20 uppercase">No Visual</span></div>
                   )}
                   
                   {/* Sold Display */}
                   {listing.status === "sold" && (
                     <div className="absolute inset-0 flex items-center justify-center">
                       {/* Blurred Background */}
                       <div className="absolute inset-0 bg-black/40" style={{backdropFilter: 'blur(4px)'}} />
                       {/* Full Diagonal Line */}
                       <svg className="absolute inset-0 w-full h-full text-red-600" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                         <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                         <text x="50" y="50" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor" letterSpacing="1" style={{dominantBaseline: 'middle'}}>SOLD</text>
                       </svg>
                     </div>
                   )}
                   
                   {/* Badges */}
                   <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col gap-1 items-start">
                     <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur-md text-white text-[7px] sm:text-[8px] md:text-[10px] font-bold uppercase tracking-wider rounded-md border border-white/10">{listing.category}</span>
                   </div>

                   {/* Heart */}
                   {savedListingIds.has(listing.id) && (
                     <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                       <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-red-600 text-red-600 drop-shadow-md" />
                     </div>
                   )}
                   
                   {/* Hover Action - Desktop only */}
                   <div className="absolute bottom-2 right-2 bg-white/10 backdrop-blur-md text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                   </div>
                </div>
                
                <div className="px-0.5 sm:px-1 space-y-0 sm:space-y-0.5 md:space-y-1">
                   <h3 className="text-xs sm:text-sm md:text-lg font-bold text-white leading-tight truncate">{listing.title}</h3>
                   <p className="text-sm sm:text-base font-medium text-white/60">₹{listing.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
            </div>
          </div>
        )}
      </motion.main>

      {/* --- DESKTOP NAV (Hidden on Mobile) --- */}
      {!loading && (
        <motion.div 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className={`hidden md:flex fixed bottom-8 inset-x-0 mx-auto z-40 bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-full py-3 px-6 items-center gap-4 justify-center shadow-2xl h-16 w-fit max-w-2xl transition-all duration-300 ease-out transform ${
            isSearchBarVisible ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-16 opacity-0 pointer-events-none"
          }`}
        >
           <div className="flex items-center  border-r border-white/10 pr-4 w-64">
              <Search className="w-4 h-4 text-white/50" />
              <input 
                 className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 w-full h-full"
                 placeholder="Search..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>

           <button 
             onMouseEnter={() => {
               if (filterHoverTimeout) clearTimeout(filterHoverTimeout);
               setShowFilters(true);
             }}
             onMouseLeave={() => {
               const timeout = setTimeout(() => setShowFilters(false), 200);
               setFilterHoverTimeout(timeout);
             }}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${showFilters ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"}`}
           >
              <SlidersHorizontal className="w-3 h-3" /> Filters
           </button>

           <div className="pl-2 border-l border-white/10">
              {user ? (
                 <div className="relative">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-white transition-all">
                       <img src={profile?.avatar_url || "https://via.placeholder.com/32"} className="w-full h-full object-cover" />
                    </button>
                    {/* Desktop User Menu Popup */}
                    {showUserMenu && (
                        <div className="absolute bottom-12 right-0 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl p-2 shadow-xl mb-2">
                           <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-white/5 rounded-lg"><LogOut className="w-3 h-3"/> Logout</button>
                        </div>
                    )}
                 </div>
              ) : (
                 <Link href="/auth/login" className="text-xs font-bold uppercase hover:text-red-500">Login</Link>
              )}
           </div>
        </motion.div>
      )}

      {/* Mobile search bar at bottom */}
      <div className={`md:hidden fixed bottom-20 left-3 right-3 z-40 transition-all duration-300 ease-out ${
        isSearchBarVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}>
        <div className="bg-[#1a1a1a]/95 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl backdrop-blur-xl">
          <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-base text-white placeholder-white/40 w-full"
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-1">
              <X className="w-4 h-4 text-white/50" />
            </button>
          )}
        </div>
      </div>



      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
             initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{type: "spring", damping: 25, stiffness: 200}}
             className="fixed inset-0 z-[60] bg-[#121212] p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto"
          >
             <div className="flex justify-between items-center mb-2 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform"><X className="w-5 h-5"/></button>
             </div>

             {/* My Space Button */}
             <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
               <button className="w-full bg-white text-black py-4 rounded-xl text-center font-bold text-sm uppercase active:scale-[0.98] transition-transform">
                 My Space
               </button>
             </Link>

             {/* Filters Button */}
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className="w-full bg-white/10 text-white py-4 rounded-xl text-center font-bold text-sm uppercase active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
             >
               <SlidersHorizontal className="w-4 h-4" /> Filters {showFilters ? '▲' : '▼'}
             </button>

             {/* Chat Button */}
             <button 
               onClick={() => {
                 setShowMobileMenu(false);
                 // Trigger chat widget to open
                 const chatToggle = document.querySelector('.chat-toggle') as HTMLButtonElement;
                 if (chatToggle) {
                   chatToggle.click();
                 }
               }}
               className="w-full bg-white/10 text-white py-4 rounded-xl text-center font-bold text-sm uppercase active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
             >
               <MessageCircle className="w-4 h-4" /> Chat
             </button>

             {/* Mobile Search & Filters */}
             {showFilters && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 sm:space-y-4 max-h-[55vh] overflow-y-auto pb-4">
                {/* Search */}
                <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                   <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
                   <input 
                     type="text" 
                     placeholder="Search listings..." 
                     className="bg-transparent w-full text-sm font-medium outline-none placeholder:text-white/20"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>

                {/* Sort Dropdown */}
                <div>
                   <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Sort By</label>
                   <select 
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as "newest" | "price-low" | "price-high" | "popular")}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none"
                   >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="popular">Most Viewed</option>
                   </select>
                </div>

                {/* Category Dropdown */}
                <div>
                   <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Category</label>
                   <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none"
                   >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-[#121212]">{cat.toUpperCase()}</option>
                      ))}
                   </select>
                </div>

                {/* Condition Dropdown */}
                <div>
                   <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Condition</label>
                   <select 
                      value={condition}
                      onChange={e => setCondition(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none"
                   >
                      <option value="">All Conditions</option>
                      <option value="brand_new" className="bg-[#121212]">Brand New</option>
                      <option value="opened_not_used" className="bg-[#121212]">Opened (Not Used)</option>
                      <option value="used" className="bg-[#121212]">Used</option>
                   </select>
                </div>

                {/* Price Range Slider */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] uppercase font-bold text-white/50">Price Range</label>
                      <span className="text-xs font-bold text-red-500">₹{minPrice.toLocaleString()} — ₹{maxPrice.toLocaleString()}</span>
                   </div>
                   
                   <div className="py-3">
                      <Box sx={{ width: '100%' }}>
                         <MUISlider
                            getAriaLabel={() => 'Price range'}
                            value={[minPrice, maxPrice]}
                            onChange={(e: Event, newValue: number | number[]) => {
                               if (Array.isArray(newValue)) {
                                  setMinPrice(newValue[0]);
                                  setMaxPrice(newValue[1]);
                               }
                            }}
                            min={0}
                            max={maxPriceInDB}
                            valueLabelDisplay="off"
                            getAriaValueText={(value) => `₹${value.toLocaleString()}`}
                            sx={{
                               color: '#ef4444',
                               '& .MuiSlider-track': {
                                  backgroundColor: '#ef4444',
                                  height: 6,
                                  border: 'none',
                               },
                               '& .MuiSlider-rail': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  height: 6,
                               },
                               '& .MuiSlider-thumb': {
                                  backgroundColor: '#ef4444',
                                  width: 24,
                                  height: 24,
                                  border: '2.5px solid #fca5a5',
                                  boxShadow: '0 3px 8px rgba(239, 68, 68, 0.35)',
                                  '&:hover': {
                                     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.45)',
                                  },
                                  '&.Mui-active': {
                                     boxShadow: '0 4px 12px rgba(239, 68, 68, 0.45)',
                                  },
                               },
                            }}
                         />
                      </Box>
                   </div>
                </div>

                {/* Clear Filters */}
                <button onClick={clearFilters} className="w-full text-center text-xs uppercase font-bold text-red-500 active:text-red-400 py-2">
                   Clear All Filters
                </button>
               </motion.div>
             )}

             <div className="mt-auto pt-4 space-y-3">
               {/* Create Listing Button */}
               <Link href="/listing/create" onClick={() => setShowMobileMenu(false)}>
                 <button className="w-full bg-red-600 text-white py-4 rounded-xl text-center font-bold text-sm uppercase active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                   <Plus className="w-4 h-4" /> Create Listing
                 </button>
               </Link>
               
               {user && (
                 <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full bg-white/10 text-white/70 py-4 rounded-xl text-center font-bold text-sm uppercase active:scale-[0.98] transition-transform">
                   Log Out
                 </button>
               )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP FILTER POPOVER --- */}
      <AnimatePresence>
         {showFilters && !showMobileMenu && (
            <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
               className="hidden md:block fixed bottom-24 left-1/2 -translate-x-1/2 w-[420px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl z-50"
               onMouseEnter={() => {
                 if (filterHoverTimeout) clearTimeout(filterHoverTimeout);
               }}
               onMouseLeave={() => {
                 const timeout = setTimeout(() => setShowFilters(false), 200);
                 setFilterHoverTimeout(timeout);
               }}
            >
               <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">Refine Search</span>
                  <button onClick={clearFilters} className="text-[10px] text-red-500 hover:text-red-400 uppercase font-bold transition-colors">Reset</button>
               </div>
               
               <div className="space-y-5">
                  {/* Sort */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Sort By</label>
                    <select 
                       value={sortBy}
                       onChange={e => setSortBy(e.target.value as "newest" | "price-low" | "price-high" | "popular")}
                       className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none hover:border-white/20 transition-colors"
                    >
                       <option value="newest">Newest First</option>
                       <option value="price-low">Price: Low to High</option>
                       <option value="price-high">Price: High to Low</option>
                       <option value="popular">Most Viewed</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Category</label>
                    <select 
                       value={category}
                       onChange={e => setCategory(e.target.value)}
                       className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none hover:border-white/20 transition-colors"
                    >
                       <option value="">All Categories</option>
                       {CATEGORIES.map(cat => (
                         <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                       ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Condition</label>
                    <select 
                       value={condition}
                       onChange={e => setCondition(e.target.value)}
                       className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-red-600 outline-none cursor-pointer appearance-none hover:border-white/20 transition-colors"
                    >
                       <option value="">All Conditions</option>
                       <option value="brand_new">Brand New</option>
                       <option value="opened_not_used">Opened (Not Used)</option>
                       <option value="used">Used</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="bg-[#121212] border border-white/10 rounded-lg p-5 space-y-4">
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] uppercase font-bold text-white/50">Price Range</label>
                        <div className="text-xs font-semibold text-white/80">
                           ₹{minPrice.toLocaleString()} — ₹{maxPrice.toLocaleString()}
                        </div>
                     </div>
                     
                     <div className="py-6 px-2">
                        <Box sx={{ width: '100%', padding: '0 8px' }}>
                           <MUISlider
                              getAriaLabel={() => 'Price range'}
                              value={[minPrice, maxPrice]}
                              onChange={(e: Event, newValue: number | number[]) => {
                                 if (Array.isArray(newValue)) {
                                    setMinPrice(newValue[0]);
                                    setMaxPrice(newValue[1]);
                                 }
                              }}
                              min={0}
                              max={maxPriceInDB}
                              valueLabelDisplay="auto"
                              getAriaValueText={(value) => `₹${value.toLocaleString()}`}
                              sx={{
                                 color: '#ef4444',
                                 '& .MuiSlider-track': {
                                    backgroundColor: '#ef4444',
                                    height: 8,
                                    border: 'none',
                                 },
                                 '& .MuiSlider-rail': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    height: 8,
                                 },
                                 '& .MuiSlider-thumb': {
                                    backgroundColor: '#ef4444',
                                    width: 24,
                                    height: 24,
                                    border: '3px solid #fca5a5',
                                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                                    '&:hover': {
                                       boxShadow: '0 6px 16px rgba(239, 68, 68, 0.5)',
                                    },
                                    '&.Mui-active': {
                                       boxShadow: '0 6px 16px rgba(239, 68, 68, 0.5)',
                                    },
                                 },
                                 '& .MuiSlider-valueLabelLabel': {
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                 },
                                 '& .MuiSlider-valueLabel': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    color: '#ffffff',
                                 },
                              }}
                           />
                        </Box>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded px-3 py-2 border border-white/10">
                           <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Min</div>
                           <div className="flex items-center gap-1">
                              <span className="text-white/40">₹</span>
                              <input 
                                 type="number"
                                 value={minPrice}
                                 onChange={e => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                                 className="bg-transparent text-sm font-semibold text-white outline-none w-full"
                              />
                           </div>
                        </div>
                        <div className="bg-white/5 rounded px-3 py-2 border border-white/10">
                           <div className="text-[10px] uppercase font-bold text-white/40 mb-1">Max</div>
                           <div className="flex items-center gap-1">
                              <span className="text-white/40">₹</span>
                              <input 
                                 type="number"
                                 value={maxPrice}
                                 onChange={e => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                                 className="bg-transparent text-sm font-semibold text-white outline-none w-full"
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div>Loading...</div></div>}>
      <HomePageContent />
    </Suspense>
  );
}