"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Camera, Loader2, UserPlus } from "lucide-react";
import { Suspense } from "react";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function uploadAvatar(file: File, userId: string) {
    const filePath = `${userId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.log(uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleRegister(e: any) {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    setLoading(true);

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Upload avatar and create profile
    if (data.user) {
      let avatarUrl = null;
      
      if (avatar) {
        avatarUrl = await uploadAvatar(avatar, data.user.id);
      }

      console.log("Creating profile for user:", data.user.id);

      const { error: profileError, data: profileData } = await supabase.from("profiles").insert([{
        id: data.user.id,
        username: username.trim(),
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        avatar_url: avatarUrl,
      }]).select();

      if (profileError) {
        console.error("Profile creation error:", profileError);
        console.error("Error code:", profileError.code);
        console.error("Error details:", profileError);
        alert("Error creating profile: " + profileError.message);
        setLoading(false);
        return;
      }
      
      console.log("Profile created successfully:", profileData);
    }

    //alert("Registration successful! Please check your email to verify your account.");
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] font-sans selection:bg-red-600 selection:text-white relative overflow-hidden py-12 w-50px">
      
      {/* Cinematic Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      <div className="max-w-lg w-full relative z-10 px-6">
        
        {/* Main Card */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
           {/* Top Red Accent Line */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]" />

           <div className="text-center mb-10">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Initialize</h1>
              <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Create new seller identity</p>
           </div>

           <form onSubmit={handleRegister} className="space-y-6">
             
             {/* Avatar Circle */}
             <div className="flex flex-col items-center">
               <div className="relative group">
                 <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-black/50 shadow-inner">
                   {avatarPreview ? (
                     <img src={avatarPreview} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white/20">
                       {username ? username.charAt(0).toUpperCase() : "?"}
                     </div>
                   )}
                 </div>
                 
                 <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full scale-95 group-hover:scale-100 border border-white/20 backdrop-blur-sm">
                   <Camera className="w-5 h-5 text-red-500 mb-1" />
                   <span className="text-[6px] font-bold text-white uppercase tracking-widest">Upload</span>
                 </label>
                 <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
               </div>
               <p className="text-[10px] font-mono text-white/30 mt-3 uppercase tracking-widest">Set Profile Image</p>
             </div>

             {/* Username */}
             <div className="space-y-2 group">
               <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                 Username
               </label>
               <input
                 type="text"
                 placeholder="Codename"
                 value={username}
                 onChange={e => setUsername(e.target.value)}
                 className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                 required
               />
             </div>

             {/* Full Name */}
             <div className="space-y-2 group">
               <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                 Full Name
               </label>
               <input
                 type="text"
                 placeholder="Your full name"
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
               />
             </div>

             {/* Email */}
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

             {/* Phone & City Grid */}
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                     Phone
                   </label>
                   <input
                     type="tel"
                     placeholder="+91 98765 43210"
                     value={phone}
                     onChange={e => setPhone(e.target.value)}
                     className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                   />
                 </div>

                 <div className="space-y-2 group">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                     City
                   </label>
                   <input
                     type="text"
                     placeholder="Mumbai"
                     value={city}
                     onChange={e => setCity(e.target.value)}
                     className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                   />
                 </div>
             </div>

             {/* Password Grid */}
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                     Password
                   </label>
                   <input
                     type="password"
                     placeholder="••••••"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                     required
                   />
                 </div>

                 <div className="space-y-2 group">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                     Confirm
                   </label>
                   <input
                     type="password"
                     placeholder="••••••"
                     value={confirmPassword}
                     onChange={e => setConfirmPassword(e.target.value)}
                     className="w-full bg-transparent border-b border-white/10 py-3 text-white placeholder:text-white/10 focus:border-red-600 focus:outline-none transition-all font-mono text-sm"
                     required
                   />
                 </div>
             </div>

             {/* Submit Button */}
             <button
               type="submit"
               disabled={loading}
               className="w-full py-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-8 group"
             >
               {loading ? (
                 <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
               ) : (
                 <>Create Account <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" /></>
               )}
             </button>

             {/* Footer Link */}
             <div className="text-center pt-4">
               <p className="text-white/40 text-xs">
                 Existing operative?{" "}
                 <span
                   className="text-red-500 font-bold uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                   onClick={() => {
                     const redirect = searchParams.get("redirect");
                     if (redirect) {
                       router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
                     } else {
                       router.push("/auth/login");
                     }
                   }}
                 >
                   Sign In
                 </span>
               </p>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#121212]"><div className="text-white">Loading...</div></div>}>
      <RegisterContent />
    </Suspense>
  );
}