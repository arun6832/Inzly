"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import PreviewSwipeCard from "@/components/PreviewSwipeCard";
import { PRECISE_AI_NEWS } from "@/lib/constants";

interface Idea {
  id: string;
  title: string;
  problem: string;
  idea: string;
  category: string;
  userId: string;
  views?: number;
  likesCount?: number;
  githubUrl?: string;
  authorUsername?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [loadingNews, setLoadingNews] = useState("");

  useEffect(() => {
    setLoadingNews(PRECISE_AI_NEWS[Math.floor(Math.random() * PRECISE_AI_NEWS.length)]);
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const fetchIdeas = async () => {
      try {
        const { where } = await import("firebase/firestore");
        const interactedIdeaIds = new Set<string>();
        
        if (user?.uid) {
            try {
                const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid));
                const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid));
                const [savedSnap, likedSnap] = await Promise.all([getDocs(savedQ), getDocs(likedQ)]);
                savedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
                likedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
            } catch (e) { console.error(e); }
        }

        const q = query(collection(db, "ideas"), orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const rawIdeas: any[] = [];
        snapshot.forEach((doc) => {
            if (!interactedIdeaIds.has(doc.id)) {
                rawIdeas.push({ id: doc.id, ...doc.data() });
            }
        });

        const finalIdeas = await Promise.all(rawIdeas.slice(0, 20).map(async (idea) => {
            const { doc, getDoc } = await import("firebase/firestore");
            const authorRef = doc(db, "users", idea.userId);
            const authorSnap = await getDoc(authorRef);
            return {
                ...idea,
                authorUsername: authorSnap.exists() ? authorSnap.data().username : "unknown"
            };
        }));
        
        setIdeas(finalIdeas as Idea[]);
      } catch (err) { console.error(err); } finally {
        const elapsed = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 2000 - elapsed));
      }
    };
    fetchIdeas();
  }, [user?.uid]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { getCountFromServer, doc, getDoc, updateDoc, increment, setDoc } = await import("firebase/firestore");
        const userCountSnap = await getCountFromServer(collection(db, "users"));
        setUserCount(userCountSnap.data().count);
        const statsRef = doc(db, "siteStats", "globals");
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setVisitorCount(statsSnap.data().totalVisitors);
          const sessionKey = "inzly_session_visited";
          if (!sessionStorage.getItem(sessionKey)) {
            await updateDoc(statsRef, { totalVisitors: increment(1) });
            setVisitorCount(prev => (prev || 0) + 1);
            sessionStorage.setItem(sessionKey, "true");
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  const incrementingIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (ideas.length > 0 && !loading) {
      const topIdea = ideas[0];
      if (!viewedIds.has(topIdea.id) && !incrementingIds.current.has(topIdea.id)) {
        incrementingIds.current.add(topIdea.id);
        const incrementView = async () => {
          try {
            const { doc, updateDoc, increment } = await import("firebase/firestore");
            const ideaRef = doc(db, "ideas", topIdea.id);
            await updateDoc(ideaRef, { views: increment(1) });
            setViewedIds(prev => new Set(prev).add(topIdea.id));
            setIdeas(prev => prev.map((item, idx) => idx === 0 ? { ...item, views: (item.views || 0) + 1 } : item));
          } catch (err) { incrementingIds.current.delete(topIdea.id); }
        };
        incrementView();
      }
    }
  }, [loading, ideas[0]?.id, viewedIds]);

  const handleSwipe = async (dir: "left" | "right", idea: Idea) => {
    if (dir === "right" && user) {
      try {
        const { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, increment } = await import("firebase/firestore");
        const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const [savedSnap, likedSnap] = await Promise.all([getDocs(savedQ), getDocs(likedQ)]);
        const promises = [];
        if (savedSnap.empty) {
          promises.push(addDoc(collection(db, "savedIdeas"), { userId: user.uid, ideaId: idea.id, createdAt: serverTimestamp() }));
        }
        if (likedSnap.empty) {
          promises.push(addDoc(collection(db, "likes"), { userId: user.uid, ideaId: idea.id, createdAt: serverTimestamp() }));
          promises.push(updateDoc(doc(db, "ideas", idea.id), { likesCount: increment(1) }));
          if (idea.userId) promises.push(updateDoc(doc(db, "users", idea.userId), { totalLikes: increment(1) }));
        }
        await Promise.all(promises);
      } catch (err) { console.error(err); }
    }
    setTimeout(() => setIdeas((prev) => prev.slice(1)), 300);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-[#050507] w-full px-4 text-center">
        <h3 className="text-2xl sm:text-3xl font-black text-white italic max-w-xl">&ldquo;{loadingNews}&rdquo;</h3>
        <p className="mt-8 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] animate-pulse">Intelligence Stream</p>
      </div>
    );
  }

  if (!user && !loading) {
    const previewIdea = ideas[0];
    return (
      <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-[#050507]">
        {/* Simplified Static Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[15%] left-[10%] w-[40vh] h-[40vh] bg-indigo-600/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[15%] right-[10%] w-[40vh] h-[40vh] bg-purple-600/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-8 w-full max-w-[1400px] mx-auto px-4 lg:px-8 relative z-10">
          {/* Left Column (Desktop) */}
          <div className="hidden lg:flex flex-col space-y-8 pt-12">
            <div className="space-y-4 max-w-[280px]">
              <h4 className="text-white/20 font-black uppercase tracking-[0.4em] text-[8px]">The Innovator Nexus</h4>
              <p className="text-[12px] text-zinc-500 font-medium leading-relaxed">Plants seeds for Startup Builders, Ideathon participants, and founders seeking co-founders.</p>
            </div>
          </div>

          <div className="w-full flex flex-col items-center pt-8 sm:pt-12 pb-8">
            <div className="w-full text-center space-y-2 mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse" /> Trending
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Discover Ideas</h2>
              <p className="text-zinc-500 text-sm font-medium">Swipe to explore · Sign up to unlock full feed</p>
            </div>
            {previewIdea ? <PreviewSwipeCard idea={previewIdea} /> : null}
            <div className="w-full mt-8 space-y-4 text-center">
               <Button onClick={() => window.location.href = "/signup"} className="bg-white text-black hover:bg-zinc-200 rounded-full px-12 h-12 font-bold transition-transform hover:scale-105">Create Free Account</Button>
               <br/>
               <Button onClick={() => window.location.href = "/login"} variant="ghost" className="text-zinc-500 hover:text-white">Log In</Button>
            </div>
          </div>

          {/* Right Column (Desktop) */}
          <div className="hidden lg:flex flex-col space-y-8 pt-12 items-end text-right">
            <div className="space-y-4 max-w-[280px]">
              <h4 className="text-white/20 font-black uppercase tracking-[0.4em] text-[8px]">Ecosystem Access</h4>
              <p className="text-[12px] text-zinc-500 font-medium leading-relaxed">Investors track sectors, while Hackathon seekers find validated problems to solve.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050507] relative w-full overflow-hidden">
      {/* Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[10%] w-[45vh] h-[45vh] bg-indigo-600/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[50vh] h-[50vh] bg-purple-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-20"></div>
      </div>

      <div className="w-full relative flex-1 flex flex-col items-center justify-start z-10 pt-8 sm:pt-12 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_420px_1fr] md:gap-8 w-full max-w-[1400px] mx-auto px-4 lg:px-8">
          
          {/* Stats Sidebar (Order 2 on Mobile) */}
          <div className="order-2 md:order-1 flex flex-col space-y-6 pt-8 md:pt-24">
            <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-[32px] p-6 lg:p-8 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h4 className="text-indigo-300 font-extrabold uppercase tracking-[0.2em] text-[10px]">Your Pulse</h4>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{viewedIds.size}</span>
                  <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-wider">Explored</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{Math.min(100, viewedIds.size * 5 + 10)}%</span>
                  <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-wider">Impact</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[32px] p-6 lg:p-8 space-y-6 backdrop-blur-md">
              <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Global Hub</h4>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{userCount?.toLocaleString() || "1k"}+</span>
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Innovators</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-indigo-400">10+</span>
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Sectors</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Column (Order 1 on Mobile) */}
          <div className="order-1 flex flex-col items-center">
            <div className="w-full text-center space-y-2 mb-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2 animate-pulse" /> Live Stream
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Discover Ideas</h2>
              <p className="text-zinc-500 text-sm font-medium">Swipe right to save, left to skip</p>
            </div>

            <div className="w-full max-w-[420px] relative flex items-center justify-center">
              {ideas.length === 0 ? (
                <div className="text-center space-y-6 bg-[#121218] border border-white/[0.04] rounded-[32px] p-10 shadow-xl w-full">
                  <h2 className="text-2xl font-black text-white">Feed Exhausted</h2>
                  <p className="text-zinc-500 text-sm">Add your own ideas to restart the ecosystem.</p>
                  <Button onClick={() => window.location.reload()} className="bg-white text-black rounded-full px-8 h-12 font-bold w-full">Refresh</Button>
                </div>
              ) : (
                <div className="relative w-full h-[580px] sm:h-[640px] max-h-[75vh]">
                  {[...ideas].reverse().map((idea, index) => (
                    <SwipeCard
                      key={idea.id}
                      idea={idea}
                      active={(ideas.length - 1 - index) === 0}
                      zIndex={index}
                      onSwipe={(dir) => handleSwipe(dir, idea)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lens Sidebar (Order 3 on Mobile) */}
          <div className="order-3 flex flex-col space-y-6 pt-8 md:pt-24">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-[32px] p-6 lg:p-8 space-y-4">
              <h4 className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px]">Investor Lens</h4>
              <p className="text-white text-[11px] font-bold leading-relaxed">Track emergent seeds and sector momentum to discover future innovators.</p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[7px] font-black text-zinc-500 uppercase tracking-widest">#SaaS</span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[7px] font-black text-zinc-500 uppercase tracking-widest">#FinaTech</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
