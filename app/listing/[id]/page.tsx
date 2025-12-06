"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, MapPin, Flag, ChevronLeft, ChevronRight, 
  MessageSquare, Shield, Share2, CheckCircle2,
  Box, Layers, Calendar, ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import SaveButton from "@/components/SaveButton";
import GoogleMapComponent from "@/components/GoogleMapComponent";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  category: string;
  condition: string;
  status: string;
  user_id: string;
  created_at: string;
  cover_image?: string;
  banner_image?: string;
  gallery_images?: string[];
  images?: string[];
  latitude?: number;
  longitude?: number;
};

type Seller = {
  id: string;
  name: string;
  username: string;
  city: string;
  avatar_url?: string;
  verified: boolean;
};

// --- Dynamic Map Import ---
const ListingMap = dynamic(() => import("@/components/ListingMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full bg-[#0a0a0a] border border-white/10 flex flex-col items-center justify-center gap-2 rounded-[2.5rem]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-red-600 rounded-full animate-spin" />
      <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Map Loading...</span>
    </div>
  )
});

export default function ListingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);

  // --- Data Fetching ---
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .single();

        if (listingError) throw new Error("Listing not found");
        setListing(listingData as Listing);

        const { data: sellerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", listingData.user_id)
          .maybeSingle();

        if (sellerData) {
          setSeller({
            id: sellerData.id,
            name: sellerData.name || "Unknown",
            username: sellerData.username || "User",
            city: sellerData.city || "Unknown",
            avatar_url: sellerData.avatar_url,
            verified: sellerData.is_admin || false,
          });
        } else {
           setSeller({ id: listingData.user_id, name: "Unknown", username: "user", city: "Unknown", verified: false });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // --- Logic ---
  const allImages = listing ? [
    ...(listing.cover_image ? [listing.cover_image] : []),
    ...(listing.banner_image ? [listing.banner_image] : []),
    ...(listing.gallery_images || []),
    ...(listing.images || []),
  ].filter(Boolean) : [];

  const scrollImage = (dir: 'next' | 'prev') => {
    if (dir === 'next') setImgIndex((c) => (c + 1) % allImages.length);
    else setImgIndex((c) => (c - 1 + allImages.length) % allImages.length);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
         <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"/>
         <p className="font-mono text-xs uppercase tracking-widest text-white/30">Loading Asset Data...</p>
      </div>
    </div>
  );

  if (!listing || !seller) return null;

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-600 selection:text-white pb-32 overflow-x-hidden">
      
      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-2 opacity-5"
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`}} 
      />

      {/* --- FLOATING NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 z-[100] px-6 py-6 flex justify-between items-start pointer-events-none">
        <button 
          onClick={() => router.back()}
          className="pointer-events-auto flex items-center gap-3 px-6 py-3 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all group shadow-2xl"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return</span>
        </button>

        <div className="pointer-events-auto flex items-center gap-3">
           <button className="w-12 h-12 flex items-center justify-center bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all shadow-2xl">
              <Share2 className="w-4 h-4" />
           </button>
           <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
              <SaveButton listingId={listing.id} />
           </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="relative my-5 z-10 pt-20 px-4 sm:px-8 max-w-[1800px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* --- LEFT COLUMN: VISUALS (Cinematic) --- */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* 1. Main Projector Screen */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[16/10] w-full bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] group"
            >
               {allImages.length > 0 ? (
                 <>
                   <img 
                     src={allImages[imgIndex]} 
                     className="w-full h-full object-cover opacity-90 transition-transform duration-1000 ease-out group-hover:scale-105"
                   />
                   
                   {/* Cinematic Gradient Vignette */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                   
                   {/* Navigation Arrows (Hover) */}
                   {allImages.length > 1 && (
                     <div className="absolute inset-0 flex items-center justify-between p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => scrollImage('prev')} className="w-14 h-14 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all">
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button onClick={() => scrollImage('next')} className="w-14 h-14 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all">
                          <ChevronRight className="w-6 h-6" />
                        </button>
                     </div>
                   )}

                   {/* Tech Overlay: Counter */}
                   <div className="absolute bottom-8 right-8 px-5 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-3">
                      <div className="flex gap-1">
                        {allImages.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-red-600' : 'bg-white/20'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold font-mono tracking-widest border-l border-white/20 pl-3 text-white/80">
                        IMG {String(imgIndex + 1).padStart(2, '0')}
                      </span>
                   </div>
                 </>
               ) : (
                 <div className="flex items-center justify-center h-full text-white/20 font-mono text-xs uppercase tracking-widest flex-col gap-4">
                    <Box className="w-10 h-10 opacity-20" />
                    <span>No Visual Data Available</span>
                 </div>
               )}
            </motion.div>

            {/* 2. Specs Grid (Data Visualization) */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-16">

               {[
                 { label: "Category", value: listing.category, icon: Layers },
                 { label: "Condition", value: listing.condition, icon: Box },
                 { label: "Listed", value: new Date(listing.created_at).toLocaleDateString(), icon: Calendar },
                 { label: "Location", value: listing.location, icon: MapPin },
               ].map((item, i) => (
                 <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
                    <item.icon className="w-5 h-5 text-red-600" />
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</p>
                       <p className="text-sm font-bold text-white mt-1 truncate">{item.value}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* 3. Description (Typography with Border) */}
            
          </div>

          {/* --- RIGHT: HUD (Sticky Actions) --- */}
          <div className="lg:col-span-4 relative">
             <div className="sticky top-8 space-y-8">
                
                {/* 1. The "Price Ticket" HUD (Fixed Colors) */}
                <div className="bg-[#181818] border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
                   {/* Glowing Top Line */}
                   <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-900 to-transparent opacity-80" />
                   
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Valuation</p>
                         <div className="flex items-baseline gap-1">
                            <span className="text-xl font-light text-white/40">₹</span>
                            <span className="text-6xl font-black text-white tracking-tighter">
                              {listing.price.toLocaleString()}
                            </span>
                         </div>
                      </div>
                      {listing.status === "sold" && (
                         <span className="bg-red-600/20 text-red-500 border border-red-600/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Sold
                         </span>
                      )}
                   </div>

                   <div className="space-y-4">
                      {listing.status === "sold" ? (
                         <button disabled className="w-full py-5 bg-[#222] border border-white/5 text-white/30 font-bold text-xs uppercase tracking-[0.2em] rounded-2xl cursor-not-allowed">
                            Acquisition Closed
                         </button>
                      ) : (
                         <button 
                           onClick={() => router.push(`/chat/${listing.user_id}`)}
                           className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 group"
                         >
                            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            message
                         </button>
                      )}
                      
                      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                         <Shield className="w-3 h-3" /> Secure Protocol
                      </div>
                   </div>
                </div>

                {/* 2. Seller Dossier */}
                <div className="bg-[#121212] border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-4 hover:bg-[#181818] transition-colors group cursor-pointer">
                   <div className="h-16 w-16 bg-[#222] rounded-[2rem] flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-white/20 transition-colors">
                      {seller.avatar_url ? (
                         <img src={seller.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-xl font-serif text-white/40">{seller.name.charAt(0)}</span>
                      )}
                   </div>
                   
                   <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">Source ID</p>
                       <div className="flex items-center gap-2 cursor-pointer" onClick={()=>{router.push(`/seller/${seller.id}`)}}>
                         <h4 className="text-lg font-bold text-white">{seller.name}</h4>
                         {seller.verified && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20" />}
                      </div>
                   </div>

                   <div className="pr-6">
                      <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                   </div>
                </div>

                {/* 3. Description Section */}
                
                   <div className="p-8 border border-white/10 rounded-[2rem] bg-[#1a1a1a]/50">
               <h2 className="text-3xl font-black mb-6 tracking-tight text-white/90">Description</h2>
               <div className="prose prose-invert prose-lg max-w-none">
                 <p className="text-white/60 font-semibold leading-relaxed whitespace-pre-line text-md">
                   {listing.description}
                 </p>
               </div>
            </div>
                

                {/* 4. Report Link */}
                <div className="text-center">
                   <button className="text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-red-600 flex items-center justify-center gap-2 transition-colors py-2">
                      <Flag className="w-3 h-3" /> Report Anomaly
                   </button>
                </div>

             </div>
          </div>

        </div>
      </main>
    </div>
  );
}