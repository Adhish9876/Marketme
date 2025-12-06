"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send, MoreVertical, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserId(user.id);

    // Load other user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.userId)
      .maybeSingle();

    setOtherUser(profile);

    // Load messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);
    
    setTimeout(scrollToBottom, 100);
  }

  useEffect(() => {
    loadData();

    // Set up real-time subscription
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender_id === userId && newMsg.receiver_id === params.userId) ||
            (newMsg.sender_id === params.userId && newMsg.receiver_id === userId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [params.userId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !userId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: params.userId,
      content: messageContent,
    });

    if (error) {
      alert("Error sending transmission");
      setNewMessage(messageContent);
      return;
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#121212] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-red-600 rounded-full animate-spin"/>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">ESTABLISHING LINK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#121212] flex flex-col font-sans selection:bg-red-600 selection:text-white relative overflow-hidden">
      
      {/* Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035]" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
      />

      {/* --- HEADER --- */}
      <div className="relative z-10 bg-[#121212]/90 backdrop-blur-md border-b border-zinc-800 py-4 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/chat")}
            className="p-2 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.username}
                  className="w-10 h-10 rounded-lg object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-zinc-500 font-bold text-sm">
                  {otherUser?.username?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#121212] rounded-full flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {otherUser?.username || "Unknown Agent"}
              </h2>
              <p className="text-[10px] text-red-500 font-mono tracking-widest uppercase">Encrypted Connection</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* --- MESSAGES AREA --- */}
      <div className="relative z-0 flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#0a0a0a]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
            <div className="w-20 h-20 border border-dashed border-zinc-600 rounded-full flex items-center justify-center mb-4">
               <div className="w-2 h-2 bg-zinc-600 rounded-full animate-ping" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Channel Open</h3>
            <p className="text-[10px] font-mono text-zinc-500">BEGIN TRANSMISSION</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isFromMe = msg.sender_id === userId;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-3 max-w-[80%] md:max-w-md ${isFromMe ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isFromMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-5 py-3 text-sm font-medium leading-relaxed shadow-lg backdrop-blur-sm border ${
                          isFromMe
                            ? "bg-red-900/20 border-red-900/50 text-red-100 rounded-2xl rounded-tr-sm"
                            : "bg-zinc-900 border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                      
                      {/* Time Stamp */}
                      <span className="text-[9px] font-mono text-zinc-600 mt-1 px-1 uppercase tracking-wider">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="absolute bottom-24 left-6 z-20">
          <div className="flex items-center gap-1 bg-black/50 border border-zinc-800 px-3 py-1.5 rounded-full backdrop-blur-md">
            <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></span>
            <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
            <span className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase ml-2">Incoming Data...</span>
          </div>
        </div>
      )}

      {/* --- INPUT AREA --- */}
      <div className="relative z-10 bg-[#121212] border-t border-zinc-800 px-6 py-5 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ENTER MESSAGE..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="w-full pl-5 pr-12 py-4 bg-[#050505] border border-zinc-800 rounded-xl focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all text-sm font-mono text-white placeholder:text-zinc-700 shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <div className="w-1 h-1 bg-zinc-700 rounded-full" />
               <div className="w-1 h-1 bg-zinc-700 rounded-full" />
               <div className="w-1 h-1 bg-zinc-700 rounded-full" />
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`p-4 rounded-xl transition-all shadow-lg flex items-center justify-center group ${
              newMessage.trim()
                ? "bg-red-600 text-white hover:bg-red-700 hover:shadow-red-900/30"
                : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
            }`}
          >
            <Send className={`w-5 h-5 ${newMessage.trim() ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5" : ""} transition-transform`} />
          </button>
        </div>
      </div>
    </div>
  );
}