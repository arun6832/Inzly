import { X, ExternalLink, MapPin, Heart, Eye, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { MapIdea } from "@/lib/geoUtils";
import { useAuth } from "@/lib/AuthContext";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORY_COLORS: Record<string, string> = {
    "AI/ML": "#6366f1",
    "FinTech": "#10b981",
    "HealthTech": "#f43f5e",
    "EdTech": "#f59e0b",
    "SaaS": "#a855f7",
    "CleanTech": "#14b8a6",
    "AgriTech": "#84cc16",
    "Social": "#ec4899",
};

interface Props {
    idea: MapIdea | null;
    onClose: () => void;
}

export default function IdeaPreviewCard({ idea, onClose }: Props) {
    const router = useRouter();
    const { user } = useAuth();
    const [authorScore, setAuthorScore] = useState<number | null>(null);
    
    useEffect(() => {
        if (idea?.userId) {
            const fetchScore = async () => {
                const uSnap = await getDoc(doc(db, "users", idea.userId));
                if (uSnap.exists()) {
                    setAuthorScore(uSnap.data().trustScore || 100);
                }
            };
            fetchScore();
        } else {
            setAuthorScore(null);
        }
    }, [idea?.userId]);
    
    const isProblem = idea?.type === 'problem';
    const color = idea ? (isProblem ? "#a855f7" : (CATEGORY_COLORS[idea.category] || "#6366f1")) : "#6366f1";

    const isOwner = user?.uid === idea?.userId;

    const handleMessage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            router.push("/login");
            return;
        }
        if (!idea) return;
        
        try {
            const { getOrCreateChat } = await import("@/lib/messaging");
            const chatId = await getOrCreateChat(user.uid, idea.userId);
            router.push(`/messages/${chatId}`);
        } catch (err) {
            console.error("Failed to start chat:", err);
        }
    };

    return (
        <AnimatePresence>
            {idea && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[1000]"
                >
                    <div
                        className="relative rounded-3xl overflow-hidden shadow-2xl"
                        style={{
                            background: "rgba(13, 13, 24, 0.95)",
                            backdropFilter: "blur(24px)",
                            border: `1px solid ${color}40`,
                        }}
                    >
                        {/* Glow accent */}
                        <div
                            className="absolute top-0 left-0 w-full h-1"
                            style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                        />

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${
                                                isProblem ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                            }`}
                                        >
                                            {isProblem ? 'Crisis / Problem' : idea.category}
                                        </span>
                                        {idea.city && (
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                                <MapPin className="w-3 h-3 text-zinc-700" />
                                                {idea.city}
                                            </span>
                                        )}
                                        {authorScore !== null && (
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-black text-zinc-500">
                                                <div className={`w-1 h-1 rounded-full ${authorScore >= 90 ? 'bg-green-500' : 'bg-indigo-500'}`} />
                                                {authorScore}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-tight truncate tracking-tight">{idea.title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl bg-white/5 text-zinc-600 hover:text-white transition-all flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content preview */}
                            <div className="relative mb-6">
                                <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed font-medium">
                                    {idea.idea}
                                </p>
                            </div>

                            {/* Stats + CTA */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    {!isProblem ? (
                                        <>
                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                <Heart className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-bold">{idea.likesCount || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-500">
                                                <Eye className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-bold">{idea.views || 0}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">High Severity</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    {!isOwner && (
                                        <button
                                            onClick={handleMessage}
                                            className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-lg"
                                            title="Message Architect"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    )}
                                    <Link
                                        href={isProblem ? `/create?problemId=${idea.id}` : `/idea/${idea.id}`}
                                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-xl transition-all shadow-lg ${
                                            isProblem 
                                            ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-500/20' 
                                            : 'bg-white text-black hover:bg-zinc-200 shadow-white/10'
                                        }`}
                                    >
                                        {isProblem ? 'Solve Problem' : 'Refine Hub'} 
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
