"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    limit, 
    orderBy,
    startAt,
    endAt 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "./ui/input";
import { Search, User, Lightbulb, ArrowRight, X, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
    id: string;
    type: 'idea' | 'user';
    title: string;
    subtitle?: string;
    path: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [queryText, setQueryText] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const searchRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (queryText.length >= 2) {
                performSearch(queryText);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [queryText]);

    const performSearch = async (text: string) => {
        setLoading(true);
        const searchStr = text.toLowerCase();
        
        try {
            const resultsList: SearchResult[] = [];

            // 1. Search Ideas (Title)
            const ideasRef = collection(db, "ideas");
            // Basic prefix match: startAt(text) to endAt(text + \uf8ff)
            const ideasQ = query(
                ideasRef, 
                orderBy("title"), 
                startAt(text), 
                endAt(text + "\uf8ff"), 
                limit(4)
            );
            const ideasSnap = await getDocs(ideasQ);
            ideasSnap.forEach(doc => {
                const data = doc.data();
                resultsList.push({
                    id: doc.id,
                    type: 'idea',
                    title: data.title,
                    subtitle: data.category,
                    path: `/idea/${doc.id}`
                });
            });

            // 2. Search Users (Username)
            const usersRef = collection(db, "users");
            const usersQ = query(
                usersRef, 
                orderBy("username"), 
                startAt(searchStr), 
                endAt(searchStr + "\uf8ff"), 
                limit(4)
            );
            const usersSnap = await getDocs(usersQ);
            usersSnap.forEach(doc => {
                const data = doc.data();
                resultsList.push({
                    id: doc.id,
                    type: 'user',
                    title: data.name,
                    subtitle: `@${data.username}`,
                    path: `/user/${data.username}`
                });
            });

            setResults(resultsList);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (path: string) => {
        if (!user) {
            router.push("/login");
            setIsOpen(false);
            return;
        }
        router.push(path);
        setIsOpen(false);
        setQueryText("");
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-sm">
            {/* Search Input Bar Trigger */}
            <div 
                onClick={() => setIsOpen(true)}
                className="group relative cursor-text flex items-center"
            >
                <div className="w-10 h-10 lg:w-full lg:h-10 bg-white/[0.03] lg:bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-full flex items-center justify-center lg:pl-10 lg:pr-12 transition-all">
                    <Search className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 lg:absolute lg:left-3 lg:top-2.5 transition-colors" />
                    <span className="hidden lg:block text-sm text-zinc-500">
                        {queryText || "Search..."}
                    </span>
                </div>
                
                {/* Desktop Kbd Shortcut */}
                <div className="hidden lg:flex absolute right-3 top-2.5 items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] font-bold text-zinc-600">
                    <Command className="w-2.5 h-2.5" />
                    K
                </div>
            </div>

            {/* Results Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-12 left-0 w-full min-w-[320px] bg-[#121218]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                        <div className="p-3 border-b border-white/5 flex items-center gap-3">
                            <Search className="h-4 w-4 text-indigo-400" />
                            <input
                                autoFocus
                                value={queryText}
                                onChange={(e) => setQueryText(e.target.value)}
                                placeholder="Start typing..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-zinc-600"
                            />
                            {loading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {results.length > 0 ? (
                                <>
                                    {['idea', 'user'].map(type => {
                                        const typeResults = results.filter(r => r.type === type);
                                        if (typeResults.length === 0) return null;
                                        
                                        return (
                                            <div key={type} className="pb-2">
                                                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                                    {type === 'idea' ? 'Startup Ideas' : 'Builders'}
                                                </div>
                                                {typeResults.map(res => (
                                                    <button
                                                        key={res.id}
                                                        onClick={() => handleResultClick(res.path)}
                                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] group transition-all text-left"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                                                                {res.type === 'idea' ? <Lightbulb className="w-4 h-4 text-yellow-500/60" /> : <User className="w-4 h-4 text-indigo-400/60" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{res.title}</p>
                                                                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">{res.subtitle}</p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-white transform group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </>
                            ) : queryText.length >= 2 ? (
                                <div className="py-12 text-center">
                                    <p className="text-zinc-500 text-sm">No matches found for "{queryText}"</p>
                                </div>
                            ) : (
                                <div className="py-8 px-4">
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Quick Links</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Leaderboard', 'Messages', 'Feed'].map(link => (
                                            <button 
                                                key={link}
                                                onClick={() => router.push(link === 'Feed' ? '/' : `/${link.toLowerCase()}`)}
                                                className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:border-white/10 transition-all text-left"
                                            >
                                                {link}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {!user && queryText.length > 0 && (
                            <div className="p-4 bg-indigo-500/5 border-t border-white/5 text-center">
                                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest leading-relaxed">
                                    🔒 Authentication Required to <br/>View Professional Details
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
