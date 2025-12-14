"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Stack from "@/components/fancy/stack";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowUpRight, X, Sparkles, CornerRightDown, 
  Plus, User, LogOut, ArrowRight, Heart, Menu, SlidersHorizontal
} from "lucide-react";
import Link from "next/link";

// Helper hook for debouncing (prevents API spam while typing)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function HomePage() {
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
  const [showFilters, setShowFilters] = useState(false); // Desktop Filter Popover
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);

  // Live Search Debounce
  const debouncedSearch = useDebounce(search, 400);
  const debouncedMin = useDebounce(minPrice, 400);
  const debouncedMax = useDebounce(maxPrice, 400);
  const debouncedCategory = useDebounce(category, 400);

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
      }, 500);
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

      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply Filters directly to query
      if (debouncedSearch) query = query.ilike("title", `%${debouncedSearch}%`);
      if (debouncedCategory) query = query.ilike("category", `%${debouncedCategory}%`);
      if (debouncedMin > 0) query = query.gte("price", debouncedMin);
      if (debouncedMax < 100000) query = query.lte("price", debouncedMax);

      const { data, error } = await query;
      if (!error) setListings(data || []);
      setLoading(false);
    }
    
    fetchData();
  }, [debouncedSearch, debouncedCategory, debouncedMin, debouncedMax, isCheckComplete]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const clearFilters = () => {
    setSearch(""); setCategory(""); setMinPrice(0); setMaxPrice(100000);
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
        className={`z-50 pointer-events-none mix-blend-difference flex flex-col w-full ${introComplete ? "absolute top-0 left-0 my-0 p-4 sm:p-8" : "fixed inset-0 justify-center items-center"}`}
        initial={isFirstVisit ? "intro" : "header"}
        animate={introComplete ? "header" : "intro"}
        variants={{
          intro: { }, // Handled by classNames
          header: { } // Handled by classNames
        }}
        layout // This helps smooth transition between fixed/absolute
      >
          <div className={`flex flex-col ${introComplete ? "items-end w-full" : "items-center"}`}>
            <motion.h1 layout className={`font-black uppercase leading-[0.8] tracking-tighter transition-all duration-1000 ${introComplete ? "text-5xl md:text-7xl" : "text-7xl md:text-[10rem]"}`}>
               Market
            </motion.h1>
            
            <div className={`flex items-center gap-4 ${introComplete ? "justify-end" : "justify-center"}`}>
               {/* Sell Button - Moves into header */}
               <motion.div 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: introComplete ? 1 : 0, scale: introComplete ? 1 : 0 }} 
                  transition={{ delay: isFirstVisit ? 1.5 : 0 }}
                  className="pointer-events-auto"
               >
                  <Link href="/listing/create" className="h-8 px-3 sm:h-10 sm:px-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all shadow-lg gap-2">
                     <Plus className="w-3 h-3 sm:w-4 sm:h-4" /> Sell
                  </Link>
               </motion.div>

               <motion.h1 layout className={`font-black uppercase leading-[0.8] tracking-tighter text-red-600 transition-all duration-1000 ${introComplete ? "text-5xl md:text-7xl" : "text-7xl md:text-[10rem]"}`}>
                  Me.
               </motion.h1>
            </div>
            
            {/* Tagline */}
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: introComplete ? 1 : 0 }} 
              transition={{ delay: 1.5, duration: 1 }} 
              className={`text-white/40 mx-6 font-medium lowercase tracking-wide text-xs sm:text-sm mt-2 ${introComplete ? "text-right" : "text-center"}`}
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
          transition={{ duration: 0.6, delay: isFirstVisit ? 1.2 : 0 }}
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
          transition={{ duration: 0.6 }}
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
        className="relative z-10 pt-48 sm:pt-40 pb-32 px-4 sm:px-8 max-w-[1800px] mx-auto"
      >

        {/* Divider */}
        {!loading && (
          <div className="flex items-end gap-4 mb-8 sm:mb-12 opacity-80">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-[0.3em]">Season 01</span>
                <h2 className="text-2xl sm:text-4xl font-thin uppercase tracking-widest text-white">Latest Drops</h2>
             </div>
             <div className="h-px bg-white/20 flex-1 mb-3" />
             <CornerRightDown className="w-5 h-5 text-white/40 mb-3" />
          </div>
        )}

        {/* Loader */}
        {loading && introComplete && (
          <div className="h-[50vh] flex items-center justify-center">
            <Stack />
          </div>
        )}

        {/* Grid: 2 Cols on Mobile, 4 on Desktop */}
        {!loading && listings.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-3xl">
             <h2 className="text-xl font-bold text-white/20 uppercase tracking-widest">No Matches</h2>
             <button onClick={clearFilters} className="mt-4 text-xs uppercase tracking-widest text-red-500 hover:text-white transition-colors">Reset</button>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-2 md:grid-cols-3  lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 md:my-1">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="group cursor-pointer flex flex-col gap-2 sm:gap-4"
              >
                <div className="relative h-44 sm:h-auto sm:aspect-[4/3] w-full overflow-hidden rounded-xl sm:rounded-2xl bg-[#1a1a1a] border border-white/10 group-hover:border-red-600/50 transition-all duration-500 shadow-xl">
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
                   <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                     <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md border border-white/10">{listing.category}</span>
                   </div>

                   {/* Heart */}
                   {savedListingIds.has(listing.id) && (
                     <div className="absolute top-2 right-2">
                       <Heart className="w-4 h-4 fill-red-600 text-red-600 drop-shadow-md" />
                     </div>
                   )}
                   
                   {/* Hover Action */}
                   <div className="absolute bottom-2 right-2 bg-white/10 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowRight className="w-4 h-4" />
                   </div>
                </div>
                
                <div className="px-1 space-y-0.5 sm:space-y-1">
                   <h3 className="text-sm sm:text-lg font-bold text-white leading-tight truncate">{listing.title}</h3>
                   <p className="text-xs sm:text-base font-medium text-white/60">₹{listing.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
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
             onClick={() => setShowFilters(!showFilters)}
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
      <div className={`md:hidden fixed bottom-6 inset-x-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ease-out ${
        isSearchBarVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}>
        <div className="bg-[#1a1a1a]/90 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-xl">
          <Search className="w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-white/40 w-full"
          />
        </div>
      </div>

      {/* --- MOBILE HAMBURGER (Floating Action Button) --- */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setShowMobileMenu(true)}
          className="w-14 h-14 bg-white text-black rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center"
        >
           <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
             initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{type: "spring", damping: 25, stiffness: 200}}
             className="fixed inset-0 z-[60] bg-[#121212] p-6 flex flex-col gap-6"
          >
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><X className="w-5 h-5"/></button>
             </div>

             {/* My Space Button */}
             <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
               <button className="w-full bg-white text-black py-4 rounded-xl text-center font-bold text-sm uppercase hover:bg-red-600 hover:text-white transition-all">
                 My Space
               </button>
             </Link>

             {/* Filters Button */}
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className="w-full bg-white/10 text-white py-4 rounded-xl text-center font-bold text-sm uppercase hover:bg-white/20 transition-all flex items-center justify-center gap-2"
             >
               <SlidersHorizontal className="w-4 h-4" /> Filters
             </button>

             {/* Mobile Search & Filters */}
             {showFilters && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                   <Search className="w-5 h-5 text-white/50" />
                   <input 
                     type="text" 
                     placeholder="Type to search..." 
                     className="bg-transparent w-full text-lg font-medium outline-none placeholder:text-white/20"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                   />
                </div>

                <input 
                   type="text" 
                   placeholder="Category (e.g. Shoes)" 
                   value={category}
                   onChange={e => setCategory(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-xl px-4 h-12 text-sm focus:border-red-600 outline-none"
                />
                
                {/* Visual Price Slider using Inputs */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                   <div className="flex justify-between text-[10px] uppercase font-bold text-white/40">
                      <span>Price Range</span>
                      <span>₹{minPrice} - ₹{maxPrice}</span>
                   </div>
                   <div className="relative h-1 bg-white/10 rounded-full mb-4">
                      <div className="absolute h-full bg-red-600 rounded-full" style={{ left: '0%', right: '0%' }} />
                   </div>
                   <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} className="w-1/2 bg-black/20 rounded-lg h-10 px-3 text-xs outline-none focus:ring-1 ring-red-600" />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-1/2 bg-black/20 rounded-lg h-10 px-3 text-xs outline-none focus:ring-1 ring-red-600" />
                   </div>
                </div>
               </motion.div>
             )}

             <div className="mt-auto">
               {user && (
                 <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="w-full bg-red-600 text-white py-4 rounded-xl text-center font-bold text-sm uppercase hover:bg-red-700 transition-all">
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
               className="hidden md:block fixed bottom-24 left-1/2 -translate-x-1/2 w-[400px] bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl z-50"
            >
               <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/50">Refine Search</span>
                  <button onClick={clearFilters} className="text-[10px] text-red-500 hover:text-white uppercase font-bold">Clear All</button>
               </div>
               
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/30 block mb-1">Category</label>
                    <input value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 h-10 text-sm focus:border-white/50 outline-none transition-colors" placeholder="All Categories" />
                  </div>

                  <div>
                     <label className="text-[10px] uppercase font-bold text-white/30 block mb-2">Price Range</label>
                     <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">₹</span>
                           <input type="number" value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} className="w-full bg-[#121212] pl-6 rounded-lg h-10 text-sm outline-none border border-white/10 focus:border-red-600" />
                        </div>
                        <span className="text-white/20">-</span>
                        <div className="flex-1 relative">
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">₹</span>
                           <input type="number" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full bg-[#121212] pl-6 rounded-lg h-10 text-sm outline-none border border-white/10 focus:border-red-600" />
                        </div>
                     </div>
                     {/* Visual bar */}
                     <div className="h-1 bg-white/10 w-full mt-3 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 w-full opacity-50" /> 
                     </div>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}