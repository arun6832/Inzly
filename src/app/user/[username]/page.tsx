"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { User, MapPin, Heart, Lightbulb, ChevronRight, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface UserProfile {
    id: string;
    name: string;
    username: string;
    bio?: string;
    country: string;
    totalLikes: number;
}

interface Idea {
    id: string;
    title: string;
    category: string;
    problem: string;
    likesCount: number;
    views: number;
}

export default function ProfilePage() {
    const params = useParams() as { username: string };
    const { user: currentUser } = useAuth();
    const router = useRouter();
    
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfileAndIdeas = async () => {
            try {
                // 1. Fetch User by username
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("username", "==", params.username.toLowerCase()));
                const snap = await getDocs(q);

                if (snap.empty) {
                    setError("Builder not found.");
                    setLoading(false);
                    return;
                }

                const userData = snap.docs[0].data() as UserProfile;
                userData.id = snap.docs[0].id; // Ensure ID is correct
                setProfile(userData);

                // 2. Fetch User's Ideas
                const ideasRef = collection(db, "ideas");
                const ideasQ = query(
                    ideasRef, 
                    where("userId", "==", userData.id),
                    orderBy("createdAt", "desc")
                );
                const ideasSnap = await getDocs(ideasQ);
                const ideasList: Idea[] = [];
                ideasSnap.forEach(doc => {
                    const data = doc.data();
                    ideasList.push({
                        id: doc.id,
                        title: data.title,
                        category: data.category,
                        problem: data.problem,
                        likesCount: data.likesCount || 0,
                        views: data.views || 0
                    });
                });
                setIdeas(ideasList);
            } catch (err) {
                console.error("Profile fetch failed", err);
                setError("Failed to load profile details.");
            } finally {
                setLoading(false);
            }
        };

        if (params.username) {
            fetchProfileAndIdeas();
        }
    }, [params.username]);

    const handleMessage = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }
        if (currentUser.uid === profile?.id) return;

        const { getOrCreateChat } = await import("@/lib/messaging");
        const chatId = await getOrCreateChat(currentUser.uid, profile!.id);
        router.push(`/messages/${chatId}`);
    };

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-[#0B0B0F]">
                <h2 className="text-2xl font-bold text-white">{error || "Something went wrong"}</h2>
                <Button onClick={() => router.push("/")} className="bg-white text-black rounded-full px-6">
                    Go Home
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-[#0B0B0F] pt-24 pb-20 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => router.back()}
                    className="flex items-center text-zinc-500 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent" />
                            
                            <div className="relative z-10 text-center space-y-6">
                                <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-xl">
                                    <User className="w-12 h-12 text-zinc-400" />
                                </div>
                                
                                <div>
                                    <h1 className="text-2xl font-black text-white px-2 leading-tight">{profile.name}</h1>
                                    <p className="text-indigo-400 font-bold text-sm tracking-tight mt-1">@{profile.username}</p>
                                </div>

                                {profile.bio && (
                                    <p className="text-zinc-400 text-sm leading-relaxed px-4 italic">
                                        "{profile.bio}"
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-4 py-4 border-y border-white/5">
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg">{ideas.length}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ideas</p>
                                    </div>
                                    <div className="w-px h-8 bg-white/5" />
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg">{profile.totalLikes}</p>
                                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Impact</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-center gap-2 text-zinc-500 font-medium text-xs">
                                        <MapPin className="w-3 h-3" />
                                        {profile.country}
                                    </div>

                                    {currentUser?.uid !== profile.id && (
                                        <Button 
                                            onClick={handleMessage}
                                            className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-12 font-bold flex items-center justify-center gap-2"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Message Builder
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Industrial List Portfolio */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/5 pb-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Lightbulb className="w-6 h-6 text-yellow-500/60" />
                                Portfolio
                            </h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {ideas.length} Posted
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {ideas.length === 0 ? (
                                <div className="py-20 text-center bg-[#121218] border border-white/[0.04] rounded-[32px] space-y-4">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                        <Lightbulb className="w-6 h-6 text-zinc-700" />
                                    </div>
                                    <p className="text-zinc-500 font-medium">No ideas posted to the community yet.</p>
                                </div>
                            ) : (
                                ideas.map((idea, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idea.id}
                                    >
                                        <Link 
                                            href={`/idea/${idea.id}`}
                                            className="group block p-6 bg-[#121218] border border-white/[0.04] hover:border-white/10 rounded-[28px] transition-all hover:bg-white/[0.02] relative"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-2 flex-1 pr-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-widest rounded-md">
                                                            {idea.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                                        {idea.title}
                                                    </h3>
                                                    <p className="text-sm text-zinc-500 line-clamp-1 italic font-medium">
                                                        "{idea.problem}"
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center gap-6 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="w-4 h-4 text-red-500/40" />
                                                        <span className="text-white/80 font-bold text-sm tracking-tight">{idea.likesCount}</span>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-zinc-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
