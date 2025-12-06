"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChatWidget } from "@/components/ChatWidget";
import Stack from "@/components/fancy/stack";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ArrowUpRight, X, Sparkles, CornerRightDown, 
  Plus, User, LogOut, ArrowRight 
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // --- States ---
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ANIMATION STATES ---
  // isCheckComplete: Ensures we don't render ANYTHING until we know if it's a first visit or not
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  // introComplete: Controls position (False = Center, True = Top Right)
  const [introComplete, setIntroComplete] = useState(false);
  // isFirstVisit: Keeps track if this specific session is the first one
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  // --- 1. SESSION CHECK (Prevents Animation on Reload) ---
  useEffect(() => {
    const hasVisited = localStorage.getItem("marketMeVisited");

    if (hasVisited) {
      // RETURNING USER: Skip everything, go straight to header
      setIntroComplete(true);
      setIsFirstVisit(false);
    } else {
      // NEW USER: Start at center, mark as visited
      setIntroComplete(false);
      setIsFirstVisit(true);
      localStorage.setItem("marketMeVisited", "true");
    }
    
    // Allow rendering to proceed
    setIsCheckComplete(true);
  }, []);

  // --- 2. ANIMATION SEQUENCER (Only for First Visit) ---
  useEffect(() => {
    // Only run this logic if it IS the first visit
    if (!isFirstVisit) return;

    // When Data finishes loading -> Wait 0.5s then Move Logo
    if (!loading) {
      const timer = setTimeout(() => {
        setIntroComplete(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, isFirstVisit]);

  // --- Auth & Data Fetching ---
  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(profile);
      }

      let query = supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      const urlSearch = searchParams.get("search");
      if (urlSearch) query = query.ilike("title", `%${urlSearch}%`);
      if (searchParams.get("category")) query = query.ilike("category", `%${searchParams.get("category")}%`);
      if (searchParams.get("minPrice")) query = query.gte("price", Number(searchParams.get("minPrice")));
      if (searchParams.get("maxPrice")) query = query.lte("price", Number(searchParams.get("maxPrice")));

      const { data, error } = await query;
      if (!error) setListings(data || []);
      
      // Data Ready -> Triggers animation end (if first visit)
      setLoading(false);
    }
    
    initData();
  }, [searchParams]);

  // --- Actions ---
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    setShowFilters(false);
    router.push(`/?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch(""); setCategory(""); setMinPrice(""); setMaxPrice("");
    router.push("/");
    setShowFilters(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setShowUserMenu(false);
    router.refresh();
  };

  // Prevent flash of wrong layout by waiting for check
  if (!isCheckComplete) return <div className="min-h-screen bg-[#121212]" />;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]"
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* --- LOGO TRANSITION CONTAINER --- */}
      <motion.div 
        className="fixed z-50 pointer-events-none mix-blend-difference flex flex-col"
        initial={isFirstVisit ? "intro" : "header"}
        animate={introComplete ? "header" : "intro"}
        variants={{
          intro: { top: "50%", left: "50%", x: "-50%", y: "-50%", alignItems: "center" },
          header: { top: "0%", right: "0%", left: "auto", x: "0%", y: "0%", alignItems: "flex-end", paddingTop: "0.5rem", paddingRight: "2rem" }
        }}
        // Only animate duration if it's the first visit. If reload, duration is 0 (instant).
        transition={{ duration: isFirstVisit ? 1.5 : 0, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
         <div className="flex flex-col text-right">
            <motion.h1 layout className={`font-black uppercase leading-[0.8] tracking-tighter transition-all duration-1000 ${introComplete ? "text-5xl md:text-7xl" : "text-8xl md:text-[10rem]"}`}>
               Market
            </motion.h1>
            
            <div className="flex items-center justify-end gap-4">
              <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: introComplete ? 1 : 0, x: introComplete ? 0 : 20 }} 
                  transition={{ delay: isFirstVisit ? 1.5 : 0, duration: 0.8 }}
                  className="pointer-events-auto"
               >
                  <Link href="/listing/create" className={`h-12 px-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-widest transition-all shadow-lg gap-2 ${introComplete ? "scale-100" : "scale-0"}`}>
                     <Plus className="w-4 h-4" />
                     Sell
                  </Link>
               </motion.div>

               {/* Regular Text "Me." - No fuzzy effect */}
               <motion.h1 layout className={`font-black uppercase leading-[0.8] tracking-tighter text-red-600 transition-all duration-1000 ${introComplete ? "text-5xl md:text-7xl" : "text-8xl md:text-[10rem]"}`}>
                  Me.
               </motion.h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: introComplete ? 1 : 0 }} 
              transition={{ delay: isFirstVisit ? 1.5 : 0, duration: 1 }} 
              className="text-white/40 font-medium lowercase tracking-wide text-sm mt-2 mr-1"
            >
               its mine! of the guys
            </motion.p>
         </div>
      </motion.div>

      {/* 3. MAIN CONTENT */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ delay: isFirstVisit ? 1.2 : 0, duration: 1.0 }}
        className="relative z-10 my-40 pb-40 px-5 max-w-[1800px] mx-auto"
      >
        {/* Divider */}
        {!loading && (
          <div className="flex items-end gap-6 mb-16 opacity-80">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-[0.3em]">Season 01</span>
                <h2 className="text-4xl font-thin uppercase tracking-widest text-white">Latest Drops</h2>
             </div>
             <div className="h-px bg-white/20 flex-1 mb-3" />
             <CornerRightDown className="w-6 h-6 text-white/40 mb-3" />
          </div>
        )}

        {/* Loading State with Stack Loader */}
        {loading && introComplete && (
          <div className="h-[60vh] flex items-center justify-center">
            <Stack />
          </div>
        )}

        {/* Grid */}
        {loading && !introComplete ? null : !loading && listings.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center opacity-50 border border-dashed border-white/10 rounded-3xl">
             <h2 className="text-2xl font-bold text-white/20 uppercase tracking-widest">Collection Empty</h2>
             <button onClick={clearFilters} className="mt-4 text-xs uppercase tracking-widest text-red-500 hover:text-white transition-colors">Reset Filters</button>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                onClick={() => router.push(`/listing/${listing.id}`)}
                className="group cursor-pointer flex flex-col gap-5"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-[#1a1a1a] border border-white/20 shadow-2xl group-hover:border-red-600/50 transition-all duration-500">
                   {listing.cover_image ? (
                     <img src={listing.cover_image} className="w-full h-full object-cover opacity-90 transition-transform duration-700 ease-[0.25,0.1,0.25,1.0] group-hover:scale-110 group-hover:opacity-100" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center"><span className="font-mono text-[10px] text-white/20 uppercase">No Visual</span></div>
                   )}
                   
                   <div className="absolute top-4 left-4 flex gap-2">
                     <span className="px-3 py-1.5 bg-[#121212]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-white/10">{listing.category || "Item"}</span>
                     {listing.status === "sold" && <span className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg">Sold</span>}
                   </div>
                   
                   <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center opacity-100 group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500">
                      <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                   </div>
                </div>
                <div className="pl-2 pr-4 space-y-1">
                   <h3 className="text-xl font-bold text-white leading-tight group-hover:text-red-500 transition-colors duration-300 line-clamp-1">{listing.title}</h3>
                   <p className="text-2xl font-light text-white/80 font-sans">₹{listing.price.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.main>

      {/* 4. UNIFIED COMMAND CENTER (Bottom Dock) */}
      {!loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-10 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex items-center gap-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] w-full max-w-2xl">
           
           {/* Search & Filter Section */}
           <div className="flex-1 flex items-center gap-3 border-r border-white/10 pr-3">
              <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                className="w-full bg-transparent border-none text-sm font-medium text-white placeholder:text-white/30 focus:ring-0 px-0 h-10"
              />
              <button onClick={() => setShowFilters(!showFilters)} className={`px-3 h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${showFilters ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}>
                 Filters
              </button>
           </div>

           {/* Actions Section */}
           <div className="flex items-center gap-2">
              
              {/* USER PROFILE / LOGIN */}
              {user ? (
                 <div className="relative">
                    <button onClick={() => setShowUserMenu(!showUserMenu)} className="h-10 w-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden transition-colors">
                       {profile?.avatar_url ? (
                          <img src={profile.avatar_url} className="w-full h-full object-cover" />
                       ) : (
                          <span className="text-xs font-bold text-white">{profile?.username?.[0]?.toUpperCase() || "U"}</span>
                       )}
                    </button>
                    
                    {/* User Menu Dropdown */}
                    <AnimatePresence>
                       {showUserMenu && (
                          <motion.div 
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute bottom-full right-0 mb-3 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl p-1 shadow-2xl overflow-hidden"
                          >
                             <div className="px-3 py-2 border-b border-white/10 mb-1">
                                <p className="text-xs font-bold text-white truncate">{profile?.username}</p>
                                <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                             </div>
                             <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <User className="w-3 h-3" /> Profile
                             </Link>
                             <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-left">
                                <LogOut className="w-3 h-3" /> Logout
                             </button>
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
              ) : (
                 <Link href="/auth/login" className="h-10 px-4 bg-white text-black hover:bg-red-600 hover:text-white rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                    Login
                 </Link>
              )}
           </div>
        </div>
        </motion.div>
      )}

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 z-40 shadow-2xl"
           >
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Parameters</h3>
                 <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Type</label>
                    <input type="text" placeholder="e.g. Electronics" value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-red-600 focus:outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Min</label>
                       <input type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-red-600 focus:outline-none"/>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Max</label>
                       <input type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-red-600 focus:outline-none"/>
                    </div>
                 </div>
                 <button onClick={applyFilters} className="w-full h-12 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/90 transition-colors mt-2">Update View</button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <ChatWidget />
    </div>
  );
}