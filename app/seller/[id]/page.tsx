"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  MapPin, Calendar, Mail, Package,
  ExternalLink, MessageCircle
} from "lucide-react";
// import { openChatWithSeller } from "@/components/ChatWidget"; // Removed due to missing export
import { LoginPromptBanner } from "@/components/LoginPromptBanner";
import Stack from "@/components/fancy/stack";

export default function SellerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  async function loadSellerData() {
    if (!sellerId) {
      router.push("/");
      return;
    }

    // Get seller profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sellerId)
      .maybeSingle();

    if (!profileData) {
      router.push("/");
      return;
    }

    setProfile(profileData);

    // Get seller's listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", sellerId)
      .order("created_at", { ascending: false });

    setListings(listingsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadSellerData();
  }, [sellerId]);

  const handleContactClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!sellerId || sellerId === 'null' || sellerId === 'undefined') {
      console.error("Invalid seller ID:", sellerId);
      return;
    }
    // openChatWithSeller(sellerId); // TODO: Implement chat functionality once function is available
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Stack />
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans selection:bg-red-600 selection:text-white relative">
      
      {/* Login Prompt Banner */}
      <LoginPromptBanner 
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="Sign in to contact sellers and unlock full marketplace access"
      />

      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* Navbar */}
      <nav className="fixed top-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-l border-white/10 py-4 px-6">
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => router.back()} className="px-5 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all flex items-center gap-2">
             <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 space-y-16">
         
         {/* --- PROFILE CARD --- */}
         <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none group-hover:opacity-10 transition-opacity duration-700">
               <span className="text-[12rem] font-black text-white leading-none tracking-tighter">ID</span>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]" />

            <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
               {/* Avatar */}
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#121212] bg-[#121212] overflow-hidden shadow-2xl shrink-0 relative">
                  {profile?.avatar_url ? (
                     <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/20 bg-white/5">
                        {profile?.username?.[0]?.toUpperCase() || "?"}
                     </div>
                  )}
               </div>
               
               {/* Info */}
               <div className="flex-1 space-y-6 pt-2">
                  <div>
                     <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">
                        {profile?.name || "Anonymous Agent"}
                     </h1>
                     <div className="flex items-center gap-3">
                        <p className="text-red-500 font-mono text-sm">@{profile?.username || "username_unset"}</p>
                        <span className="text-white/20">|</span>
                        <p className="text-white/40 font-mono text-sm uppercase">Level 1 Seller</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white/60 pt-4 border-t border-white/10">
                     <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="uppercase tracking-wide text-xs font-bold">{profile?.city || "Location Classified"}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-red-600" />
                        <span className="uppercase tracking-wide text-xs font-bold">{profile?.phone || "Contact Hidden"}</span>
                     </div>
                  </div>
               </div>

               {/* Contact Button */}
               <button 
                 onClick={handleContactClick}
                 className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 whitespace-nowrap"
               >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Contact Seller</span>
               </button>
            </div>
         </div>

         {/* --- LISTINGS SECTION --- */}
         <div className="space-y-8">
            <div className="flex items-end justify-between border-b border-white/10 pb-4">
               <div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Inventory</h2>
                  <p className="text-xs font-mono text-white/40 mt-1">ASSETS FOR SALE</p>
               </div>
               <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-white/10">{listings.length.toString().padStart(2, '0')}</span>
               </div>
            </div>

            {listings.length === 0 ? (
               <div className="h-64 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-white/30 gap-4 bg-[#1a1a1a]/50">
                  <Package className="w-10 h-10 opacity-50" />
                  <p className="text-xs font-bold uppercase tracking-widest">No Active Listings</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map((item) => (
                     <div key={item.id} className="group bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden hover:border-red-600/50 transition-all hover:shadow-2xl relative">
                        
                        {/* Image Area */}
                        <div onClick={() => router.push(`/listing/${item.id}`)} className="aspect-[4/3] bg-black/50 relative cursor-pointer overflow-hidden">
                           {item.cover_image ? (
                               <img src={item.cover_image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-white/20"><Package className="w-8 h-8"/></div>
                           )}
                           
                           {item.status === 'sold' && (
                               <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                                   <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded border border-red-400">Sold</span>
                               </div>
                           )}
                        </div>

                        {/* Details */}
                        <div className="p-4 flex flex-col gap-2">
                           <div onClick={() => router.push(`/listing/${item.id}`)} className="cursor-pointer">
                                <h3 className="text-white font-bold truncate text-lg group-hover:text-red-500 transition-colors">{item.title}</h3>
                                <p className="text-white/50 font-mono text-sm">₹{item.price.toLocaleString()}</p>
                           </div>

                           {/* Action */}
                           <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                              <button 
                                onClick={() => router.push(`/listing/${item.id}`)}
                                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                              >
                                 <ExternalLink className="w-3 h-3" /> View
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>

      </main>
    </div>
  );
}
