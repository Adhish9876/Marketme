"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

    // Load profiles for all users
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm text-gray-600">Online</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {convos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-sm text-gray-500">Start chatting with sellers or buyers!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {convos.map(msg => {
              const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
              const profile = profiles.get(otherId);
              const isFromMe = msg.sender_id === userId;
              
              return (
                <div
                  key={msg.id}
                  className="px-6 py-4 hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-4"
                  onClick={() => router.push(`/chat/${otherId}`)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || profile.username}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {profile?.username?.charAt(0).toUpperCase() || profile?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {profile?.name || "Unknown User"}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {isFromMe && <span className="text-blue-600 font-medium">You: </span>}
                      {msg.content}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!isFromMe && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
