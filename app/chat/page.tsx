"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MessageSquare, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatListPage() {
  const router = useRouter();
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());

  async function loadChats() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    const map = new Map();
    const uniqueUserIds = new Set<string>();

    data.forEach(msg => {
      const other = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!map.has(other)) {
        map.set(other, msg);
        uniqueUserIds.add(other);
      }
    });

    if (uniqueUserIds.size > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(uniqueUserIds));

      if (profilesData) {
        const profileMap = new Map();
        profilesData.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
        setProfiles(profileMap);
      }
    }

    setConvos([...map.values()]);
    setLoading(false);
  }

  useEffect(() => {
    loadChats();

    // Real-time subscription for new messages
    const channel = supabase
      .channel('chat_list_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Check if the new message involves the current user
          const { data: { user } } = await supabase.auth.getUser();
          if (user && (payload.new.sender_id === user.id || payload.new.receiver_id === user.id)) {
             loadChats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-600 rounded-full animate-spin"/>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">SCANNING FREQUENCIES...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] font-sans selection:bg-red-600 selection:text-white relative pb-20">
      
      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* Header */}
      <div className="bg-[#121212]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-6 sticky top-0 z-10 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
             <h1 className="text-lg font-black text-white uppercase tracking-wider">Comms</h1>
             <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Active Channels: {convos.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ONLINE</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-4 relative z-0">
        {convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-center opacity-40">
            <div className="w-24 h-24 border border-dashed border-zinc-600 rounded-full flex items-center justify-center mb-6">
               <MessageSquare className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">Silence Detected</h3>
            <p className="text-xs font-mono text-zinc-500">NO ACTIVE TRANSMISSIONS FOUND.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {convos.map((msg, i) => {
              const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
              const profile = profiles.get(otherId);
              const isFromMe = msg.sender_id === userId;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={msg.id}
                  onClick={() => router.push(`/chat/${otherId}`)}
                  className="bg-[#0a0a0a] border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900 group shadow-sm flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-zinc-700"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-lg">
                        {profile?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                       <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-red-500 transition-colors truncate">
                        {profile?.name || "Unknown Agent"}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-600 flex-shrink-0">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate font-medium flex items-center gap-1">
                      {isFromMe && <span className="text-red-500 font-mono text-[10px] uppercase">YOU:</span>}
                      {msg.content}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}