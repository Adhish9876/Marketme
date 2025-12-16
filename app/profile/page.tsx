"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, Edit, MapPin, Calendar, Mail, Package, 
  Trash2, ExternalLink, Plus, 
  Home
} from "lucide-react";
import Link from "next/link";
import Stack from "@/components/fancy/stack";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  async function loadProfileData() {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/auth/login");
      return;
    }

    setUser(authUser);

    // Get user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    setProfile(profileData);

    // Get user's listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    setListings(listingsData || []);

    // Get user's saved listings
    const { data: savedData } = await supabase
      .from("saved_listings")
      .select("listing_id, listings(*)")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    const savedListingsFormatted = savedData?.map((item: any) => item.listings).filter(Boolean) || [];
    setSavedListings(savedListingsFormatted);

    setLoading(false);
  }

  async function deleteListing(listingId: string, listingTitle: string) {
    if (!confirm(`Permanently delete "${listingTitle}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      alert("Error removing asset.");
      return;
    }

    setListings(prev => prev.filter(listing => listing.id !== listingId));
  }

  async function markAsSold(listingId: string) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    if (error) {
      alert("Error marking as sold.");
      return;
    }

    setListings(prev => prev.map(listing => 
      listing.id === listingId ? { ...listing, status: "sold" } : listing
    ));
  }

  async function markAsUnsold(listingId: string) {
    const { error } = await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", listingId);

    if (error) {
      alert("Error marking as unsold.");
      return;
    }

    setListings(prev => prev.map(listing => 
      listing.id === listingId ? { ...listing, status: "active" } : listing
    ));
  }

  useEffect(() => {
    loadProfileData();

    // Refresh data when window regains focus
    const handleFocus = () => {
      console.log("Profile page regained focus, reloading data");
      loadProfileData();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also refresh when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log("Profile page became visible, reloading data");
        loadProfileData();
      }
    });
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', () => {});
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Stack />
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading Dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-20 sm:pb-24 font-sans selection:bg-red-600 selection:text-white relative">
      
      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* Navbar - Mobile optimized */}
      <nav className="fixed top-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-l border-white/10 py-2 sm:py-4 px-3 sm:px-6">
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button onClick={() => router.push("/profile/edit")} className="px-3 sm:px-5 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg sm:rounded-xl hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-1.5 sm:gap-2 active:scale-95">
             <Edit className="w-3 h-3" />
             <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest">Edit</span>
          </button>
          <Link
            href="/"
            className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 flex items-center justify-center bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-16 sm:pt-24 md:pt-32 space-y-8 sm:space-y-12 md:space-y-16">
         
         {/* --- PROFILE CARD --- */}
         <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none group-hover:opacity-10 transition-opacity duration-700">
               <span className="text-[8rem] sm:text-[10rem] md:text-[12rem] font-black text-white leading-none tracking-tighter">ID</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]" />

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-10 items-center sm:items-start relative z-10">
               {/* Avatar */}
               <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full border-4 border-[#121212] bg-[#121212] overflow-hidden shadow-2xl shrink-0 relative">
                  {profile?.avatar_url ? (
                     <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-bold text-white/20 bg-white/5">
                        {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                     </div>
                  )}
               </div>
               
               {/* Info */}
               <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 pt-0 sm:pt-2 text-center sm:text-left w-full">
                  <div>
                     <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white mb-1 sm:mb-2">
                        {profile?.name || "Anonymous Agent"}
                     </h1>
                     <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
                        <p className="text-red-500 font-mono text-xs sm:text-sm">@{profile?.username || "username_unset"}</p>
                        <span className="text-white/20 hidden sm:inline">|</span>
                        <p className="text-white/40 font-mono text-xs sm:text-sm uppercase">Level 1 Seller</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-white/60 pt-3 sm:pt-4 border-t border-white/10">
                     <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                        <span className="uppercase tracking-wide text-[10px] sm:text-xs font-bold truncate">{profile?.city || "Location Classified"}</span>
                     </div>
                     <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                        <span className="uppercase tracking-wide text-[10px] sm:text-xs font-bold truncate">{user?.email}</span>
                     </div>
                     <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 sm:col-span-2 md:col-span-1">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                        <span className="uppercase tracking-wide text-[10px] sm:text-xs font-bold">Joined {new Date(user?.created_at).toLocaleDateString()}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* --- TABS SECTION --- */}
         <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
               <div className="flex gap-4 sm:gap-6 md:gap-8">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-2 text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider sm:tracking-widest transition-all ${
                      activeTab === 'inventory'
                        ? 'text-white border-b-2 border-red-600'
                        : 'text-white/40 active:text-white/60'
                    }`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`pb-2 text-sm sm:text-base md:text-lg font-bold uppercase tracking-wider sm:tracking-widest transition-all ${
                      activeTab === 'liked'
                        ? 'text-white border-b-2 border-red-600'
                        : 'text-white/40 active:text-white/60'
                    }`}
                  >
                    Liked
                  </button>
               </div>
               {activeTab === 'inventory' && (
                  <div className="flex items-center gap-2 sm:gap-4">
                     <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white/10">{listings.length.toString().padStart(2, '0')}</span>
                     <button onClick={() => router.push("/listing/create")} className="h-8 w-8 sm:h-10 sm:w-10 bg-white text-black hover:bg-red-600 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95">
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                     </button>
                  </div>
               )}
            </div>

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
               <>
               {listings.length === 0 ? (
                  <div className="h-48 sm:h-64 border border-dashed border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-white/30 gap-3 sm:gap-4 bg-[#1a1a1a]/50">
                     <Package className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
                     <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Inventory Empty</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {listings.map((item) => (
                     <div key={item.id} className="group bg-[#1a1a1a] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-red-600/50 transition-all hover:shadow-2xl relative">
                        
                        {/* Image Area */}
                        <div className="aspect-[4/3] bg-black/50 relative cursor-pointer overflow-hidden">
                           {item.cover_image ? (
                               <img src={item.cover_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-6 h-6"/></div>
                           )}
                           
                           {item.status === 'sold' && (
                               <div className="absolute inset-0 flex items-center justify-center">
                                   {/* Blurred Background */}
                                   <div className="absolute inset-0 bg-black/40" style={{backdropFilter: 'blur(4px)'}} />
                                   {/* Full Diagonal Line */}
                                   <svg className="absolute inset-0 w-full h-full text-red-600" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                                     <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                     <text x="50" y="50" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" letterSpacing="1" style={{dominantBaseline: 'middle'}}>SOLD</text>
                                   </svg>
                                   {/* Unsold Button - Shows on Hover */}
                                   <button
                                     onClick={() => markAsUnsold(item.id)}
                                     className="absolute z-10 px-2 sm:px-4 py-1 sm:py-2 bg-white text-black hover:bg-red-600 hover:text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded transition-all opacity-0 group-hover:opacity-100"
                                   >
                                     Mark Unsold
                                   </button>
                               </div>
                           )}

                           {/* Mark as Sold Button - Shows on Hover */}
                           {item.status !== 'sold' && (
                               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                 <button
                                   onClick={() => markAsSold(item.id)}
                                   className="px-2 sm:px-4 py-1 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded transition-all"
                                 >
                                   Mark as Sold
                                 </button>
                               </div>
                           )}
                        </div>

                        {/* Details */}
                        <div className="p-2 sm:p-4 flex flex-col gap-1 sm:gap-2">
                           <div onClick={() => router.push(`/listing/${item.id}`)} className="cursor-pointer">
                                <h3 className="text-white font-bold truncate text-xs sm:text-lg group-hover:text-red-500 transition-colors">{item.title}</h3>
                                <p className="text-white/50 font-mono text-[10px] sm:text-sm">₹{item.price.toLocaleString()}</p>
                           </div>

                           {/* Actions Toolbar */}
                           <div className="flex items-center gap-1 mt-1 sm:mt-2 pt-1 sm:pt-3 border-t border-white/5">
                              <button 
                                onClick={() => router.push(`/listing/${item.id}`)}
                                className="flex-1 py-1 sm:py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                              >
                                 <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3" /> View
                              </button>
                              <button 
                                onClick={() => router.push(`/listing/edit/${item.id}`)}
                                className="py-1 sm:py-2 px-2 sm:px-3 bg-blue-900/20 hover:bg-blue-600 text-blue-500 hover:text-white rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                 <Edit className="w-2 h-2 sm:w-3 sm:h-3" />
                              </button>
                              <button 
                                onClick={() => deleteListing(item.id, item.title)}
                                className="py-1 sm:py-2 px-2 sm:px-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                 <Trash2 className="w-2 h-2 sm:w-3 sm:h-3" />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
               )}
               </>
            )}

            {/* Liked Tab */}
            {activeTab === 'liked' && (
               <>
               {savedListings.length === 0 ? (
                  <div className="h-48 sm:h-64 border border-dashed border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center text-white/30 gap-3 sm:gap-4 bg-[#1a1a1a]/50">
                     <Package className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
                     <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">No Saved Items</p>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                     {savedListings.map((item: any) => (
                        <div key={item.id} className="group bg-[#1a1a1a] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden hover:border-red-600/50 transition-all hover:shadow-2xl relative">
                           
                           {/* Image Area */}
                           <div onClick={() => router.push(`/listing/${item.id}`)} className="aspect-[4/3] bg-black/50 relative cursor-pointer overflow-hidden">
                              {item.cover_image ? (
                                  <img src={item.cover_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-6 h-6"/></div>
                              )}
                              
                              {item.status === 'sold' && (
                                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                                      <span className="px-2 sm:px-3 py-1 bg-red-600 text-white text-[8px] sm:text-xs font-bold uppercase tracking-widest rounded border border-red-400">Sold</span>
                                  </div>
                              )}
                           </div>

                           {/* Details */}
                           <div className="p-2 sm:p-4 flex flex-col gap-1 sm:gap-2">
                              <div onClick={() => router.push(`/listing/${item.id}`)} className="cursor-pointer">
                                   <h3 className="text-white font-bold truncate text-xs sm:text-lg group-hover:text-red-500 transition-colors">{item.title}</h3>
                                   <p className="text-white/50 font-mono text-[10px] sm:text-sm">₹{item.price.toLocaleString()}</p>
                              </div>

                              {/* Actions Toolbar */}
                              <div className="flex items-center gap-1 mt-1 sm:mt-2 pt-1 sm:pt-3 border-t border-white/5">
                                 <button 
                                   onClick={() => router.push(`/listing/${item.id}`)}
                                   className="flex-1 py-1 sm:py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                                 >
                                    <ExternalLink className="w-2 h-2 sm:w-3 sm:h-3" /> View
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
               </>
            )}
         </div>

      </main>
    </div>
  );
}