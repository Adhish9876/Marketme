"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, X, Send, ArrowLeft, Loader2, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatUser {
  id: string;
  username: string;
  avatar_url?: string;
  name?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const chatListChannelRef = useRef<any>(null);

  // Initialize and load current user
  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    }
    loadCurrentUser();
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Load chat users when widget opens
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    async function loadChatUsers() {
      setLoading(true);
      
      // Get all messages involving current user
      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (msgs && msgs.length > 0) {
        // Get unique user IDs from messages
        const userIds = new Set<string>();
        msgs.forEach((msg: any) => {
          if (msg.sender_id !== currentUser.id) userIds.add(msg.sender_id);
          if (msg.receiver_id !== currentUser.id) userIds.add(msg.receiver_id);
        });

        // Fetch user profiles
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, name")
            .in("id", Array.from(userIds));

          setChatUsers(profiles || []);
        }
      }

      setLoading(false);
    }

    loadChatUsers();

    // Subscribe to new messages for the chat list
    if (chatListChannelRef.current) {
      chatListChannelRef.current.unsubscribe();
    }

    chatListChannelRef.current = supabase
      .channel(`messages_list_${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUser.id},receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          loadChatUsers();
        }
      )
      .subscribe();

    return () => {
      if (chatListChannelRef.current) {
        chatListChannelRef.current.unsubscribe();
      }
    };
  }, [isOpen, currentUser]);

  // Load messages when user is selected
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    async function loadMessages() {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser!.id}),and(sender_id.eq.${selectedUser!.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      scrollToBottom();
    }

    loadMessages();

    // Unsubscribe from previous channel if it exists
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Subscribe to new messages for this conversation
    const uniqueId = `${[currentUser.id, selectedUser.id].sort().join('_')}`;
    channelRef.current = supabase
      .channel(`messages_${uniqueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Check if message belongs to this conversation
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedUser.id) ||
            (newMsg.sender_id === selectedUser.id && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages((prev) => {
              const exists = prev.some(m => m.id === newMsg.id);
              if (exists) return prev;
              return [...prev, newMsg];
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [selectedUser, currentUser, scrollToBottom]);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    setCurrentView("chat");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    // Send to database
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: messageContent,
      })
      .select();

    if (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setNewMessage(messageContent);
    } else if (data && data[0]) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data[0] : m))
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <AnimatePresence>
      {/* Chat Window */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-[#121212] rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col font-sans"
        >
          {/* Cinematic Noise */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
               style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
          />

          {currentView === "list" ? (
            <>
              {/* List Header */}
              <div className="relative z-10 bg-[#121212] border-b border-white/10 px-5 py-4 flex items-center justify-between">
                <div>
                   <h2 className="text-sm font-black text-white uppercase tracking-widest">Transmissions</h2>
                   <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>
                      <p className="text-[10px] text-zinc-500 font-mono">ONLINE</p>
                   </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Users List */}
              <div className="relative z-10 flex-1 overflow-y-auto bg-[#0a0a0a]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                    <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">Scanning...</p>
                  </div>
                ) : chatUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                    <div className="w-16 h-16 border border-dashed border-zinc-700 rounded-full flex items-center justify-center">
                       <MessageCircle className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div className="text-zinc-500 text-xs text-center px-4 font-mono uppercase tracking-wide">
                      No active channels found.
                    </div>
                  </div>
                ) : (
                  chatUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#1a1a1a] transition-all border-b border-white/5 group text-left"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10 group-hover:border-red-600/50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 font-bold group-hover:text-white group-hover:border-red-600/50 transition-all">
                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                           <span className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_5px_red]" />
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide group-hover:text-red-500 transition-colors truncate">
                          {user.username || user.name || "Unknown Agent"}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 group-hover:text-zinc-400">SECURE CONNECTION</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              {/* Chat Header */}
              <div className="relative z-10 bg-[#121212] border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentView("list");
                      setSelectedUser(null);
                      setMessages([]);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white border border-transparent hover:border-white/10"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                     {selectedUser?.avatar_url ? (
                       <img
                         src={selectedUser.avatar_url}
                         alt={selectedUser.username}
                         className="w-8 h-8 rounded-md object-cover border border-white/10"
                       />
                     ) : (
                       <div className="w-8 h-8 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 font-bold text-xs">
                         {selectedUser?.username?.charAt(0)?.toUpperCase() || "?"}
                       </div>
                     )}
                     <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          {selectedUser?.username || selectedUser?.name || "Target"}
                        </h3>
                        <p className="text-[9px] text-red-500 font-mono tracking-widest uppercase">Encrypted</p>
                     </div>
                  </div>
                </div>
                
                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                   <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="relative z-0 flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#0a0a0a]">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full opacity-30">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Channel Open</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isFromMe = msg.sender_id === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-3 text-xs font-medium leading-relaxed border backdrop-blur-sm ${
                              isFromMe
                                ? "bg-red-900/20 border-red-900/50 text-red-100 rounded-2xl rounded-tr-sm"
                                : "bg-zinc-900 border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-sm"
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="relative z-10 bg-[#121212] border-t border-white/10 px-4 py-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="TRANSMIT DATA..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-[#050505] border border-white/10 text-white text-xs font-mono rounded-lg px-4 py-3 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900/50 transition-all placeholder:text-zinc-700"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-lg transition-all ${
                      newMessage.trim()
                        ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                        : "bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      )}
    </>
  );
}