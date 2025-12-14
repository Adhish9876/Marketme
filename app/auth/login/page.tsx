"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Get redirect URL from query params, or go to home
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] font-sans selection:bg-red-600 selection:text-white relative overflow-hidden">
      
      {/* Cinematic Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      <div className="max-w-lg w-full relative z-10 px-6">
        
        {/* Card */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
           {/* Top Accent */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]" />

           <div className="text-center mb-10">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Welcome Back</h1>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Identify yourself to continue</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2 group">
               <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                 Email Address
               </label>
               <input
                 type="email"
                 placeholder="agent@market.me"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                 required
               />
             </div>

             <div className="space-y-2 group">
               <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                 Password
               </label>
               <input
                 type="password"
                 placeholder="••••••••"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                 required
               />
             </div>

             <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8 group"
             >
               {loading ? (
                 <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
               ) : (
                 <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
               )}
             </button>

             <div className="text-center pt-4">
               <p className="text-white/40 text-xs">
                 No credentials?{" "}
                 <span
                   className="text-red-500 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                   onClick={() => router.push("/auth/register")}
                 >
                   Register Access
                 </span>
               </p>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
}