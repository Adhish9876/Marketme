"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Camera, Loader2, Save, User, MapPin, Phone, Hash } from "lucide-react";
import Stack from "@/components/fancy/stack";

export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function uploadAvatar(file: File) {
    if (!userId) return null;
    try {
      const filePath = `${userId}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }
      const { data: { publicUrl } } = supabase.storage.from("profile-images").getPublicUrl(filePath);
      console.log("Avatar uploaded:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Avatar upload exception:", err);
      return null;
    }
  }

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setUsername(data.username || "");
        setName(data.name || "");
        setPhone(data.phone || "");
        setCity(data.city || "");
        setCurrentAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleUpdate(e: any) {
    e.preventDefault();
    if (!userId) {
      console.error("No userId found");
      alert("Error: User ID not found");
      return;
    }
    setSaving(true);
    let avatarUrl = currentAvatarUrl;
    
    // Only upload avatar if a new one was selected
    if (avatar) {
      const uploaded = await uploadAvatar(avatar);
      if (uploaded) {
        avatarUrl = uploaded;
      } else {
        console.warn("Avatar upload failed, continuing without avatar update");
        // Continue anyway - don't fail the entire profile update
      }
    }
    
    // Only update fields that have values
    const updateData: any = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (avatarUrl) updateData.avatar_url = avatarUrl;
    
    console.log("Updating with data:", updateData);
    
    const { error, data } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId);
    
    console.log("Update result error:", error);
    console.log("Update result data:", data);
    console.log("User ID being updated:", userId);
    
    // Verify the update by fetching fresh data
    if (!error) {
      const { data: freshData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      console.log("Fresh data from DB after update:", freshData);
    }
    
    setSaving(false);
    
    if (error) {
      console.error("Full update error:", error);
      alert("Error updating profile: " + error.message);
      return;
    }
    
    alert("Profile updated successfully!");
    router.push("/profile");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Stack />
          <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Accessing Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24 font-sans selection:bg-red-600 selection:text-white relative">
      
      {/* Cinematic Noise */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* Navbar */}
       <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/10 py-4 shadow-lg">
              <div className="max-w-4xl mx-10 flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all shadow-sm group">
                  <ArrowLeft className="w-4 mx-0 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">Back</span>
                </button>
            
              </div>
            </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32">
        <div className="bg-[#1a1a1a] border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
            {/* Red Top Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]" />

            <div className="p-8 md:p-12">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Edit Identity</h1>
                    <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Update your public dossier</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-12">
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 bg-black/50 shadow-inner">
                        {avatarPreview ? (
                          <img src={avatarPreview} className="w-full h-full object-cover" />
                        ) : currentAvatarUrl ? (
                          <img src={currentAvatarUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/20">
                            {username ? username[0].toUpperCase() : "U"}
                          </div>
                        )}
                      </div>
                      
                      <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-full scale-95 group-hover:scale-100 border border-white/20 backdrop-blur-sm">
                        <Camera className="w-6 h-6 text-red-500 mb-2" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Upload New</span>
                      </label>
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                  </div>

                  {/* Form Grid */}
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2 group">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                            <Hash className="w-3 h-3" /> Username
                        </label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-red-600 focus:outline-none transition-all font-mono text-sm placeholder:text-white/10"
                          placeholder="username" />
                      </div>

                      <div className="space-y-2 group">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                             <User className="w-3 h-3" /> Display Name
                        </label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-red-600 focus:outline-none transition-all text-xl font-bold placeholder:text-white/10"
                          placeholder="Your Full Name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2 group">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                            <Phone className="w-3 h-3" /> Contact
                        </label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-red-600 focus:outline-none transition-all font-mono text-sm placeholder:text-white/10"
                          placeholder="+91..." />
                      </div>

                      <div className="space-y-2 group">
                         <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 group-focus-within:text-red-500 transition-colors">
                            <MapPin className="w-3 h-3" /> Location
                        </label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-red-600 focus:outline-none transition-all text-base placeholder:text-white/10"
                          placeholder="City, Country" />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-8 flex flex-col md:flex-row items-center gap-4 border-t border-white/10">
                    <button type="button" onClick={() => router.back()}
                      className="w-full md:w-auto px-8 py-4 border border-white/10 bg-white/5 text-white/50 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                      Discard
                    </button>
                    <button type="submit" disabled={saving}
                      className="w-full md:flex-1 py-4 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group">
                      {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                          <><Save className="w-4 h-4 group-hover:scale-110 transition-transform" /> Update Dossier</>
                      )}
                    </button>
                  </div>

                </form>
            </div>
        </div>
      </main>
    </div>
  );
}