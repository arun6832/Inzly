"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import PreviewSwipeCard from "@/components/PreviewSwipeCard";
import { PRECISE_AI_NEWS, getLaymanRole } from "@/lib/constants";

interface Idea {
  id: string;
  title: string;
  idea: string;
  category: string;
  userId: string;
  views?: number;
  likesCount?: number;
  githubUrl?: string;
  authorUsername?: string;
  authorName?: string;
  authorBio?: string;
  authorMode?: string;
  authorCountry?: string;
  authorTotalLikes?: number;
  authorTrustScore?: number;
  visibility?: "public" | "restricted" | "investor";
}

export default function Home() {
  const { user, userMode, userData } = useAuth();
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
        
        let finalUserMode = userMode || "explorer";
        
        if (user?.uid) {
            try {
                const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid));
                const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid));
                const [savedSnap, likedSnap] = await Promise.all([getDocs(savedQ), getDocs(likedQ)]);
                savedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
                likedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
            } catch (e) { console.error(e); }
        }

        // 1. Visibility determination
        const filters = ["public"];
        if (finalUserMode === 'catalyst') filters.push("investor");
        
        const q = query(
          collection(db, "ideas"), 
          where("visibility", "in", filters),
          orderBy("createdAt", "desc"), 
          limit(100)
        );
        const snapshot = await getDocs(q);
        const rawIdeas: any[] = [];
        snapshot.forEach((doc) => {
            if (!interactedIdeaIds.has(doc.id)) {
                const data = doc.data();
                if (finalUserMode === 'explorer' && !data.isAccepted) {
                    return; // Skip non-accepted ideas for Viewers
                }
                if (finalUserMode === 'catalyst' && userData?.interests && userData.interests.length > 0) {
                    const ideaTags = data.tags || [];
                    const hasInterestMatch = ideaTags.some((t: string) => userData.interests.includes(t.toLowerCase()));
                    if (!hasInterestMatch) {
                        return; // Skip ideas without matching tag interests
                    }
                }
                rawIdeas.push({ id: doc.id, ...data });
            }
        });

        const finalIdeas = await Promise.all(rawIdeas.slice(0, 20).map(async (idea) => {
            const { doc, getDoc } = await import("firebase/firestore");
            const authorRef = doc(db, "users", idea.userId);
            const authorSnap = await getDoc(authorRef);
            const authorData = authorSnap.exists() ? authorSnap.data() : null;
            return {
                ...idea,
                authorUsername: authorData?.username || "unknown",
                authorName: authorData?.name || "",
                authorBio: authorData?.bio || "",
                authorMode: authorData?.mode || "explorer",
                authorCountry: authorData?.country || "",
                authorTotalLikes: authorData?.totalLikes || 0,
                authorTrustScore: authorData?.trustScore || 100,
            };
        }));
        
        setIdeas(finalIdeas as Idea[]);
      } catch (err) { console.error(err); } finally {
        const elapsed = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 2000 - elapsed));
      }
    };
    fetchIdeas();
  }, [user?.uid, userMode, userData]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { getCountFromServer, doc, getDoc, updateDoc, increment } = await import("firebase/firestore");
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
      } catch (err) { 
        // Silence permission errors for site stats
        console.warn("Analytics: Local scan only.");
      }
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
        const { collection, getDocs, query, where, addDoc, serverTimestamp } = await import("firebase/firestore");
        const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const [savedSnap, likedSnap] = await Promise.all([getDocs(savedQ), getDocs(likedQ)]);
        
        if (savedSnap.empty) {
          await addDoc(collection(db, "savedIdeas"), { userId: user.uid, ideaId: idea.id, createdAt: serverTimestamp() });
        }
        if (likedSnap.empty) {
          await addDoc(collection(db, "likes"), { userId: user.uid, ideaId: idea.id, createdAt: serverTimestamp() });
        }

        // Match Request system for Investor liking Thinker's idea
        if (userMode === 'catalyst' && idea.userId !== user.uid) {
          const matchQ = query(collection(db, "matches"), where("investorId", "==", user.uid), where("ideaId", "==", idea.id));
          const matchSnap = await getDocs(matchQ);
          if (matchSnap.empty) {
            await addDoc(collection(db, "matches"), {
              investorId: user.uid,
              investorName: userData?.name || user.displayName || "Investor",
              investorUsername: userData?.username || "unknown",
              thinkerId: idea.userId,
              ideaId: idea.id,
              ideaTitle: idea.title,
              status: "pending",
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (err) { console.error(err); }
    }
    setTimeout(() => setIdeas((prev) => prev.slice(1)), 300);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-background w-full px-4 text-center nothing-grid">
        <h3 className="text-xl sm:text-2xl font-dot uppercase tracking-widest text-white max-w-xl">&ldquo;{loadingNews}&rdquo;</h3>
        <p className="mt-8 text-[9px] text-zinc-500 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
          Intelligence Stream Loading
        </p>
      </div>
    );
  }

  if (!user && !loading) {
    const previewIdea = ideas[0];

    return (
      <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-background nothing-grid">
        {/* ─── Extreme Edge Environmental Elements ─── */}
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden hidden md:block">
          {/* Vertical Edge Left */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-35 group">
            <div className="w-px h-24 bg-blue-500/20"></div>
            <span className="[writing-mode:vertical-rl] text-[8px] font-mono tracking-[0.5em] text-zinc-500 uppercase">INZLY // ECOSYSTEM</span>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]"></div>
          </div>
          
          {/* Vertical Edge Right */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-35 group">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]"></div>
            <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-mono tracking-[0.5em] text-zinc-500 uppercase">STUDENT PATH // DISCOVER</span>
            <div className="w-px h-24 bg-red-500/20"></div>
          </div>
        </div>

        {/* ─── Global Structural Lines ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute left-[calc(50%-700px)] top-0 bottom-0 w-px bg-white/5 hidden xl:block"></div>
          <div className="absolute right-[calc(50%-700px)] top-0 bottom-0 w-px bg-white/5 hidden xl:block"></div>
          
          {/* Mobile structural lines */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5 block xl:hidden"></div>
          <div className="absolute right-4 top-0 bottom-0 w-px bg-white/5 block xl:hidden"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-8 w-full max-w-none 2xl:px-16 mx-auto px-4 lg:px-8 z-10 relative">
          
          {/* Left Column: The Innovator Nexus (Desktop Only) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex flex-col space-y-8 pt-12"
          >
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 space-y-6">
              <h4 className="text-zinc-500 font-mono font-bold uppercase tracking-[0.4em] text-[8px]">The Innovator Nexus</h4>
              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                Whether you’re a **Startup Builder** planting seeds, an **Ideathon participant** searching for original concepts, or a founder seeking technical co-founders, Inzly provides the nutrient-dense soil for growth.
              </p>
              <div className="space-y-2 pt-4 border-t border-border font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Ideathon Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Builder Network</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center Column: Preview Card Feed Section */}
          <div className="w-full relative flex flex-col items-center justify-center p-4 pt-8 sm:pt-12 pb-8">
            
            {/* Header */}
            <div className="w-full text-center space-y-2 mb-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center px-3 py-1 border border-border bg-card text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-1 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)] mr-2" />
                Trending Now
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl font-bold font-dot tracking-tight text-white"
              >
                Discover Ideas
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-zinc-500 text-xs font-mono flex flex-col sm:flex-row items-center justify-center gap-3 mt-1"
              >
                <span className="uppercase tracking-wide">Swipe to explore · Sign up for full feed</span>
                {visitorCount !== null && (
                  <span className="flex items-center text-white bg-blue-500/5 px-2.5 py-0.5 border border-blue-500/15 text-[9px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-blue-pulse mr-1.5" />
                    {visitorCount.toLocaleString()} Live Visitors
                  </span>
                )}
              </motion.div>
            </div>

            {/* Preview Card Area */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 w-full max-w-[420px] mx-auto relative flex items-center justify-center"
            >
              {previewIdea ? (
                <PreviewSwipeCard idea={previewIdea} />
              ) : (
                <div className="text-center space-y-6 bg-card border border-border rounded-3xl p-10 shadow-xl w-full">
                  <div className="w-20 h-20 bg-blue-500/5 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-500/15">
                    <span className="font-dot text-4xl text-white">🌱</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-2 uppercase">Ideas are loading</h2>
                    <p className="text-zinc-500 text-xs font-mono">Fresh startup ideas are on the way...</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="w-full mt-8 space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-[9px] font-mono">
                <div className="h-px flex-1 bg-white/10" />
                <span className="uppercase tracking-widest">
                  Join {userCount ? `${userCount.toLocaleString()}+` : "1,500+"} innovators
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => window.location.href = "/signup"}
                  className="w-full sm:w-auto bg-white text-black hover:bg-black hover:text-white border border-white rounded-none px-10 h-12 font-mono uppercase tracking-widest text-xs font-bold transition-all"
                >
                  Create Free Account
                </Button>
                <Button
                  onClick={() => window.location.href = "/login"}
                  variant="ghost"
                  className="w-full sm:w-auto text-zinc-500 hover:text-white rounded-none px-8 h-10 font-mono uppercase tracking-widest text-xs font-bold transition-all"
                >
                  Log In
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Ecosystem Access (Desktop Only) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex flex-col space-y-8 pt-12 text-right items-end"
          >
            <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 space-y-6">
              <h4 className="text-zinc-500 font-mono font-bold uppercase tracking-[0.4em] text-[8px]">Ecosystem Access</h4>
              <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                **Investors** track emerging sectors, while **Hackathon seekers** find validated problems to solve. For students, it's an industrial laboratory to deconstruct real-world projects and build a resume.
              </p>
              <div className="space-y-2 pt-4 border-t border-border font-mono flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Investor View</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Hackathon Seeds</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex flex-col items-center text-zinc-500/60 pb-8 animate-bounce mt-4">
          <span className="text-[8px] font-mono uppercase tracking-[0.3em] mb-3">Flow Downwards</span>
          <svg className="w-4 h-4 opacity-50 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Scrollable Storytelling Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-40 pt-20">
          <div className="space-y-[25vh]">
            
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[40vh] flex flex-col justify-center items-center text-center relative"
            >
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold font-dot tracking-tight text-white leading-[1.15] max-w-3xl relative z-10">
                Great ideas take root in the dark.
              </h3>
              <p className="mt-8 text-sm md:text-base text-zinc-400 font-mono max-w-xl mx-auto tracking-wide relative z-10 leading-relaxed">
                Even immense forests begin as unseen seeds. We provide the nutrient-dense, high-security ecosystem where your nascent concepts can safely sprout and connect.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[40vh] flex flex-col justify-center items-start text-left relative"
            >
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold font-dot tracking-tight text-white leading-[1.15] max-w-2xl relative z-10">
                Let collaboration <br/>
                <span className="text-zinc-500">flow naturally.</span>
              </h3>
              <p className="mt-8 text-sm md:text-base text-zinc-400 font-mono max-w-xl tracking-wide relative z-10 leading-relaxed">
                Innovation isn't manufactured; it grows organically when the right minds intersect. Find co-founders whose skills complement your own perfectly.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[40vh] flex flex-col justify-center items-end text-right relative"
            >
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold font-dot tracking-tight text-white leading-[1.15] max-w-2xl relative z-10">
                The ultimate <br/>
                <span className="text-zinc-400">learning lab.</span>
              </h3>
              <p className="mt-8 text-sm md:text-base text-zinc-400 font-mono max-w-xl ml-auto tracking-wide relative z-10 leading-relaxed">
                Not just for founders. Students deconstruct industry-grade projects, contribute to real-world codebases, and build a resume that recruiters notice immediately.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-center text-center relative"
            >
              <div className="relative z-10 p-1 w-full">
                <div className="bg-card border border-border rounded-3xl p-12 md:p-20 relative shadow-2xl overflow-hidden group">
                  <h3 className="text-2xl md:text-4xl font-bold font-sans tracking-tight text-white mb-6 uppercase">
                    Your vision needs sunlight.
                  </h3>
                  <p className="text-sm text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed font-mono">
                    Bring your ideas out of the shadows. Plant them in our community, gather real-time feedback, and watch your concepts blossom into reality.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button 
                      onClick={() => window.location.href = "/signup"}
                      className="bg-white text-black hover:bg-black hover:text-white border border-white rounded-xl px-12 h-16 font-mono uppercase tracking-widest text-xs font-bold transition-all"
                    >
                      Plant an Idea
                    </Button>
                  </div>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative w-full overflow-hidden nothing-grid">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="w-full relative flex-1 flex flex-col items-center z-10 pt-6 pb-10 px-4 md:px-8">

        {/* Stats Row */}
        <div className="w-full max-w-5xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-2.5 py-1 border border-border bg-card text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)] mr-2" />
                Welcome back
              </div>
              <h2 className="text-2xl font-bold font-dot tracking-tight text-foreground">Discover Ideas</h2>
              <p className="text-muted-foreground text-xs mt-1">Swipe right to save · Swipe left to skip</p>
            </div>
            <div className="flex items-center gap-5">
              {userCount !== null && (
                <div className="text-right">
                  <p className="text-2xl font-black font-dot tracking-tight text-foreground leading-none">{userCount.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Innovators</p>
                </div>
              )}
              {visitorCount !== null && (
                <>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-right">
                    <p className="text-2xl font-black font-dot tracking-tight text-foreground leading-none">{visitorCount.toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Visitors</p>
                  </div>
                </>
              )}
              <div className="w-px h-10 bg-border" />
              <div className="text-right">
                <p className="text-2xl font-black font-dot tracking-tight text-foreground leading-none">{viewedIds.size}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Explored</p>
              </div>
            </div>
          </div>
        </div>

        {/* Centered 2-Column Grid: Swipe Card | Author Panel */}
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-8 items-start">

          {/* LEFT: Swipe Card (Enlarged for readability) */}
          <div className="flex justify-center lg:justify-start">
            {ideas.length === 0 ? (
              <div className="text-center space-y-5 bg-card border border-border rounded-2xl p-10 shadow-xl w-full max-w-[520px]">
                <div>
                  <h2 className="text-xl font-bold font-dot tracking-tight text-foreground mb-2">
                    {userMode === 'catalyst' && userData?.interests && userData.interests.length > 0
                      ? "No matching interests found"
                      : "You're all caught up"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {userMode === 'catalyst' && userData?.interests && userData.interests.length > 0
                      ? "No active ideas match your selected hashtags. Adjust your tags in profile settings to expand your discovery stream!"
                      : "No fresh ideas right now. Check back later or post your own!"}
                  </p>
                </div>
                <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 font-semibold w-full">
                  Refresh Feed
                </Button>
              </div>
            ) : (
              <div className="relative w-full max-w-[520px] h-[640px] sm:h-[700px] max-h-[80vh]">
                {[...ideas].reverse().map((idea, index) => {
                  const realIndex = ideas.length - 1 - index;
                  return (
                    <SwipeCard
                      key={idea.id}
                      idea={idea}
                      active={realIndex === 0}
                      zIndex={ideas.length - realIndex}
                      onSwipe={(dir) => handleSwipe(dir, idea)}
                      userMode={userMode}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Author Profile Panel (Animated together with swiping) */}
          <div className="hidden lg:block relative sticky top-20 w-[290px] self-start">
            <AnimatePresence mode="popLayout">
              {ideas.length > 0 && (() => {
                const cur = ideas[0];
                const modeColors: Record<string, string> = {
                  explorer: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
                  sparker:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                  builder:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  catalyst: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                };
                const modeColor = modeColors[cur.authorMode || "explorer"] || modeColors.explorer;
                return (
                  <motion.div
                    key={cur.id}
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-4 w-full"
                  >
                    {/* Author Card */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Idea Author</p>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <span className="text-blue-400 font-black font-dot text-base">
                            {(cur.authorName || cur.authorUsername || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-foreground font-bold font-dot tracking-tight truncate">{cur.authorName || cur.authorUsername || "Unknown"}</p>
                          <p className="text-muted-foreground text-xs">@{cur.authorUsername}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border capitalize ${modeColor}`}>
                          {getLaymanRole(cur.authorMode)}
                        </span>
                        {cur.authorCountry && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg border border-border bg-background text-muted-foreground">{cur.authorCountry}</span>
                        )}
                      </div>
                      {cur.authorBio && (
                        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">{cur.authorBio}</p>
                      )}
                      <div className="flex items-center gap-4 border-t border-border pt-3">
                        <div>
                          <p className="text-base font-black font-dot text-foreground">{cur.authorTotalLikes ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Likes</p>
                        </div>
                        <div className="w-px h-7 bg-border" />
                        <div>
                          <p className="text-base font-black font-dot text-foreground">{cur.authorTrustScore ?? 100}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Trust</p>
                        </div>
                      </div>
                      <a href={`/user/${cur.authorUsername}`} className="flex items-center justify-center w-full h-9 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:border-blue-500/50 hover:text-blue-400 transition-colors">
                        View Profile
                      </a>
                    </div>

                    {/* Idea Stats */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">This Idea</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-base font-black font-dot text-foreground">{cur.likesCount ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Likes</p>
                        </div>
                        <div>
                          <p className="text-base font-black font-dot text-foreground">{cur.views ?? 0}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Views</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold font-dot text-foreground capitalize leading-snug">{cur.category}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Category</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}


