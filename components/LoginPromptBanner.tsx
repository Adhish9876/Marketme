"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, ArrowRight, Lock } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface LoginPromptBannerProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPromptBanner({ 
  isVisible, 
  onClose, 
  message = "Authentication required for secure comms." 
}: LoginPromptBannerProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    console.log("LoginPromptBanner: isVisible=true, setting auto-dismiss timer");
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 right-6 z-[9999] w-auto max-w-sm pointer-events-auto"
        >
          {/* Main Card */}
          <div className="relative bg-[#121212] border border-white/10 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] overflow-hidden">
            
            {/* Cinematic Noise Texture inside banner */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                 style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
            />
            
            {/* Red Accent Glow */}
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600/10 blur-[40px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4">
              
              {/* Icon Container */}
              <div className="flex-shrink-0 w-10 h-10 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-500" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 font-medium truncate">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
                  }}
                  className="group px-4 py-2 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-1 shadow-lg"
                >
                  Login <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}