"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MessageCircle, X, Send, ArrowLeft, Loader2, Paperclip, Smile, File as FileIcon, MoreVertical, Copy, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginPromptBanner } from "./LoginPromptBanner";

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
  read_at?: string;
  type?: 'text' | 'image' | 'file';
}

// Global instance for external control
let chatWidgetInstance: {
  openChat: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getTotalUnreadCount: () => number;
} | null = null;

export function ChatWidget() {
  // --- STATE ---
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "chat">("list");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [widgetWidth, setWidgetWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  
  // Features State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  // Unread Map
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // CRITICAL: Ref to track active chat instantly without re-render cycles
  const activeChatIdRef = useRef<string | null>(null); 

  // Derived Total
  const totalUnreadCount = Array.from(unreadCounts.values()).reduce((a, b) => a + b, 0);

  // --- EXPOSE GLOBAL INSTANCE ---
  useEffect(() => {
    chatWidgetInstance = {
      openChat: (userId: string) => openChatWithUser(userId),
      getUnreadCount: (userId: string) => unreadCounts.get(userId) || 0,
      getTotalUnreadCount: () => totalUnreadCount,
    };
    return () => { chatWidgetInstance = null; };
  }, [unreadCounts, totalUnreadCount, currentUser]);

  // Sync Active Ref whenever selectedUser changes
  useEffect(() => {
    activeChatIdRef.current = selectedUser?.id || null;
  }, [selectedUser]);

  // --- INITIALIZATION ---
  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    }
    loadCurrentUser();
  }, []);

  // Track mobile/desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // --- UNREAD LOGIC (FIXED) ---
  
  // 1. Fetch Counts from DB (with Guard)
  const fetchUnreadCounts = useCallback(async () => {
    if (!currentUser) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", currentUser.id)
      .is("read_at", null);

    if (msgs) {
      const counts = new Map<string, number>();
      msgs.forEach((msg: any) => {
        // FIX: Ignore unread counts from DB if we are currently looking at that chat
        // This prevents the DB from overwriting our local "0" before the update propogates
        if (msg.sender_id !== activeChatIdRef.current) {
            counts.set(msg.sender_id, (counts.get(msg.sender_id) || 0) + 1);
        }
      });
      setUnreadCounts(counts);
    }
  }, [currentUser]);

  // 2. Mark as Read (UI First)
  const markAsRead = useCallback(async (senderId: string) => {
    if (!currentUser) return;

    // OPTIMISTIC UPDATE: Clear count immediately in UI
    setUnreadCounts(prev => {
        const next = new Map(prev);
        next.set(senderId, 0);
        return next;
    });

    // DB Update in background
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", currentUser.id)
      .eq("sender_id", senderId)
      .is("read_at", null);
  }, [currentUser]);

  // --- REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    if (!currentUser) return;
    
    // Initial Load
    fetchUnreadCounts();
    if(isOpen) loadChatList();

    const channel = supabase.channel(`global_messages_${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new as Message;
         
         // INCOMING MESSAGE
         if (newMsg.receiver_id === currentUser.id) {
             const isChatOpenWithSender = isOpen && activeChatIdRef.current === newMsg.sender_id;
             
             if (isChatOpenWithSender) {
                 // If chat is open, mark read immediately
                 markAsRead(newMsg.sender_id);
                 // Push to message list if view is 'chat'
                 if (currentView === 'chat') {
                     setMessages(prev => [...prev, newMsg]);
                     scrollToBottom();
                 }
             } else {
                 // Chat closed or elsewhere: Refresh counts (will increment)
                 fetchUnreadCounts();
             }
             
             // Refresh list order
             if (currentView === 'list') loadChatList();
         }
         
         // OUTGOING MESSAGE (Sync across tabs)
         if (newMsg.sender_id === currentUser.id) {
             if (currentView === 'chat' && activeChatIdRef.current === newMsg.receiver_id) {
                  setMessages(prev => {
                      if (prev.some(m => m.id === newMsg.id)) return prev;
                      return [...prev, newMsg];
                  });
                  scrollToBottom();
             }
             if (currentView === 'list') loadChatList();
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, isOpen, currentView, markAsRead, fetchUnreadCounts, scrollToBottom]);


  // --- DATA LOADING HELPERS ---
  async function loadChatList() {
    setLoading(true);
    const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (msgs && msgs.length > 0) {
        const ids = new Set<string>();
        msgs.forEach((m: any) => {
            if (m.sender_id !== currentUser.id) ids.add(m.sender_id);
            if (m.receiver_id !== currentUser.id) ids.add(m.receiver_id);
        });

        if (ids.size > 0) {
            const { data: profiles } = await supabase.from("profiles").select("*").in("id", Array.from(ids));
            setChatUsers(profiles || []);
        }
    }
    setLoading(false);
  }

  const openChatWithUser = async (targetId: string) => {
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) { setShowLoginPrompt(true); return; }
    if (!currentUser) setCurrentUser(sessionUser);

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", targetId).single();
    if (profile) {
        handleSelectUser(profile);
        setIsOpen(true);
    }
  };

  const handleSelectUser = async (user: ChatUser) => {
    setSelectedUser(user);
    setCurrentView("chat");
    activeChatIdRef.current = user.id; // Update ref immediately
    
    // Clear editor and content state
    if (editableRef.current) {
      editableRef.current.innerHTML = '';
    }
    setHasContent(false);
    
    // Clear unread immediately
    markAsRead(user.id);

    // Load Messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    scrollToBottom();
  };

  // --- MESSAGE SENDING ---
  const handleSendMessage = async () => {
    if (!editableRef.current || !selectedUser || !currentUser) return;
    
    const editableContent = editableRef.current;
    
    // Extract images and text separately
    const imageElements = Array.from(editableContent.querySelectorAll('img'));
    const base64Images = imageElements.map((img: any) => img.dataset.base64 || img.src);
    
    console.log('Sending message - Found images:', base64Images.length);
    
    // Get text by cloning and removing images
    const clone = editableContent.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('img').forEach(img => img.remove());
    const textContent = clone.textContent?.trim() || '';
    
    // Must have something to send
    if (!textContent && base64Images.length === 0) return;

    setShowEmojiPicker(false);

    // Send text message if it exists
    if (textContent) {
      console.log('Sending text message:', textContent);
      await sendMessageToDb(textContent);
    }

    // Upload and send each image as a separate message
    for (let i = 0; i < base64Images.length; i++) {
      const base64 = base64Images[i];
      console.log(`Uploading image ${i + 1}/${base64Images.length}`);
      const imageUrl = await uploadImageToStorage(base64);
      if (imageUrl) {
        console.log(`Image ${i + 1} uploaded, sending message with URL`);
        await sendMessageToDb(imageUrl);
      } else {
        console.error(`Failed to upload image ${i + 1}`);
      }
    }

    // Clear editor after sending
    editableContent.innerHTML = '';
    setHasContent(false);
  };

  const sendMessageToDb = async (content: string) => {
    if (!selectedUser || !currentUser) return;

    const tempId = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    const { data, error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: content,
    }).select();

    if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (data && data[0]) {
        setMessages(prev => prev.map(m => m.id === tempId ? data[0] : m));
    }
  };

  // --- FEATURES ---
  const uploadImageToStorage = async (base64: string): Promise<string | null> => {
    try {
      // Extract base64 data
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      
      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'image/png' });
      const fileName = `chat_${currentUser.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      
      // Upload to storage
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, blob, { 
          cacheControl: '3600', 
          upsert: false 
        });
      
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      
      if (!data) {
        console.error('No data returned from upload');
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData?.publicUrl || null;
      console.log('Image uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Storage upload failed:', err);
      return null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                insertImageIntoEditor(base64);
            };
            reader.readAsDataURL(file);
        } else {
            insertTextIntoEditor(`[FILE: ${file.name}]`);
        }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertImageIntoEditor = (base64: string) => {
    if (!editableRef.current) return;
    
    const img = document.createElement('img');
    img.src = base64;
    img.className = 'max-w-[100px] max-h-[120px] rounded-lg object-cover inline-block mx-1 align-middle cursor-pointer hover:opacity-80 transition-opacity';
    img.style.margin = '4px';
    img.style.display = 'inline-block';
    img.contentEditable = 'false';
    img.dataset.base64 = base64;
    
    // Add delete on click
    img.addEventListener('click', (e) => {
      e.preventDefault();
      img.remove();
      updateContentState();
      editableRef.current?.focus();
    });
    
    editableRef.current?.appendChild(img);
    updateContentState();
    editableRef.current?.focus();
  };

  const updateContentState = () => {
    if (!editableRef.current) return;
    const hasText = (editableRef.current.textContent?.trim() ?? "").length > 0;
    const hasImages = editableRef.current.querySelector('img') !== null;
    setHasContent(hasText || hasImages);
  };

  const insertTextIntoEditor = (text: string) => {
    if (!editableRef.current) return;
    const selection = window.getSelection();
    if (selection?.rangeCount === 0) return;
    
    const range = selection?.getRangeAt(0);
    const textNode = document.createTextNode(text);
    range?.insertNode(textNode);
    range?.setStartAfter(textNode);
    range?.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range!);
    
    editableRef.current?.focus();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if(file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            insertImageIntoEditor(base64);
        };
        reader.readAsDataURL(file);
    }
  };

  const addEmoji = (emoji: string) => {
    if (!editableRef.current) return;
    insertTextIntoEditor(emoji);
    editableRef.current.focus();
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if it's an image type
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        
        if (file) {
          try {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              insertImageIntoEditor(base64);
            };
            reader.readAsDataURL(file);
          } catch (err) {
            console.error('File read error:', err);
          }
        }
        break;
      }
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX + 24;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidgetWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      <LoginPromptBanner 
        isVisible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message="SECURE CHANNEL: LOGIN REQUIRED"
      />

      <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className={`z-50 bg-[#121212] shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden flex flex-col font-sans ${
            isMobile 
              ? 'fixed inset-0 rounded-none' 
              : 'fixed bottom-24 right-6 rounded-[30px]'
          }`}
          style={isMobile ? { width: '100%', height: '100vh' } : { width: `${widgetWidth}px`, height: '650px' }}
        >
          {/* Resize Handle - Left Side (Desktop Only) */}
          {!isMobile && (
            <div
              onMouseDown={handleMouseDown}
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600/50 to-transparent hover:from-red-600 cursor-col-resize transition-all hover:w-2 z-50"
            />
          )}
          {/* Cinematic Noise */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]" 
               style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}} 
          />
          
          {/* VIEW: LIST */}
          {currentView === "list" && (
            <>
              {/* Header */}
              <div className="relative z-10 bg-[#121212] border-b border-white/10 px-6 py-5 flex items-center justify-between">
                <div>
                   <h2 className="text-sm font-black text-white uppercase tracking-widest">Active Comms</h2>
                   <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
                      <p className="text-[10px] text-zinc-500 font-mono tracking-wider">SECURE NET</p>
                   </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide bg-[#0a0a0a]">
                 {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                       <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                       <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">DECRYPTING...</p>
                    </div>
                 ) : chatUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                       <div className="w-20 h-20 border border-dashed border-zinc-700 rounded-full flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-zinc-500" />
                       </div>
                       <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">NO SIGNALS DETECTED</p>
                    </div>
                 ) : (
                    chatUsers.map((user) => {
                       const count = unreadCounts.get(user.id) || 0;
                       return (
                         <button key={user.id} onClick={() => handleSelectUser(user)} className="w-full flex items-center gap-4 px-6 py-5 hover:bg-[#181818] transition-all border-b border-white/5 group text-left">
                            <div className="relative">
                               {user.avatar_url ? (
                                  <img src={user.avatar_url} className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10 group-hover:border-red-600/50" />
                               ) : (
                                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-600 font-bold group-hover:text-white transition-all">{user.username?.[0]}</div>
                               )}
                               {count > 0 && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] z-10 border border-[#0a0a0a]">
                                     {count}
                                  </span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-red-500 transition-colors truncate">{user.username || "Agent"}</h3>
                            </div> 
                         </button>
                       )
                    })
                 )}
              </div>
            </>
          )}

          {/* VIEW: CHAT */}
          {currentView === "chat" && (
            <>
               {/* Chat Header */}
               <div className="relative z-20 bg-[#121212] border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-3">
                     <button onClick={() => { setCurrentView("list"); setSelectedUser(null); }} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div className="flex items-center gap-3">
                        {selectedUser?.avatar_url ? (
                           <img src={selectedUser.avatar_url} className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                        ) : (
                           <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 font-bold">{selectedUser?.username?.[0]}</div>
                        )}
                        <div>
                           <h3 className="text-xs font-bold text-white uppercase tracking-widest">{selectedUser?.username || "TARGET"}</h3>
                           <p className="text-[9px] text-red-600 font-mono tracking-widest uppercase animate-pulse">SECURE LINK</p>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
               </div>

               {/* Messages */}
               <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-4 bg-[#0a0a0a]">
                  {messages.map((msg, i) => {
                     const isMe = msg.sender_id === currentUser?.id;
                     const isDeleted = msg.content === "[DELETED]";
                     
                     return (
                        <div key={i} className={`group flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                           {/* Three Dot Menu - Left for me, Right for others */}
                           {isMe && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button
                                   onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                   className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                                 >
                                   <MoreVertical className="w-4 h-4" />
                                 </button>
                              </div>
                           )}
                           
                           <div className="relative group">
                              <div className={`px-3 py-2 text-xs font-medium leading-relaxed border backdrop-blur-md relative ${
                                 isDeleted
                                 ? "bg-zinc-900/50 border-zinc-700 text-zinc-400 italic rounded-lg"
                                 : isMe 
                                 ? "bg-red-900/20 border-red-900/40 text-red-100 rounded-lg rounded-tr-sm shadow-[0_0_10px_rgba(220,38,38,0.1)]" 
                                 : "bg-[#181818] border-white/10 text-zinc-300 rounded-lg rounded-tl-sm"
                              }`}>
                                 {isDeleted ? (
                                    <p>This message has been deleted</p>
                                 ) : (msg.content.includes('supabase.co') || msg.content.includes('data:image')) ? (
                                     <div className="overflow-hidden rounded-lg">
                                       <img 
                                         src={msg.content} 
                                         alt="Chat image"
                                         className="max-w-[200px] max-h-[300px] rounded-lg object-cover" 
                                         onError={(e) => {
                                           console.error('Image failed to load:', msg.content);
                                           (e.target as HTMLImageElement).style.display = 'none';
                                         }}
                                       />
                                     </div>
                                 ) : msg.content.startsWith("[FILE:") ? (
                                     <div className="flex items-center gap-2 text-white/70 italic">
                                         <FileIcon className="w-3 h-3 text-red-500" /> <span>{msg.content}</span>
                                     </div>
                                 ) : (
                                     <p className="mb-1">{msg.content}</p>
                                 )}
                                 
                                 {/* Time Stamp */}
                                 {!isDeleted && (
                                    <div className="flex justify-end items-center gap-1 opacity-40">
                                      <span className="text-[7px] font-mono uppercase tracking-wider">
                                          {new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                                      </span>
                                      {isMe && <span className="text-[7px] text-red-500 font-bold">✓</span>}
                                    </div>
                                 )}
                              </div>
                              
                              {/* Three Dot Menu - Right side for others */}
                              {!isMe && !isDeleted && (
                                 <div className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                      className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                 </div>
                              )}
                           </div>
                           
                           {/* Dropdown Menu */}
                           <AnimatePresence>
                           {openMenuId === msg.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 mt-1 bg-[#1a1a1a] border border-zinc-700 rounded-lg shadow-lg z-50 text-xs"
                              >
                                 <button
                                   onClick={() => {
                                     navigator.clipboard.writeText(msg.content);
                                     setOpenMenuId(null);
                                   }}
                                   className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-zinc-300 hover:text-white rounded-t-lg"
                                 >
                                   <Copy className="w-3 h-3" /> Copy
                                 </button>
                                 {isMe && (
                                    <button
                                      onClick={async () => {
                                        await supabase
                                          .from("messages")
                                          .update({ content: "[DELETED]" })
                                          .eq("id", msg.id);
                                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: "[DELETED]" } : m));
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-900/30 transition-colors text-zinc-300 hover:text-red-400 rounded-b-lg border-t border-zinc-700"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                 )}
                              </motion.div>
                           )}
                           </AnimatePresence>
                        </div>
                     )
                  })}
                  <div ref={messagesEndRef} />
               </div>

               {/* Emoji Picker Overlay */}
               <AnimatePresence>
               {showEmojiPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-20 left-4 z-30 bg-[#1a1a1a] border border-white/10 p-3 rounded-xl grid grid-cols-6 gap-2 shadow-2xl"
                  >
                     {['👍','🔥','❤️','😂','😮','👋','💀','🤝','💸','👀','✅','🛑'].map(emoji => (
                        <button key={emoji} onClick={() => addEmoji(emoji)} className="text-xl hover:bg-white/10 rounded p-1 transition-colors">{emoji}</button>
                     ))}
                  </motion.div>
               )}
               </AnimatePresence>

               {/* Input Area */}
               <div className="relative z-20 bg-[#121212] border-t border-white/10 px-4 py-4">
                  <div className="flex items-end gap-2">
                     <div className="flex gap-1 mb-3">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                           <Smile className="w-5 h-5" />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                           <Paperclip className="w-5 h-5" />
                        </button>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                     </div>
                     
                     <div 
                       className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-xl flex items-start min-h-[50px] mb-1 focus-within:border-red-900/50 transition-colors hover:border-white/20 p-2"
                       onDragOver={handleDragOver}
                       onDrop={handleDrop}
                     >
                        <div 
                           ref={editableRef}
                           contentEditable
                           suppressContentEditableWarning
                           onInput={updateContentState}
                           onChange={updateContentState}
                           onPaste={(e) => {
                             handlePaste(e);
                             setTimeout(updateContentState, 10);
                           }}
                           onKeyPress={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               handleSendMessage();
                             }
                           }}
                           className="w-full bg-transparent text-white text-xs font-mono px-2 py-2 focus:outline-none resize-none max-h-[120px] overflow-y-auto [&:empty]:before:content-['Type...'] [&:empty]:before:text-zinc-700"
                           style={{
                             wordWrap: 'break-word',
                             whiteSpace: 'pre-wrap',
                             wordBreak: 'break-word'
                           }}
                        />
                     </div>
                     
                     <button 
                        onClick={() => handleSendMessage()}
                        disabled={!hasContent}
                        className={`p-3 rounded-xl mb-1 transition-all ${
                           hasContent
                           ? "bg-red-600 text-white hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                           : "bg-zinc-900 text-zinc-700 border border-zinc-800 cursor-not-allowed"
                        }`}
                     >
                        <Send className="w-5 h-5" />
                     </button>
                  </div>
               </div>
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Floating Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`chat-toggle fixed bottom-6 right-6 z-50 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-red-500/20 transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 group ${
            isMobile ? "w-11 h-11" : "w-14 h-14"
          }`}
        >
          <MessageCircle className={`${isMobile ? "w-5 h-5" : "w-6 h-6"} group-hover:animate-pulse`} />
          {totalUnreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 bg-white text-black font-black rounded-full flex items-center justify-center shadow-lg border-2 border-black ${
              isMobile ? "text-[9px] w-4 h-4" : "text-[10px] w-5 h-5"
            }`}>
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </button>
      )}
    </>
  );
}

// --- EXPORTED FUNCTIONS FOR EXTERNAL USE ---
export function openChatWithSeller(sellerId: string) {
  if (chatWidgetInstance) {
    chatWidgetInstance.openChat(sellerId);
  } else {
    console.warn("ChatWidget not initialized yet");
  }
}

export function getUnreadCount(userId: string): number {
  return chatWidgetInstance?.getUnreadCount(userId) || 0;
}

export function getTotalUnreadCount(): number {
  return chatWidgetInstance?.getTotalUnreadCount() || 0;
}