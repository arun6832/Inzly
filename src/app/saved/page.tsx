"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark, Heart, User, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

interface Idea {
    id: string;
    title: string;
    problem: string;
    category: string;
    userId: string;
}

export default function SavedIdeasPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
    const [userData, setUserData] = useState<{name?: string, totalLikes?: number} | null>(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!user) {
            setFetching(false);
            return;
        }

        const fetchSaved = async () => {
            try {
                // Fetch user data for total likes
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserData(userDocSnap.data());
                }

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
                            userId: data.userId,
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

    const handleMessage = async (e: React.MouseEvent, idea: Idea) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            router.push("/login");
            return;
        }
        
        try {
            const { getOrCreateChat } = await import("@/lib/messaging");
            const chatId = await getOrCreateChat(user.uid, idea.userId);
            router.push(`/messages/${chatId}`);
        } catch (err) {
            console.error("Failed to start chat:", err);
        }
    };

    if (loading || fetching) {
        return <div className="flex-1 flex justify-center items-center bg-background">
            <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin"></div>
        </div>;
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background">
                <h2 className="text-2xl font-bold font-dot tracking-tight text-foreground mb-4">Please log in to view your saved ideas.</h2>
                <Link href="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 font-semibold">Log In</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-x-hidden min-h-screen bg-background nothing-grid px-4 py-8 pt-28 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] pointer-events-none z-0 nothing-radial-glow opacity-40" />
            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mr-4">
                            <Bookmark className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black font-dot tracking-tight text-foreground">Saved Ideas</h1>
                            <p className="text-muted-foreground mt-1">Ideas you liked or requested connection on.</p>
                        </div>
                    </div>

                    {userData && (
                        <div className="flex items-center space-x-4 bg-card border border-border p-4 rounded-2xl">
                            <div className="flex items-center text-foreground">
                                <User className="w-5 h-5 mr-2 text-blue-500" />
                                <span className="font-semibold">{userData.name || "User"}</span>
                            </div>
                            <div className="w-px h-6 bg-border"></div>
                            <div className="flex items-center text-foreground">
                                <Heart className="w-5 h-5 mr-2 text-red-500 fill-current" />
                                <span className="font-bold">{userData.totalLikes || 0}</span>
                                <span className="ml-1 text-sm text-muted-foreground">Total Likes</span>
                            </div>
                        </div>
                    )}
                </div>

                {savedIdeas.length === 0 ? (
                    <div className="text-center py-24 bg-card rounded-2xl border border-border">
                        <h2 className="text-xl font-bold font-dot tracking-tight text-foreground mb-2">No saved ideas yet</h2>
                        <p className="text-muted-foreground mb-6">Start discovering ideas and request connection to save them.</p>
                        <Link href="/">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 font-semibold shadow-lg transition-transform hover:scale-105">Discover Ideas</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {savedIdeas.map((idea) => (
                            <div key={idea.id} className="bg-card border border-border rounded-2xl p-6 hover:border-indigo-500/30 transition-colors flex flex-col items-start text-left h-full shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
                                <span className="px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground mb-5 relative z-10 border border-border">
                                    {idea.category}
                                </span>
                                <h3 className="text-xl font-bold font-dot tracking-tight text-foreground mb-3 line-clamp-2 leading-tight relative z-10">
                                    {idea.title}
                                </h3>
                                <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm leading-relaxed relative z-10">
                                    {idea.problem}
                                </p>
                                <div className="w-full mt-auto pt-4 border-t border-border relative z-10 flex items-center gap-2">
                                    <Link href={`/idea/${idea.id}`} className="flex-1">
                                        <Button variant="ghost" className="w-full h-12 rounded-xl bg-muted hover:bg-accent justify-center text-foreground font-semibold transition-all group">
                                            Read More
                                        </Button>
                                    </Link>
                                    {user?.uid !== idea.userId && (
                                        <Button 
                                            onClick={(e) => handleMessage(e, idea)}
                                            variant="ghost" 
                                            size="icon"
                                            className="w-12 h-12 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
                                        >
                                            <MessageSquare className="w-5 h-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
