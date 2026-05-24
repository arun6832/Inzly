"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Heart, MessageSquare, Check, X, Clock, TrendingUp, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InvestorMatchRequest {
    id: string;
    investorId: string;
    investorName: string;
    investorUsername: string;
    thinkerId: string;
    ideaId: string;
    ideaTitle: string;
    status: 'pending' | 'approved';
    createdAt: any;
}

export default function LikesPage() {
    const { user, loading: authLoading, userMode } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState<InvestorMatchRequest[]>([]);

    // Redirect to login if unauthenticated or wrong role
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/login");
            } else if (userMode !== 'sparker' && userMode !== 'builder') {
                router.push("/dashboard");
            }
        }
    }, [user, authLoading, userMode, router]);

    useEffect(() => {
        if (authLoading || !user || (userMode !== 'sparker' && userMode !== 'builder')) return;

        const fetchLikes = async () => {
            try {
                const matchesQ = query(collection(db, "matches"), where("thinkerId", "==", user.uid));
                const matchesSnap = await getDocs(matchesQ);
                const matchesList = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as InvestorMatchRequest));
                setLikes(matchesList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            } catch (err) {
                console.error("Likes fetch failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLikes();
    }, [user, authLoading, userMode]);

    const handleAcceptMatch = async (match: InvestorMatchRequest) => {
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
            await sendMessage(chatId, user!.uid, `Hello! We connected on my idea: "${match.ideaTitle}". Let's discuss details!`);

            setLikes(prev => prev.map(r => r.id === match.id ? { ...r, status: "approved" } : r));
            alert("Connection Approved! Chat thread initialized.");
        } catch (e) {
            console.error("Failed to accept match", e);
        }
    };

    const handleDismissMatch = async (matchId: string) => {
        try {
            await deleteDoc(doc(db, "matches", matchId));
            setLikes(prev => prev.filter(r => r.id !== matchId));
            alert("Match request dismissed.");
        } catch (e) {
            console.error("Failed to dismiss match", e);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-black min-h-screen nothing-grid">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Syncing Investor Signals...</span>
            </div>
        );
    }

    const pendingLikes = likes.filter(l => l.status === 'pending');
    const approvedLikes = likes.filter(l => l.status === 'approved');

    return (
        <div className="flex-1 min-h-screen bg-black pt-28 pb-20 px-4 sm:px-6 nothing-grid relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] pointer-events-none z-0 nothing-radial-glow opacity-40" />
            
            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                
                {/* ─── Navigation & Title ─── */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                        className="text-zinc-500 hover:text-white rounded-none hover:bg-white/5 -ml-4 font-mono font-bold uppercase tracking-[0.2em] text-[10px] border border-transparent hover:border-white/10 px-3 py-1 h-9 w-fit animate-fade-in"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 mr-2" />
                        To Studio
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-lg shrink-0">
                            <Heart className="w-6 h-6 text-purple-400 fill-purple-400/20 animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black font-dot tracking-tight text-white uppercase">Investor Likes</h1>
                            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mt-1">Manage connection requests and project validation highlights.</p>
                        </div>
                    </div>
                </div>

                {/* ─── Active Pending Likes Section ─── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0" />
                        <h2 className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-[0.4em]">Pending Requests ({pendingLikes.length})</h2>
                    </div>

                    {pendingLikes.length === 0 ? (
                        <div className="py-20 text-center bg-[#09090D]/50 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10 z-10 relative">
                                <Clock className="w-5 h-5 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 font-mono tracking-widest uppercase text-[9px] z-10 relative">Your validation queue is empty.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence initial={false}>
                                {pendingLikes.map(match => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                        key={match.id} 
                                        className="p-6 rounded-2xl bg-[#09090D]/90 border border-purple-500/10 hover:border-purple-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                                        <div className="flex items-start gap-5 relative z-10 font-mono">
                                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border border-purple-500/20 bg-purple-950/20 text-purple-400 rounded">
                                                        Investor connection
                                                    </span>
                                                    <span className="text-[8px] font-bold text-zinc-500 uppercase">Idea: {match.ideaTitle}</span>
                                                </div>
                                                <h3 className="text-base font-bold text-white mt-1">
                                                    {match.investorName}{" "}
                                                    <Link href={`/user/${match.investorUsername}`} className="text-pink-400 hover:text-pink-300 underline font-mono text-xs ml-1">
                                                        @{match.investorUsername}
                                                    </Link>
                                                </h3>
                                                <p className="text-xs text-zinc-400 mt-2 font-sans leading-relaxed">
                                                    Wants to connect and discuss investment or validation details on your startup concept.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 relative z-10 shrink-0 self-end sm:self-center">
                                            <Button 
                                                onClick={() => handleAcceptMatch(match)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-500 h-10 px-5 rounded-xl font-sans font-semibold text-xs transition-all shadow-lg hover:shadow-purple-500/10"
                                            >
                                                <Check className="w-3.5 h-3.5 mr-1.5" /> Accept Match
                                            </Button>
                                            <Button 
                                                variant="ghost"
                                                onClick={() => handleDismissMatch(match.id)}
                                                className="bg-transparent hover:bg-red-500/5 text-red-400 border border-red-500/10 hover:border-red-500/30 h-10 px-3.5 rounded-xl font-sans font-semibold text-xs transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* ─── Established Matches / Connections Section ─── */}
                <div className="space-y-6 pt-6 border-t border-white/[0.04]">
                    <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <h2 className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-[0.4em]">Established Connections ({approvedLikes.length})</h2>
                    </div>

                    {approvedLikes.length === 0 ? (
                        <div className="py-12 text-center bg-[#09090D]/30 rounded-2xl border border-white/5 space-y-3">
                            <p className="text-zinc-600 font-mono tracking-widest uppercase text-[9px]">No verified connections yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {approvedLikes.map(match => (
                                <div 
                                    key={match.id} 
                                    className="p-6 rounded-2xl bg-[#09090D] border border-border flex items-center justify-between gap-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
                                >
                                    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.01] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                                    <div className="flex-1 min-w-0 font-mono text-left">
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">
                                            ✓ Active Channel
                                        </p>
                                        <h3 className="text-base font-bold text-white truncate">
                                            {match.investorName}
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 mt-1 uppercase truncate">
                                            @{match.investorUsername} • {match.ideaTitle}
                                        </p>
                                    </div>
                                    <Link href={`/messages`} className="shrink-0 relative z-10">
                                        <Button 
                                            size="icon"
                                            className="w-10 h-10 rounded-xl bg-white/[0.03] hover:bg-purple-600 border border-white/10 hover:border-purple-500 hover:text-white transition-all text-zinc-400"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
