"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";

interface Idea {
    id: string;
    title: string;
    problem: string;
    category: string;
}

export default function SavedIdeasPage() {
    const { user, loading } = useAuth();
    const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!user) {
            setFetching(false);
            return;
        }

        const fetchSaved = async () => {
            try {
                const q = query(
                    collection(db, "savedIdeas"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );

                const snapshot = await getDocs(q);
                const ideasData: Idea[] = [];

                for (const savedDoc of snapshot.docs) {
                    const ideaId = savedDoc.data().ideaId;
                    const ideaRef = doc(db, "ideas", ideaId);
                    const ideaSnap = await getDoc(ideaRef);

                    if (ideaSnap.exists()) {
                        const data = ideaSnap.data();
                        ideasData.push({
                            id: ideaSnap.id,
                            title: data.title,
                            problem: data.problem,
                            category: data.category,
                        });
                    }
                }

                setSavedIdeas(ideasData);
            } catch (err) {
                console.error("Failed to fetch saved ideas", err);
            } finally {
                setFetching(false);
            }
        };

        fetchSaved();
    }, [user]);

    if (loading || fetching) {
        return <div className="flex-1 flex justify-center items-center bg-[#0B0B0F]">
            <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        </div>;
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0B0B0F]">
                <h2 className="text-2xl font-bold text-white mb-4">Please log in to view your saved ideas.</h2>
                <Link href="/login">
                    <Button className="bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full px-8">Log In</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0B0B0F] px-4 py-8 relative">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex items-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mr-4">
                        <Bookmark className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Saved Ideas</h1>
                        <p className="text-zinc-400 mt-1">Ideas you swiped right on.</p>
                    </div>
                </div>

                {savedIdeas.length === 0 ? (
                    <div className="text-center py-24 bg-[#121218] rounded-[32px] border border-white/[0.02]">
                        <h2 className="text-xl font-bold text-white mb-2">No saved ideas yet</h2>
                        <p className="text-zinc-500 mb-6">Start discovering ideas and swipe right to save them.</p>
                        <Link href="/">
                            <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 h-12 font-bold shadow-lg transition-transform hover:scale-105">Discover Ideas</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedIdeas.map((idea) => (
                            <div key={idea.id} className="bg-[#121218] border border-white/[0.04] rounded-[28px] p-6 hover:border-purple-500/30 transition-colors flex flex-col items-start text-left h-full shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
                                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/[0.05] text-white/70 mb-5 relative z-10">
                                    {idea.category}
                                </span>
                                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 leading-tight relative z-10">
                                    {idea.title}
                                </h3>
                                <p className="text-zinc-400 line-clamp-3 mb-6 flex-1 text-sm leading-relaxed relative z-10">
                                    {idea.problem}
                                </p>
                                <div className="w-full mt-auto pt-4 border-t border-white/[0.04] relative z-10">
                                    <Link href={`/idea/${idea.id}`} className="w-full block">
                                        <Button variant="ghost" className="w-full h-12 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] justify-center text-white font-semibold transition-all group">
                                            Read More
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
