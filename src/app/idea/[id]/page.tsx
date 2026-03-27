"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, BookmarkPlus, Heart } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DiscussionSection from "@/components/DiscussionSection";

interface Idea {
    id: string;
    title: string;
    problem: string;
    idea: string;
    category: string;
    userId: string;
    likesCount?: number;
    views?: number;
}

export default function IdeaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [ideaData, setIdeaData] = useState<Idea | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Engagement states
    const [hasLiked, setHasLiked] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);
    const [liking, setLiking] = useState(false);
    const [saving, setSaving] = useState(false);

    const ideaId = params.id as string;

    useEffect(() => {
        const fetchIdea = async () => {
            try {
                const docRef = doc(db, "ideas", ideaId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setIdeaData({ id: docSnap.id, ...docSnap.data() } as Idea);
                    
                    // Increment views count
                    const { updateDoc, increment } = await import("firebase/firestore");
                    // We catch the error so it doesn't break the page load if it fails
                    updateDoc(docRef, { views: increment(1) }).catch(e => console.error("Failed to update views", e));
                } else {
                    setError("Idea not found.");
                }
            } catch (err: any) {
                setError("Failed to load idea.");
            } finally {
                setLoading(false);
            }
        };

        if (ideaId) {
            fetchIdea();
        }
    }, [ideaId]);

    // Check if user has already liked/saved this idea
    useEffect(() => {
        if (!user || !ideaId) return;

        const checkInteractionStatus = async () => {
            const { collection, query, where, getDocs } = await import("firebase/firestore");
            
            try {
                // Check saved
                const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid), where("ideaId", "==", ideaId));
                const savedSnap = await getDocs(savedQ);
                if (!savedSnap.empty) setHasSaved(true);

                // Check liked
                const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid), where("ideaId", "==", ideaId));
                const likedSnap = await getDocs(likedQ);
                if (!likedSnap.empty) setHasLiked(true);
            } catch (err) {
                console.error("Failed to fetch interaction status", err);
            }
        };

        checkInteractionStatus();
    }, [user, ideaId]);

    const handleSave = async () => {
        if (!user || hasSaved || saving) return;
        setSaving(true);
        setHasSaved(true);
        try {
            const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
            await addDoc(collection(db, "savedIdeas"), {
                userId: user.uid,
                ideaId,
                createdAt: serverTimestamp()
            });
        } catch (err) {
            console.error(err);
            setHasSaved(false);
        } finally {
            setSaving(false);
        }
    };

    const handleLike = async () => {
        if (!user || hasLiked || liking) return;
        setLiking(true);
        setHasLiked(true);
        
        // Optimistic UI Update
        setIdeaData(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : prev);

        try {
            const { addDoc, collection, serverTimestamp, doc, updateDoc, increment } = await import("firebase/firestore");
            
            await addDoc(collection(db, "likes"), {
                userId: user.uid,
                ideaId,
                createdAt: serverTimestamp()
            });

            // Increment the counter on the idea document
            const ideaRef = doc(db, "ideas", ideaId);
            await updateDoc(ideaRef, { likesCount: increment(1) });
            
            // Increment the author's total likes
            if (ideaData?.userId) {
                const authorRef = doc(db, "users", ideaData.userId);
                updateDoc(authorRef, { totalLikes: increment(1) }).catch(e => console.error("Author likes err", e));
            }
        } catch (err) {
            console.error(err);
            setHasLiked(false);
            setIdeaData(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) - 1 } : prev);
        } finally {
            setLiking(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: ideaData?.title || "Inzly Idea",
                url: window.location.href
            }).catch(e => console.error(e));
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    if (loading) {
        return <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
            <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        </div>;
    }

    if (error || !ideaData) {
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
        <div className="flex-1 overflow-y-auto bg-[#0B0B0F] scroll-smooth">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-zinc-400 hover:text-white rounded-full hover:bg-white/5 -ml-4"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back
                    </Button>

                    <div className="flex items-center space-x-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleShare}
                            className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08]"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleSave}
                            disabled={hasSaved}
                            className={`rounded-full bg-white/[0.03] hover:bg-white/[0.08] transition-colors ${hasSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-white'}`}
                        >
                            <BookmarkPlus className={`w-4 h-4 ${hasSaved ? 'fill-indigo-400' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="space-y-6">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest">
                        {ideaData.category}
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
                        {ideaData.title}
                    </h1>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    <div className="md:col-span-2 space-y-12">
                        {/* The Problem */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-extrabold text-white flex items-center">
                                <span className="w-10 h-10 rounded-2xl bg-[#121218] border border-white/10 flex items-center justify-center mr-4 text-sm text-zinc-400 shadow-sm">1</span>
                                The Problem
                            </h2>
                            <div className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                <p className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap relative z-10">
                                    {ideaData.problem}
                                </p>
                            </div>
                        </section>

                        {/* The Solution */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-extrabold text-white flex items-center">
                                <span className="w-10 h-10 rounded-2xl bg-[#121218] border border-white/10 flex items-center justify-center mr-4 text-sm text-zinc-400 shadow-sm">2</span>
                                The Solution
                            </h2>
                            <div className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                <p className="text-lg text-white leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
                                    {ideaData.idea}
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar info */}
                        <div className="p-8 rounded-[32px] bg-[#121218] border border-white/[0.04] shadow-xl sticky top-24">
                            <div>
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                    Status
                                </h3>
                                <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-semibold text-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                                    Active Discussion
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                    Engagement
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <button 
                                        onClick={handleLike}
                                        disabled={hasLiked || liking}
                                        className={`flex items-center px-3 py-1.5 rounded-full transition-colors ${hasLiked ? 'bg-red-500/10 text-red-400' : 'text-zinc-300 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <Heart className={`w-4 h-4 mr-2 ${hasLiked ? 'fill-red-400 text-red-400' : 'text-red-400'}`} />
                                        <span className="font-semibold">{ideaData.likesCount || 0}</span>
                                    </button>
                                    <div className="flex items-center text-zinc-300 bg-white/5 px-3 py-1.5 rounded-full">
                                        <span className="mr-2">👁️</span>
                                        <span className="font-semibold">{ideaData.views || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 mt-8 border-t border-white/[0.04] space-y-4">
                                <Button 
                                    onClick={() => document.getElementById('discussion')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full h-12 font-bold shadow-lg shadow-purple-500/20"
                                >
                                    Ask a Question
                                </Button>
                                <Button 
                                    onClick={() => document.getElementById('discussion')?.scrollIntoView({ behavior: 'smooth' })}
                                    variant="outline" 
                                    className="w-full text-zinc-300 border-white/[0.08] hover:bg-white/[0.04] rounded-full h-12 font-semibold"
                                >
                                    Join Discussion
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion / Comments Section */}
                <div id="discussion" className="pt-16 mt-16 mb-24">
                    <h2 className="text-3xl font-extrabold text-white mb-10 text-left">Discussion</h2>
                    <DiscussionSection ideaId={ideaId} />
                </div>
            </div>
        </div>
    );
}
