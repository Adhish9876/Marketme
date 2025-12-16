"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft, MapPin, Flag, ChevronLeft, ChevronRight,
  MessageSquare, Shield, Share2, CheckCircle2,
  Box, Layers, Calendar, ArrowUpRight, Home, ZoomIn, DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import SaveButton from "@/components/SaveButton";
import Stack from "@/components/fancy/stack";
import { openChatWithSeller } from "@/components/ChatWidget";
import ImageGalleryModal from "@/components/ImageGalleryModal";
import OfferModal from "@/components/OfferModal";
import OffersList from "@/components/OffersList";
import { useOffers } from "@/hooks/useOffers";
import Link from "next/link";

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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { offers, createOffer: submitOffer, acceptOffer, rejectOffer } = useOffers(id || "");
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

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

        // Track recently viewed
        if (currentUser) {
          await supabase.from("user_recently_viewed").upsert({
            user_id: currentUser.id,
            listing_id: id,
            viewed_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // --- Unread message tracking for this seller ---
  // --- Prepare images array ---
  const allImages = listing ? [
    ...(listing.cover_image ? [listing.cover_image] : []),
    ...(listing.banner_image ? [listing.banner_image] : []),
    ...(listing.gallery_images || []),
    ...(listing.images || []),
  ].filter(Boolean) : [];

  // --- Image navigation ---
  const scrollImage = (dir: 'next' | 'prev') => {
    if (dir === 'next') setImgIndex((c) => (c + 1) % allImages.length);
    else setImgIndex((c) => (c - 1 + allImages.length) % allImages.length);
  };

  // --- Message button handler ---
  const handleMessageClick = () => {
    if (listing?.user_id) {
       openChatWithSeller(listing.user_id); 
    }
  };

  // --- Seller click handler ---
  const handleSellerClick = () => {
    if (seller?.id) {
      router.push(`/seller/${seller.id}`);
    }
  };

  // --- Render loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Stack />
          <p className="font-mono text-xs uppercase tracking-widest text-white/30">Loading Asset Data...</p>
        </div>
      </div>
    );
  }

  // --- Render null if no data ---
  if (!listing || !seller) return null;

  // --- Main render ---
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-red-600 selection:text-white pb-16 sm:pb-24 md:pb-32 overflow-x-hidden">
      {/* Offer Modal */}
      <OfferModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
        listingPrice={listing?.price || 0}
        listingTitle={listing?.title || ""}
        onSubmit={async (offeredPrice, message) => {
          if (!user || !seller) return;
          await submitOffer(user.id, seller.id, offeredPrice, message);
          setOfferModalOpen(false);
        }}
      />

      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-2 opacity-5"
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='white'/%3E%3C/svg%3E")`}} 
      />

      {/* Image Gallery Modal */}
      <ImageGalleryModal 
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        images={allImages}
        initialIndex={imgIndex}
      />

      {/* --- FLOATING NAVBAR --- */}
      <nav className="absolute top-0 left-0 right-0 z-[100] px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-6 flex justify-between items-start pointer-events-none">
       <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 md:gap-3">
  <button 
    onClick={() => router.back()}
    className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all group shadow-2xl active:scale-95"
  >
    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">Return</span>
  </button>

  <Link
  href="/"
  className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 flex items-center justify-center bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95"
>
  <Home className="w-3 h-3 sm:w-4 sm:h-4" />
</Link>
</div>


        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 md:gap-3">
           <button className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 flex items-center justify-center bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all shadow-2xl active:scale-95">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
           </button>
           <div className="bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
              <SaveButton listingId={listing.id} />
           </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="relative my-2 sm:my-4 md:my-5 z-10 pt-12 sm:pt-16 md:pt-20 px-2 sm:px-3 md:px-4 lg:px-8 max-w-[1800px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12">
          
          {/* --- LEFT COLUMN: VISUALS (Cinematic) --- */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4 md:space-y-5">
            
            {/* 1. Main Projector Screen */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setGalleryOpen(true)}
              className="relative aspect-[16/10] w-full bg-[#0a0a0a] rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-lg sm:shadow-2xl md:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] group cursor-pointer"
            >
               {allImages.length > 0 ? (
                 <>
                   <img 
                     src={allImages[imgIndex]} 
                     className="w-full h-full object-cover opacity-90 transition-transform duration-1000 ease-out group-hover:scale-105"
                   />
                   
                   {/* Cinematic Gradient Vignette */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
                   
                   {/* Zoom Icon (on hover/mobile) */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                     <div className="w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center">
                       <ZoomIn className="w-7 sm:w-8 md:w-10 h-7 sm:h-8 md:h-10 text-white" />
                     </div>
                   </div>
                   
                   {/* Navigation Arrows (Hover) */}
                   {allImages.length > 1 && (
                     <div className="absolute inset-0 flex items-center justify-between p-4 sm:p-6 md:p-8 opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollImage('prev');
                          }} 
                          className="pointer-events-auto w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all"
                        >
                          <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollImage('next');
                          }} 
                          className="pointer-events-auto w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:border-red-600 transition-all"
                        >
                          <ChevronRight className="w-5 sm:w-6 h-5 sm:w-6" />
                        </button>
                     </div>
                   )}

                   {/* Tech Overlay: Counter */}
                   <div className="absolute bottom-3 sm:bottom-4 md:bottom-8 right-3 sm:right-4 md:right-8 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 sm:gap-3">
                      <div className="flex gap-0.5 sm:gap-1">
                        {allImages.map((_, i) => (
                          <div key={i} className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${i === imgIndex ? 'bg-red-600' : 'bg-white/20'}`} />
                        ))}
                      </div>
                      <span className="text-[8px] sm:text-[10px] font-bold font-mono tracking-widest border-l border-white/20 pl-2 sm:pl-3 text-white/80">
                        IMG {String(imgIndex + 1).padStart(2, '0')}
                      </span>
                   </div>

                   {/* Mobile: Tap to view indicator */}
                   <div className="absolute top-3 sm:top-4 md:top-8 left-3 sm:left-4 md:left-8 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 sm:gap-3 sm:hidden">
                     <ZoomIn className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                     <span className="text-[8px] font-bold font-mono tracking-widest text-white/80">
                       Tap to View
                     </span>
                   </div>

                   {/* Mobile Thumbnail Strip */}
                   {allImages.length > 1 && (
                     <div className="absolute bottom-16 sm:hidden left-0 right-0 px-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                       {allImages.map((img, i) => (
                         <button
                           key={i}
                           onClick={(e) => {
                             e.stopPropagation();
                             setImgIndex(i);
                           }}
                           className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                             i === imgIndex
                               ? "border-red-600 ring-2 ring-red-600/50"
                               : "border-white/20 hover:border-white/40"
                           }`}
                         >
                           <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                         </button>
                       ))}
                     </div>
                   )}
                 </>
               ) : (
                 <div className="flex items-center justify-center h-full text-white/20 font-mono text-xs uppercase tracking-widest flex-col gap-4">
                    <Box className="w-10 h-10 opacity-20" />
                    <span>No Visual Data Available</span>
                 </div>
               )}
            </motion.div>

            {/* 2. Specs Grid (Data Visualization) */}
           <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 -mt-8 sm:-mt-10 md:-mt-16">

               {[
                 { label: "Category", value: listing.category, icon: Layers },
                 { label: "Condition", value: listing.condition, icon: Box },
                 { label: "Listed", value: new Date(listing.created_at).toLocaleDateString(), icon: Calendar },
                 { label: "Location", value: listing.location, icon: MapPin },
               ].map((item, i) => (
                 <div key={i} className="bg-[#181818] border border-white/5 rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 flex flex-col gap-1.5 sm:gap-2 hover:border-white/20 transition-colors">
                    <item.icon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 text-red-600" />
                    <div className="min-w-0">
                       <p className="text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30">{item.label}</p>
                       <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white mt-0.5 sm:mt-1 truncate">{item.value}</p>
                    </div>
                 </div>
               ))}
            </div>

                               <div className="p-4 sm:p-5 md:p-6 lg:p-8 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2rem] bg-[#1a1a1a]/50">
               <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-black mb-3 sm:mb-4 md:mb-6 tracking-tight text-white/90">Description</h2>
               <div className="prose prose-invert prose-sm md:prose-base lg:prose-lg max-w-none">
                 <p className="text-white/60 font-semibold leading-relaxed whitespace-pre-line text-xs sm:text-sm md:text-base">
                   {listing.description}
                 </p>
               </div>
            </div>

            {/* 3. Description (Typography with Border) */}
            
          </div>

          {/* --- RIGHT: HUD (Sticky Actions) --- */}
          <div className="lg:col-span-4 relative">
             <div className="lg:sticky lg:top-4 md:lg:top-6 lg:lg:top-8 space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
                
                {/* 1. The "Price Ticket" HUD (Fixed Colors) */}
                <div className="bg-[#181818] border border-white/10 rounded-xl sm:rounded-2xl md:rounded-[2rem] lg:rounded-[2.5rem] p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden group shadow-lg sm:shadow-lg md:shadow-xl lg:shadow-2xl">
                   {/* Glowing Top Line */}
                   <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-red-600 via-red-900 to-transparent opacity-80" />
                   
                   <div className="flex justify-between items-start mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                      <div>
                         <p className="text-[7px] sm:text-[9px] md:text-[10px] lg:text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1 sm:mb-1.5 md:mb-2">Valuation</p>
                         <div className="flex items-baseline gap-0.5">
                            <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-light text-white/40">₹</span>
                            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white tracking-tighter">
                              {listing.price.toLocaleString()}
                            </span>
                         </div>
                      </div>
                      {listing.status === "sold" && (
                         <span className="bg-red-600/20 text-red-500 border border-red-600/50 px-2 sm:px-2.5 py-0.5 text-[7px] sm:text-[9px] font-bold uppercase tracking-widest rounded-full">
                            Sold
                         </span>
                      )}
                   </div>

                   <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {listing.status === "sold" ? (
                         <button disabled className="w-full py-2.5 sm:py-3 md:py-4 lg:py-5 bg-[#222] border border-white/5 text-white/30 font-bold text-[9px] sm:text-[10px] md:text-xs lg:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-lg sm:rounded-xl md:rounded-2xl cursor-not-allowed">
                            Acquisition Closed
                         </button>
                      ) : !loading && user && user.id !== listing.user_id ? (
                         <>
                           <button 
                             onClick={() => setOfferModalOpen(true)}
                             className="relative w-full py-2.5 sm:py-3 md:py-4 lg:py-5 bg-red-600 text-white font-black text-[9px] sm:text-[10px] md:text-xs lg:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group"
                           >
                             <DollarSign className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 group-hover:scale-110 transition-transform" />
                             Make Offer
                           </button>
                           <button 
                             onClick={handleMessageClick}
                             className="relative w-full py-2.5 sm:py-3 md:py-4 lg:py-5 bg-white text-black font-black text-[9px] sm:text-[10px] md:text-xs lg:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group"
                           >
                             <MessageSquare className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 group-hover:scale-110 transition-transform" />
                             message
                           </button>
                         </>
                      ) : !loading && user && user.id === listing.user_id ? (
                         <div className="text-center py-3 text-white/50 text-xs">
                           <p>This is your listing</p>
                         </div>
                      ) : (
                         <button 
                           onClick={handleMessageClick}
                           className="relative w-full py-2.5 sm:py-3 md:py-4 lg:py-5 bg-white text-black font-black text-[9px] sm:text-[10px] md:text-xs lg:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-lg sm:rounded-xl md:rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group"
                         >
                           <MessageSquare className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 group-hover:scale-110 transition-transform" />
                           message
                         </button>
                      )}
                      
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30">
                         <Shield className="w-2 sm:w-2.5 md:w-3 h-2 sm:h-2.5 md:h-3" /> Encrypted
                      </div>
                   </div>
                </div>

                {/* 2. Seller Dossier */}
                <div 
                  onClick={handleSellerClick}
                  className="bg-[#121212] border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2.5rem] p-2 sm:p-3 md:p-4 flex items-center gap-2 sm:gap-3 md:gap-4 hover:bg-[#181818] transition-colors group cursor-pointer"
                >
                   <div className="h-10 sm:h-12 md:h-14 lg:h-16 w-10 sm:w-12 md:w-14 lg:w-16 bg-[#222] rounded-lg sm:rounded-xl md:rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center border border-white/5 overflow-hidden group-hover:border-white/20 transition-colors flex-shrink-0">
                      {seller.avatar_url ? (
                         <img src={seller.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         <span className="text-sm sm:text-base md:text-lg lg:text-xl font-serif text-white/40">{seller.name.charAt(0)}</span>
                      )}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                      <p className="text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5 sm:mb-1">Source ID</p>
                       <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                         <h4 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white truncate">{seller.name}</h4>
                         {seller.verified && <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />}
                      </div>
                   </div>

                   <div className="pr-2 sm:pr-3 md:pr-4 flex-shrink-0">
                      <ArrowUpRight className="w-4 sm:w-5 h-4 sm:h-5 text-white/30 group-hover:text-white transition-colors" />
                   </div>
                </div>

                {/* 3. Offers Section (for sellers) */}
                {user && user.id === listing.user_id && (
                  <div className="p-4 sm:p-5 md:p-6 lg:p-8 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-[2rem] bg-[#1a1a1a]/50">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl font-black mb-3 sm:mb-4 md:mb-6 tracking-tight text-white/90 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                      Active Offers
                    </h2>
                    <OffersList
                      offers={offers}
                      userIsOwner={true}
                      onAccept={acceptOffer}
                      onReject={rejectOffer}
                    />
                  </div>
                )}

                {/* 4. Description Section */}
                

                

                {/* 5. Report Link */}
                <div className="text-center">
                   <button className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-red-600 flex items-center justify-center gap-1.5 sm:gap-2 transition-colors py-2 mx-auto">
                      <Flag className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> Report Anomaly
                   </button>
                </div>

             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
  
