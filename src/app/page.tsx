"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
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
                
                // If user is logged in, fetch IDs of ideas they've already saved or liked
                if (user?.uid) {
                    try {
                        const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid));
                        const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid));
                        
                        const [savedSnap, likedSnap] = await Promise.all([
                            getDocs(savedQ),
                            getDocs(likedQ)
                        ]);
                        
                        savedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
                        likedSnap.forEach(d => interactedIdeaIds.add(d.data().ideaId));
                    } catch (e) {
                        console.error("Failed to fetch user interactions for filtering", e);
                    }
                }

                const q = query(
                    collection(db, "ideas"),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
                const snapshot = await getDocs(q);
                const fetchedIdeas: Idea[] = [];
                
                snapshot.forEach((doc) => {
                    if (!interactedIdeaIds.has(doc.id)) {
                        fetchedIdeas.push({ id: doc.id, ...doc.data() } as Idea);
                    }
                });
                
                setIdeas(fetchedIdeas.slice(0, 20));
            } catch (err) {
                console.error("Failed to fetch ideas", err);
            } finally {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 3000 - elapsed);
                
                setTimeout(() => {
                    setLoading(false);
                }, remaining);
            }
        };

        fetchIdeas();
    }, [user?.uid]);

  // Fetch stats (User count and Site visitors)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { getCountFromServer, doc, getDoc, updateDoc, increment, setDoc } = await import("firebase/firestore");
        
        // 1. Fetch User Count
        const userCountSnap = await getCountFromServer(collection(db, "users"));
        setUserCount(userCountSnap.data().count);

        // 2. Manage Global Site Visitors
        const statsRef = doc(db, "siteStats", "globals");
        const statsSnap = await getDoc(statsRef);
        
        if (statsSnap.exists()) {
          setVisitorCount(statsSnap.data().totalVisitors);
          
          // Increment total visitors once per session
          const sessionKey = "inzly_session_visited";
          if (!sessionStorage.getItem(sessionKey)) {
            await updateDoc(statsRef, { totalVisitors: increment(1) });
            setVisitorCount(prev => (prev || 0) + 1);
            sessionStorage.setItem(sessionKey, "true");
          }
        } else {
          // Initialize stats if not exist
          await setDoc(statsRef, { totalVisitors: 1 });
          setVisitorCount(1);
          sessionStorage.setItem("inzly_session_visited", "true");
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  // Ref to track IDs incremented in the current mount to avoid Strict Mode duplicates
  const incrementingIds = useRef<Set<string>>(new Set());

  // Increment views for the top card (discovered)
  useEffect(() => {
    if (ideas.length > 0 && !loading) {
      const topIdea = ideas[0];
      
      // Check both local set and ref lock
      if (!viewedIds.has(topIdea.id) && !incrementingIds.current.has(topIdea.id)) {
        // Lock immediately
        incrementingIds.current.add(topIdea.id);

        const incrementView = async () => {
          try {
            const { doc, updateDoc, increment } = await import("firebase/firestore");
            const ideaRef = doc(db, "ideas", topIdea.id);
            
            // 1. Update in DB first
            await updateDoc(ideaRef, { views: increment(1) });
            
            // 2. Then update local states
            setViewedIds(prev => {
              const next = new Set(prev);
              next.add(topIdea.id);
              return next;
            });
            
            setIdeas(prev => prev.map((item, idx) => 
              idx === 0 ? { ...item, views: (item.views || 0) + 1 } : item
            ));
          } catch (err) {
            console.error("Failed to increment idea view", err);
            // On failure, we could potentially remove from ref to allow retry
            incrementingIds.current.delete(topIdea.id);
          }
        };
        incrementView();
      }
    }
  }, [loading, ideas[0]?.id, viewedIds]); // Depend on ideas[0]?.id specifically instead of the whole array

  const handleSwipe = async (dir: "left" | "right", idea: Idea) => {
    // Only logged in users can save ideas, but anyone can swipe
    if (dir === "right" && user) {
      try {
        const { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, increment } = await import("firebase/firestore");
        
        // Check if already saved
        const savedQ = query(collection(db, "savedIdeas"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const savedSnap = await getDocs(savedQ);
        
        // Check if already liked
        const likedQ = query(collection(db, "likes"), where("userId", "==", user.uid), where("ideaId", "==", idea.id));
        const likedSnap = await getDocs(likedQ);
        
        const promises = [];

        // Save the idea if not already saved
        if (savedSnap.empty) {
          promises.push(
            addDoc(collection(db, "savedIdeas"), {
              userId: user.uid,
              ideaId: idea.id,
              createdAt: serverTimestamp(),
            }).catch(e => console.error("Failed to save idea", e))
          );
        }
        
        // Like the idea if not already liked
        if (likedSnap.empty) {
          promises.push(
            addDoc(collection(db, "likes"), {
              userId: user.uid,
              ideaId: idea.id,
              createdAt: serverTimestamp()
            }).catch(e => console.error("Failed to add like", e))
          );
          
          // Increment likes on the idea and the author's user profile
          const ideaRef = doc(db, "ideas", idea.id);
          const authorRef = doc(db, "users", idea.userId);
          
          promises.push(
            updateDoc(ideaRef, { likesCount: increment(1) }).catch(e => console.error("Failed to update idea likes", e))
          );
          
          if (idea.userId) {
            promises.push(
              updateDoc(authorRef, { totalLikes: increment(1) }).catch(e => console.error("Failed to update user totalLikes", e))
            );
          }
        }

        await Promise.all(promises);
        console.log("Idea swiped right processed successfully");
      } catch (err) {
        console.error("Failed to process right swipe", err);
      }
    }

    // Remove the swiped idea from the stack after animation (300ms)
    setTimeout(() => {
      setIdeas((prev) => prev.slice(1));
    }, 300);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center bg-[#050507] overflow-hidden w-full px-4">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center px-8 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight max-w-xl mx-auto italic pr-1">
              &ldquo;{loadingNews}&rdquo;
            </h3>
            <p className="mt-8 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] animate-pulse">
              AI Intelligence Stream
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    const previewIdea = ideas[0];

    return (
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Living Animated Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[15%] left-[10%] w-[45vh] h-[45vh] bg-indigo-600/10 rounded-full mix-blend-screen blur-[80px] animate-blob animate-pulse-glow"></div>
          <div className="absolute top-[10%] right-[15%] w-[40vh] h-[40vh] bg-blue-500/10 rounded-full mix-blend-screen blur-[70px] animate-blob-slow animation-delay-2000 animate-pulse-glow"></div>
          <div className="absolute bottom-[15%] left-[25%] w-[50vh] h-[50vh] bg-purple-600/8 rounded-full mix-blend-screen blur-[90px] animate-blob-fast animation-delay-4000 animate-pulse-glow"></div>
          <div className="absolute top-1/3 left-0 w-[200%] h-[30vh] bg-gradient-to-r from-transparent via-indigo-500/[0.03] to-transparent animate-aurora"></div>
        </div>

        {/* ─── Extreme Edge Environmental Elements (Minimal) ─── */}
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden hidden md:block">
          {/* Vertical Edge Left */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-30 group">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
            <span className="[writing-mode:vertical-rl] text-[9px] font-black tracking-[0.5em] text-white/50 animate-pulse-glow">INZLY // ECOSYSTEM</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
          </div>
          
          {/* Vertical Edge Right */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-30 group">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></div>
            <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black tracking-[0.5em] text-white/50 animate-pulse-glow">STUDENT PATH // DISCOVER</span>
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
          </div>
        </div>

        {/* ─── Global Structural Lines (Edge Definition) ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute left-[calc(50%-700px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block"></div>
          <div className="absolute right-[calc(50%-700px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block"></div>
          
          {/* Mobile structural lines */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.02] to-transparent block xl:hidden"></div>
          <div className="absolute right-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.02] to-transparent block xl:hidden"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-8 w-full max-w-[1400px] mx-auto px-4 lg:px-8">
          
          {/* Left Column: The Innovator Nexus (Desktop Only) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:flex flex-col space-y-8 pt-12"
          >
            <div className="space-y-6 max-w-[280px]">
              <h4 className="text-white/30 font-black uppercase tracking-[0.4em] text-[8px]">The Innovator Nexus</h4>
              <p className="text-[12px] text-zinc-500 font-medium leading-relaxed">
                Whether you’re a **Startup Builder** planting seeds, an **Ideathon participant** searching for original concepts, or a founder seeking technical co-founders, Inzly provides the nutrient-dense soil for growth.
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/50"></div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Ideathon Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/50"></div>
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Builder Network</span>
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
                className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
                Trending Now
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl font-black text-white tracking-tight"
              >
                Discover Ideas
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-zinc-500 text-sm font-medium flex items-center justify-center gap-4"
              >
                <span>Swipe to explore · Sign up to unlock the full feed</span>
                {visitorCount !== null && (
                  <span className="flex items-center text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 mr-1.5 animate-pulse" />
                    {visitorCount.toLocaleString()} Total Visitors
                  </span>
                )}
              </motion.p>
            </div>

            {/* Preview Card Area */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 w-full relative flex items-center justify-center"
            >
              {previewIdea ? (
                <PreviewSwipeCard idea={previewIdea} />
              ) : (
                <div className="text-center space-y-6 bg-[#121218] border border-white/[0.04] rounded-[32px] p-10 shadow-xl w-full">
                  <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/[0.05]">
                    <span className="text-4xl">🌱</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white mb-2">Ideas are loading</h2>
                    <p className="text-zinc-400 text-sm">Fresh startup ideas are on the way...</p>
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
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="uppercase tracking-widest">
                  Join {userCount ? `${userCount.toLocaleString()}+` : "1,500+"} innovators
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => window.location.href = "/signup"}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full px-10 h-12 font-semibold shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02]"
                >
                  Create Free Account
                </Button>
                <Button
                  onClick={() => window.location.href = "/login"}
                  variant="ghost"
                  className="w-full sm:w-auto text-zinc-400 hover:text-white rounded-full px-8 h-10 font-medium transition-all"
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
            <div className="space-y-6 max-w-[280px]">
              <h4 className="text-white/30 font-black uppercase tracking-[0.4em] text-[8px]">Ecosystem Access</h4>
              <p className="text-[12px] text-zinc-500 font-medium leading-relaxed">
                **Investors** track emerging sectors, while **Hackathon seekers** find validated problems to solve. For students, it's an industrial laboratory to deconstruct real-world projects and build a resume that recruiters can&apos;t ignore.
              </p>
              <div className="space-y-2 pt-2 flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Investor View</span>
                  <div className="w-1 h-1 rounded-full bg-purple-500/50"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Hackathon Seeds</span>
                  <div className="w-1 h-1 rounded-full bg-purple-500/50"></div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Scroll hint */}
        <div className="relative z-10 flex flex-col items-center text-zinc-500/60 pb-8 animate-bounce">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3">Flow Downwards</span>
          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* Scrollable Storytelling Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-40 pt-20">
          <div className="space-y-[30vh]">
            
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-center text-center relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] min-w-[350px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none animate-organic-blob"></div>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[1.1] max-w-3xl relative z-10">
                Great ideas <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 font-light italic pr-4">take root</span> in the dark.
              </h3>
              <p className="mt-8 text-lg md:text-xl text-zinc-400 font-normal max-w-xl mx-auto tracking-wide relative z-10 leading-relaxed">
                Even immense forests begin as unseen seeds. We provide the nutrient-dense ecosystem where your nascent concepts can safely sprout and connect.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-start text-left relative"
            >
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[50vw] h-[50vw] min-w-[450px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none animate-organic-blob animation-delay-2000"></div>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[1.1] max-w-2xl relative z-10">
                Let collaboration <br/>
                <span className="text-zinc-500 font-light italic">flow naturally.</span>
              </h3>
              <p className="mt-8 text-lg md:text-xl text-zinc-400 font-normal max-w-xl tracking-wide relative z-10 leading-relaxed">
                Innovation isn&apos;t manufactured; it grows organically when the right minds intersect. Find co-founders whose skills complement your own perfectly.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-end text-right relative"
            >
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[50vw] h-[50vw] min-w-[450px] bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] pointer-events-none animate-organic-blob animation-delay-3000"></div>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[1.1] max-w-2xl relative z-10">
                The ultimate <br/>
                <span className="text-indigo-400 font-light italic">learning lab.</span>
              </h3>
              <p className="mt-8 text-lg md:text-xl text-zinc-400 font-normal max-w-xl ml-auto tracking-wide relative z-10 leading-relaxed">
                Not just for founders. Students deconstruct industry-grade projects, contribute to real-world codebases, and build a resume that corporations notice immediately.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[60vh] flex flex-col justify-center items-center text-center relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] min-w-[550px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none animate-organic-blob animation-delay-4000"></div>
              
              <div className="relative z-10 p-1">
                {/* Flowing border ring */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-400/20 via-blue-400/20 to-purple-400/20 rounded-[40px] filter blur-xl animate-organic-blob"></div>
                
                <div className="bg-[#050507]/60 backdrop-blur-2xl border border-white/5 rounded-[40px] p-12 md:p-20 relative shadow-2xl overflow-hidden group hover:bg-[#050507]/80 transition-colors duration-700">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                  
                  <h3 className="text-3xl md:text-5xl font-medium text-white mb-6 tracking-tight">
                    Your vision needs <span className="font-light italic pr-2">sunlight.</span>
                  </h3>
                  <p className="text-lg text-zinc-400/90 mb-10 max-w-xl mx-auto leading-relaxed font-normal">
                    Bring your ideas out of the shadows. Plant them in our community, gather real-time feedback, and watch your concepts blossom into reality.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button 
                      onClick={() => window.location.href = "/signup"}
                      className="bg-zinc-100 text-black hover:bg-white rounded-full px-12 h-16 font-medium text-lg shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.03]"
                    >
                      Plant an Idea
                    </Button>
                  </div>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B0F] relative w-full overflow-hidden">
      {/* ─── Living Animated Background ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-[45vh] h-[45vh] bg-indigo-600/10 rounded-full mix-blend-screen blur-[80px] animate-blob animate-pulse-glow"></div>
        <div className="absolute top-[10%] right-[15%] w-[40vh] h-[40vh] bg-blue-500/8 rounded-full mix-blend-screen blur-[70px] animate-blob-slow animation-delay-2000 animate-pulse-glow"></div>
        <div className="absolute bottom-[15%] left-[25%] w-[50vh] h-[50vh] bg-purple-600/8 rounded-full mix-blend-screen blur-[90px] animate-blob-fast animation-delay-4000 animate-pulse-glow"></div>

        {/* Aurora sweep band */}
        <div className="absolute top-1/3 left-0 w-[200%] h-[30vh] bg-gradient-to-r from-transparent via-indigo-500/[0.03] to-transparent animate-aurora"></div>

        {/* Floating micro-particles (Reduced Count for Performance) */}
        <div className="absolute left-[15%] w-1 h-1 bg-indigo-400/30 rounded-full animate-float-particle" style={{ '--float-duration': '18s', '--float-delay': '0s' } as React.CSSProperties}></div>
        <div className="absolute left-[35%] w-1.5 h-1.5 bg-purple-400/25 rounded-full animate-float-particle" style={{ '--float-duration': '22s', '--float-delay': '3s' } as React.CSSProperties}></div>
        <div className="absolute left-[65%] w-1 h-1 bg-blue-400/25 rounded-full animate-float-particle" style={{ '--float-duration': '19s', '--float-delay': '7s' } as React.CSSProperties}></div>
        <div className="absolute left-[85%] w-0.5 h-0.5 bg-indigo-300/30 rounded-full animate-float-particle" style={{ '--float-duration': '20s', '--float-delay': '11s' } as React.CSSProperties}></div>

        {/* Living Ecosystem Tags (Environmental Density) */}
        <div className="absolute inset-0 opacity-40 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[5%] text-[10px] font-black text-indigo-400/20 uppercase tracking-[0.4em] animate-float-slow transition-opacity hover:opacity-100">AI / ML</div>
          <div className="absolute top-[45%] left-[2%] text-[10px] font-black text-purple-400/20 uppercase tracking-[0.4em] animate-float-medium group-hover:opacity-100">SAAS</div>
          <div className="absolute top-[75%] left-[8%] text-[10px] font-black text-blue-400/20 uppercase tracking-[0.4em] animate-float-slow">FINTECH</div>
          <div className="absolute top-[25%] right-[5%] text-[10px] font-black text-indigo-400/20 uppercase tracking-[0.4em] animate-float-medium">ACTIVE NOW</div>
          <div className="absolute top-[55%] right-[2%] text-[10px] font-black text-purple-400/20 uppercase tracking-[0.4em] animate-float-slow">INNOVATING</div>
          <div className="absolute top-[80%] right-[8%] text-[10px] font-black text-blue-400/20 uppercase tracking-[0.4em] animate-float-medium">HEALTHTECH</div>
          
          {/* Faint Grid lines (Environmental Density) */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
        </div>

        {/* ─── Extreme Edge Environmental Elements (Minimal) ─── */}
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden hidden md:block">
          {/* Vertical Edge Left */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-40 group">
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent"></div>
            <span className="[writing-mode:vertical-rl] text-[9px] font-black tracking-[0.6em] text-white animate-pulse-glow uppercase">Innovation // Source</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          </div>
          
          {/* Vertical Edge Right */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-40 group">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></div>
            <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-black tracking-[0.6em] text-white animate-pulse-glow uppercase">Live Activity // Active</span>
            <div className="w-px h-32 bg-gradient-to-b from-transparent via-purple-500/40 to-transparent"></div>
          </div>
        </div>

        {/* ─── Global Structural Lines (Edge Definition) ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute left-[calc(50%-700px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block"></div>
          <div className="absolute right-[calc(50%-700px)] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.03] to-transparent hidden xl:block"></div>
          
          {/* Mobile structural lines */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.02] to-transparent block xl:hidden"></div>
          <div className="absolute right-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/[0.02] to-transparent block xl:hidden"></div>
        </div>
      </div>

      {/* Hero Feed Section with 3-Column Layout on Desktop */}
      <div className="w-full relative flex-1 flex flex-col items-center justify-start z-10 pt-8 sm:pt-12 pb-16">
        
        <div className="grid grid-cols-1 md:grid-cols-[1fr_420px_1fr] gap-8 w-full max-w-[1400px] mx-auto px-4 lg:px-8">
          
          {/* Left Sidebar: Platform Pulse (Tablet & Desktop) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:flex flex-col space-y-8 pt-24"
          >
            {/* ─── Personalized Relevance: Innovator Pulse ─── */}
            <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-[32px] p-6 lg:p-8 space-y-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <h4 className="text-indigo-300 font-extrabold uppercase tracking-[0.2em] text-[10px]">Your Pulse</h4>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{viewedIds.size}</span>
                  <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-wider">Ideas Explored</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{Math.min(100, viewedIds.size * 5 + 10)}%</span>
                  <span className="text-zinc-500 text-[8px] font-bold uppercase tracking-wider">Innovation Score</span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 font-medium leading-tight pt-2 border-t border-white/[0.04]">
                Your score reflects your discovery path and contribution potential within the ecosystem.
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[32px] p-6 lg:p-8 space-y-6 backdrop-blur-md sticky top-24">
              <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Platform Pulse</h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-2xl lg:text-3xl font-black text-white">100+</span>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Active Ideas</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl lg:text-3xl font-black text-indigo-400">1.5k+</span>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Innovators</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl lg:text-3xl font-black text-purple-400">10+</span>
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Global Sectors</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/[0.06]">
                <p className="text-zinc-400 text-xs leading-relaxed hidden lg:block">
                  Join a global classroom of real-world founders and tech contributors.
                </p>
                <p className="text-zinc-400 text-[10px] leading-relaxed lg:hidden">
                  Real-world founders and tech contributors.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Center Column: The Main Feed */}
          <div className="flex flex-col items-center">
            <div className="w-full text-center space-y-2 mb-8 relative">
              {/* Activity Pulsars (Header Density) */}
              <div className="hidden md:block absolute -left-12 top-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-full py-1 px-3">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Live Flow</span>
                </div>
              </div>
              <div className="hidden md:block absolute -right-12 top-4 pointer-events-none">
                <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-full py-1 px-3">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Global Seed</span>
                </div>
              </div>
              
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
                Live Feed
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Discover Ideas</h2>
              <p className="text-zinc-500 text-sm font-medium flex items-center justify-center gap-4">
                <span>Swipe right to save, left to pass</span>
                {visitorCount !== null && (
                  <span className="flex items-center text-indigo-400/80 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/10 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 mr-1.5 animate-pulse" />
                    {visitorCount.toLocaleString()} Total Visitors
                  </span>
                )}
              </p>
            </div>

            <div className="w-full max-w-[420px] relative flex items-center justify-center">
              {ideas.length === 0 ? (
                <div className="text-center space-y-6 bg-[#121218] border border-white/[0.04] rounded-[32px] p-10 shadow-xl w-full">
                  <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/[0.05]">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-white mb-2">You&apos;re all caught up</h2>
                    <p className="text-zinc-400 text-sm">We&apos;re out of fresh ideas for now. Check back later or add your own!</p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 h-12 font-bold w-full transition-transform hover:scale-105"
                  >
                    Refresh Feed
                  </Button>
                </div>
              ) : (
                <div className="relative w-full h-[580px] sm:h-[640px] max-h-[75vh]">
                  {[...ideas].reverse().map((idea, index) => {
                    const realIndex = ideas.length - 1 - index;
                    return (
                      <SwipeCard
                        key={idea.id}
                        idea={idea}
                        active={realIndex === 0}
                        zIndex={ideas.length - realIndex}
                        onSwipe={(dir) => handleSwipe(dir, idea)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Corporate & Investor Lens (Tablet & Desktop) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hidden md:flex flex-col space-y-8 pt-24"
          >
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-[32px] p-6 lg:p-8 space-y-6 backdrop-blur-md sticky top-24">
              <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Ecosystem Lens</h4>
              <div className="space-y-5">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-widest">Investor Insights</span>
                    <p className="text-white text-[11px] font-bold leading-relaxed">
                        Collectors track emerging seeds and sector momentum to discover high-potential innovators.
                    </p>
                </div>
                <div className="space-y-2 border-t border-white/[0.04] pt-4">
                  <span className="text-[10px] font-black uppercase text-purple-400 block tracking-widest">Hackathon Path</span>
                  <p className="text-zinc-400 text-[10px] leading-relaxed">
                      Ideathon seekers and hackers use the feed to validate problem statements and find original startup hooks.
                  </p>
                </div>
                <div className="pt-2 border-t border-white/[0.04] flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-full bg-white/[0.05] text-[7px] font-bold text-zinc-500 uppercase tracking-widest border border-white/[0.05]">#IDEATHON</span>
                  <span className="px-2 py-1 rounded-full bg-white/[0.05] text-[7px] font-bold text-zinc-500 uppercase tracking-widest border border-white/[0.05]">#HACKATHON</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="w-full relative z-10">
        <Footer variant="minimal" />
      </div>
    </div>
  );
}
