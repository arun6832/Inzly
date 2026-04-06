"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, BookmarkPlus } from "lucide-react";
import { Github } from "@/components/icons";
import { useAuth } from "@/lib/AuthContext";
import DiscussionSection from "@/components/DiscussionSection";

interface Idea {
    id: string;
    title: string;
    idea: string;
    category: string;
    userId: string;
    likesCount?: number;
    views?: number;
    githubUrl?: string;
    authorUsername?: string;
}

export default function IdeaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [ideaData, setIdeaData] = useState<Idea | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    const [hasSaved, setHasSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const ideaId = params.id as string;

    useEffect(() => {
        const fetchIdea = async () => {
            try {
                const docRef = doc(db, "ideas", ideaId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    
                    // Fetch author username
                    const authorRef = doc(db, "users", data.userId);
                    const authorSnap = await getDoc(authorRef);
                    const authorUsername = authorSnap.exists() ? authorSnap.data().username : "unknown";

                    setIdeaData({ 
                        id: docSnap.id, 
                        ...data,
                        authorUsername,
                        views: (data.views || 0) + 1 // Optimistically show the new view
                    } as Idea);
                    
                    // Increment views count in DB
                    const { updateDoc, increment } = await import("firebase/firestore");
                    // We catch the error so it doesn't break the page load if it fails
                    updateDoc(docRef, { views: increment(1) }).catch(e => console.error("Failed to update views", e));
                } else {
                    setError("Idea not found.");
                }
            } catch {
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
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 bg-[#050507]">
                <h2 className="text-2xl font-light text-white">{error || "Asset not found"}</h2>
                <Button onClick={() => router.push("/")} className="bg-white text-black rounded-lg px-6 font-medium">
                    Return to Evaluation
                </Button>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-[#050507]">
            <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
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
                    <div className="inline-flex items-center px-4 py-1.5 rounded-lg text-xs font-bold bg-white/[0.03] text-zinc-400 border border-white/[0.05] uppercase tracking-widest">
                        {ideaData.category}
                    </div>
                    {ideaData.authorUsername && (
                        <button 
                            onClick={() => router.push(`/user/${ideaData.authorUsername}`)}
                            className="inline-flex items-center ml-4 px-3 py-1.5 rounded-lg text-[10px] font-black bg-white/[0.02] text-zinc-500 border border-white/[0.03] hover:border-white/10 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Builder: @{ideaData.authorUsername}
                        </button>
                    )}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-tight">
                        {ideaData.title}
                    </h1>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    <div className="md:col-span-2 space-y-12">
                        {/* The Idea */}
                        <section className="space-y-6">
                            <div className="p-8 sm:p-12 rounded-[32px] bg-[#0a0a0c] border border-white/[0.04] shadow-2xl relative overflow-hidden group">
                                <p className="text-lg sm:text-xl text-zinc-300 leading-relaxed sm:leading-[1.8] whitespace-pre-wrap relative z-10 font-light mix-blend-screen">
                                    {ideaData.idea}
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        {/* Sidebar info */}
                        <div className="p-8 rounded-[24px] bg-[#0a0a0c] border border-white/[0.04] shadow-xl sticky top-24">
                            <div>
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                    Evaluation State
                                </h3>
                                <div className="inline-flex items-center px-3 py-1 bg-white/[0.05] text-zinc-300 rounded-lg font-medium text-sm border border-white/[0.05]">
                                    <span className="w-2 h-2 rounded-full bg-zinc-400 mr-2" />
                                    Active Review
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                    Metrics
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center text-zinc-300 bg-white/[0.02] border border-white/[0.05] px-3 py-1.5 rounded-lg">
                                        <span className="text-zinc-500 mr-2 text-xs font-bold">VIEWS</span>
                                        <span className="font-medium text-sm">{ideaData.views || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {ideaData.githubUrl && (
                                <div className="mt-6 pt-6 border-t border-white/[0.04]">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                                        Open Source
                                    </h3>
                                    <a 
                                        href={ideaData.githubUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
                                                <Github className="w-5 h-5 text-zinc-300" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white leading-tight">GitHub Repo</p>
                                                <p className="text-[10px] text-zinc-500 font-medium">Execution Baseline</p>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    </a>
                                </div>
                            )}

                            <div className="pt-8 mt-8 border-t border-white/[0.04] space-y-4">
                                <Button 
                                    onClick={async () => {
                                        if (!user) {
                                            router.push('/login');
                                            return;
                                        }
                                        if (user.uid === ideaData.userId) {
                                            alert("This is your own idea. Visit Messages to see your chats.");
                                            return;
                                        }
                                        const { getOrCreateChat } = await import("@/lib/messaging");
                                        const chatId = await getOrCreateChat(user.uid, ideaData.userId);
                                        router.push(`/messages/${chatId}`);
                                    }}
                                    className="w-full bg-white text-black hover:bg-zinc-200 rounded-full h-12 font-bold shadow-lg"
                                >
                                    Message Founder
                                </Button>
                                <Button 
                                    onClick={() => document.getElementById('discussion')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="w-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.05] rounded-xl h-12 font-medium"
                                >
                                    Query Execution
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion / Comments Section */}
                <div id="discussion" className="pt-16 mt-16 mb-24 max-w-3xl mx-auto border-t border-white/[0.05]">
                    <h2 className="text-3xl font-light text-white mb-2 text-center">Refinement Board</h2>
                    <p className="text-zinc-500 text-sm text-center mb-10">Challenge the model, outline the risks, identify friction.</p>
                    <DiscussionSection ideaId={ideaId} />
                </div>
            </div>
        </div>
    );
}
