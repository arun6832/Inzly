"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { subscribeToChats, Chat } from "@/lib/messaging";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MessagesDashboard() {
    const { user, loading: authLoading, userMode } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [matchRequests, setMatchRequests] = useState<any[]>([]);

    // Redirect to login if unauthenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Fetch pending Investor match requests for Thinkers
    useEffect(() => {
        if (authLoading || !user || userMode !== 'sparker') return;

        const fetchMatches = async () => {
            try {
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const matchQ = query(collection(db, "matches"), where("thinkerId", "==", user.uid), where("status", "==", "pending"));
                const snap = await getDocs(matchQ);
                setMatchRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Match fetch failed", e);
            }
        };

        fetchMatches();
    }, [user, authLoading, userMode]);

    const handleAcceptMatch = async (match: any) => {
        try {
            const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
            // 1. Update match status
            await updateDoc(doc(db, "matches", match.id), {
                status: "approved",
                updatedAt: serverTimestamp()
            });

            // 2. Update the idea document's isAccepted flag
            await updateDoc(doc(db, "ideas", match.ideaId), {
                isAccepted: true
            });

            // 3. Initiate Chat
            const { getOrCreateChat, sendMessage } = await import("@/lib/messaging");
            const chatId = await getOrCreateChat(user!.uid, match.investorId);
            
            // Send intro message
            await sendMessage(chatId, user!.uid, `Hello! We matched on my idea: "${match.ideaTitle}". Let's connect!`);

            setMatchRequests(prev => prev.filter(r => r.id !== match.id));
            alert("Match Accepted! Communication channels initialized.");
            window.location.reload();
        } catch (e) {
            console.error("Failed to accept match", e);
        }
    };

    const handleDismissMatch = async (matchId: string) => {
        try {
            const { doc, deleteDoc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "matches", matchId));
            setMatchRequests(prev => prev.filter(r => r.id !== matchId));
        } catch (e) {
            console.error("Failed to dismiss match", e);
        }
    };

    useEffect(() => {
        if (authLoading || !user) return;

        const unsubscribe = subscribeToChats(user.uid, async (updatedChats) => {
            // Sort chats on the client side by updatedAt (descending) to avoid index requirements
            const sortedChats = [...updatedChats].sort((a, b) => {
                const timeA = (a.updatedAt as any)?.toDate ? (a.updatedAt as any).toDate().getTime() : 
                              (a.updatedAt as any)?.seconds ? (a.updatedAt as any).seconds * 1000 : 0;
                const timeB = (b.updatedAt as any)?.toDate ? (b.updatedAt as any).toDate().getTime() : 
                              (b.updatedAt as any)?.seconds ? (b.updatedAt as any).seconds * 1000 : 0;
                return timeB - timeA;
            });

            // Enhance chats with user details
            const enhancedChats = await Promise.all(sortedChats.map(async (chat) => {
                const otherUid = chat.participants?.find(p => p !== user.uid);
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
    }, [user, authLoading]);

    const filteredChats = chats.filter(chat => 
        chat.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-background">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 relative nothing-grid">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Pending Match Requests Panel */}
                {userMode === 'sparker' && matchRequests.length > 0 && (
                    <div className="p-6 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl space-y-4 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                            <h2 className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Pending Swipes & Matches ({matchRequests.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {matchRequests.map(req => (
                                <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            Investor{" "}
                                            {req.investorUsername ? (
                                                <Link 
                                                    href={`/user/${req.investorUsername}`}
                                                    className="text-pink-500 hover:text-pink-400 font-bold font-mono mr-1 underline"
                                                >
                                                    @{req.investorUsername}
                                                </Link>
                                            ) : (
                                                req.investorName
                                            )}{" "}
                                            wants to connect / discuss your idea
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 font-mono">Matched on: &ldquo;{req.ideaTitle}&rdquo;</p>
                                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-sans max-w-md">
                                            Accepting will open a private chat room to discuss collaboration or investment.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAcceptMatch(req)}
                                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition-colors shadow-sm cursor-pointer"
                                        >
                                            Accept Match
                                        </button>
                                        <button
                                            onClick={() => handleDismissMatch(req.id)}
                                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Messages</h1>
                        <p className="text-muted-foreground font-medium tracking-wide uppercase text-[10px]">Professional Network Hub</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Find founder..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted border-border text-foreground rounded-xl h-10 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-3">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-24 bg-card border border-border rounded-2xl space-y-4 shadow-sm">
                            <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center mx-auto border border-border">
                                <MessageSquare className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-foreground font-bold text-xl">No active streams</p>
                                <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">Start a discussion with a founder from the discovery feed.</p>
                            </div>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <Link 
                                key={chat.id} 
                                href={`/messages/${chat.id}`}
                                className="group block p-5 bg-card border border-border hover:border-indigo-500/30 rounded-2xl transition-all hover:bg-muted/50 shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:border-muted-foreground/30 transition-colors shrink-0">
                                        <User className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-foreground font-bold truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {chat.otherUser?.name}
                                                <span className="ml-2 text-indigo-500/60 dark:text-indigo-400/60 font-medium text-xs">@{chat.otherUser?.username}</span>
                                            </h3>
                                            <span className="text-[10px] text-muted-foreground font-bold uppercase shrink-0 font-mono">
                                                {(chat.updatedAt as any)?.toDate ? new Date((chat.updatedAt as any).toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-sm truncate pr-8 font-medium">
                                            {chat.lastMessageSender === user?.uid && <span className="text-indigo-500 dark:text-indigo-400 mr-1.5 font-black uppercase text-[10px]">You:</span>}
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
