"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, BookmarkPlus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DiscussionSection from "@/components/DiscussionSection";

interface Idea {
    id: string;
    title: string;
    problem: string;
    idea: string;
    category: string;
    userId: string;
}

export default function IdeaDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [ideaData, setIdeaData] = useState<Idea | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const ideaId = params.id as string;

    useEffect(() => {
        const fetchIdea = async () => {
            try {
                const docRef = doc(db, "ideas", ideaId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setIdeaData({ id: docSnap.id, ...docSnap.data() } as Idea);
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
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08]">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08]">
                            <BookmarkPlus className="w-4 h-4" />
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

                            <div className="pt-8 mt-8 border-t border-white/[0.04] space-y-4">
                                <Button className="w-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full h-12 font-bold shadow-lg shadow-purple-500/20">
                                    Ask a Question
                                </Button>
                                <Button variant="outline" className="w-full text-zinc-300 border-white/[0.08] hover:bg-white/[0.04] rounded-full h-12 font-semibold">
                                    Join Discussion
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Discussion / Comments Section */}
                <div className="pt-16 mt-16 mb-24">
                    <h2 className="text-3xl font-extrabold text-white mb-10 text-left">Discussion</h2>
                    <DiscussionSection ideaId={ideaId} />
                </div>
            </div>
        </div>
    );
}
