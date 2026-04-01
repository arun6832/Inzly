"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToChats, Chat } from "@/lib/messaging";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { MessageSquare, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MessagesDashboard() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToChats(user.uid, async (updatedChats) => {
            // Enhance chats with user details
            const enhancedChats = await Promise.all(updatedChats.map(async (chat) => {
                const otherUid = chat.participants.find(p => p !== user.uid);
                if (otherUid) {
                    const userDoc = await getDoc(doc(db, "users", otherUid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        return {
                            ...chat,
                            otherUser: {
                                name: userData.name || "Unknown User",
                                username: userData.username || "unknown",
                                id: otherUid
                            }
                        };
                    }
                }
                return chat;
            }));
            setChats(enhancedChats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredChats = chats.filter(chat => 
        chat.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-[#0B0B0F] pt-24 pb-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white tracking-tight">Messages</h1>
                        <p className="text-zinc-500 font-medium tracking-wide uppercase text-[10px]">Professional Network Hub</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Find founder..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white/[0.03] border-white/5 text-white rounded-full h-10 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-3">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-24 bg-[#121218] border border-white/[0.04] rounded-[32px] space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <MessageSquare className="w-8 h-8 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-xl">No active streams</p>
                                <p className="text-zinc-500 max-w-xs mx-auto mt-2">Start a discussion with a founder from the discovery feed.</p>
                            </div>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <Link 
                                key={chat.id} 
                                href={`/messages/${chat.id}`}
                                className="group block p-5 bg-[#121218] border border-white/[0.04] hover:border-white/10 rounded-2xl transition-all hover:bg-white/[0.02]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors shrink-0">
                                        <User className="w-7 h-7 text-zinc-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-white font-bold truncate pr-2">
                                                {chat.otherUser?.name}
                                                <span className="ml-2 text-indigo-400/60 font-medium text-xs">@{chat.otherUser?.username}</span>
                                            </h3>
                                            <span className="text-[10px] text-zinc-600 font-bold uppercase shrink-0">
                                                {chat.updatedAt?.toDate ? new Date(chat.updatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-zinc-400 text-sm truncate pr-8">
                                            {chat.lastMessageSender === user?.uid && <span className="text-zinc-600 mr-1.5 font-bold uppercase text-[10px]">You:</span>}
                                            {chat.lastMessage}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
