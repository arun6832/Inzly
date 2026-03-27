"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Idea {
  id: string;
  title: string;
  problem: string;
  idea: string;
  category: string;
  userId: string;
}

export default function Home() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const { where } = await import("firebase/firestore");
        
        let interactedIdeaIds = new Set<string>();
        
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
          limit(50) // Increased limit to ensure we have enough fresh ideas after filtering
        );
        const snapshot = await getDocs(q);
        const fetchedIdeas: Idea[] = [];
        
        snapshot.forEach((doc) => {
          if (!interactedIdeaIds.has(doc.id)) {
            fetchedIdeas.push({ id: doc.id, ...doc.data() } as Idea);
          }
        });
        
        // Take at most 20 ideas to display
        setIdeas(fetchedIdeas.slice(0, 20));
      } catch (err) {
        console.error("Failed to fetch ideas", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdeas();
  }, [user?.uid]);

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
      <div className="flex-1 flex flex-col justify-center items-center bg-[#0B0B0F] relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-white/5 border-t-transparent border-r-indigo-500 rounded-full animate-[spin_1.5s_linear_infinite]"></div>
            <div className="absolute inset-2 border-4 border-white/5 border-b-transparent border-l-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_30px_rgb(99,102,241,0.5)]"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight">
              Curating Ideas
            </h3>
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest animate-pulse">
              Finding the next unicorn
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0B0F] relative overflow-hidden px-4">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1000px] pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[40vh] h-[40vh] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[20%] w-[40vh] h-[40vh] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[20%] left-[30%] w-[40vh] h-[40vh] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-medium text-blue-300 mb-4 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            The Premium Idea Discovery Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Swipe. Discover. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Launch.</span>
          </h1>

          <p className="text-xl text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            Join a curated community of builders exploring the next generation of startup ideas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Button
              onClick={() => window.location.href = "/signup"}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full px-10 h-14 font-bold text-lg shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all hover:scale-105"
            >
              Get Started
            </Button>
            <Button
              onClick={() => window.location.href = "/login"}
              variant="outline"
              className="w-full sm:w-auto bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full px-10 h-14 font-bold text-lg backdrop-blur-sm transition-all"
            >
              Log In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden bg-[#0B0B0F] relative hide-scrollbar scroll-smooth">
      {/* Animated Background Orbs (Logged In) - Changed to fixed so they don't scroll away */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1000px] pointer-events-none z-0">
        <div className="absolute top-[20%] left-[20%] w-[40vh] h-[40vh] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[20%] w-[40vh] h-[40vh] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[30%] w-[40vh] h-[40vh] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Feed Section */}
      <div className="w-full max-w-[420px] mx-auto relative flex flex-col items-center justify-center p-4 min-h-[min(800px,100vh-80px)] z-10 pt-8 sm:pt-12 pb-16">
        <div className="w-full text-center space-y-2 mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse" />
            Live Feed
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Discover Ideas</h2>
          <p className="text-zinc-500 text-sm font-medium">Swipe right to save, left to pass</p>
        </div>

        <div className="flex-1 w-full relative flex items-center justify-center">
          {ideas.length === 0 ? (
            <div className="text-center space-y-6 bg-[#121218] border border-white/[0.04] rounded-[32px] p-10 shadow-xl w-full">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/[0.05]">
                <span className="text-4xl">🚀</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-2">You're all caught up</h2>
                <p className="text-zinc-400 text-sm">We're out of fresh ideas for now. Check back later or add your own!</p>
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
              {/* Render cards in reverse so array[0] is on top */}
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

      {/* Scrollable Storytelling Content Below Feed */}
      {user && (
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-40">
          
          <div className="space-y-[30vh]">
            
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-center text-center relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] min-w-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] max-w-3xl relative z-10">
                The future belongs to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">curious.</span>
              </h3>
              <p className="mt-8 text-lg md:text-xl text-zinc-500 font-medium max-w-xl mx-auto tracking-wide relative z-10">
                Every paradigm shift started as an unrecognized idea. We are building the sanctuary for tomorrow's breakthroughs.
              </p>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[50vh] flex flex-col justify-center items-start text-left relative"
            >
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[40vw] h-[40vw] min-w-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.1] max-w-2xl relative z-10">
                Don't just witness innovation. <br/>
                <span className="text-zinc-500">Shape it.</span>
              </h3>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[60vh] flex flex-col justify-center items-center text-center relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] min-w-[500px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
              
              <div className="relative z-10 p-1">
                {/* Glowing border ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-md opacity-30 animate-pulse"></div>
                
                <div className="bg-[#0B0B0F]/80 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 md:p-20 relative shadow-2xl overflow-hidden group hover:border-indigo-500/30 transition-colors duration-500">
                  <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  
                  <h3 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
                    Your vision deserves a stage.
                  </h3>
                  <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed">
                    Stop building in silence. Share your unique perspective, find your technical co-founder, and launch the next era of technology.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Button 
                      onClick={() => window.location.href = "/submit"}
                      className="bg-white text-black hover:bg-zinc-200 rounded-full px-12 h-16 font-extrabold text-lg shadow-[0_0_40px_rgb(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgb(255,255,255,0.4)]"
                    >
                      Ignite an Idea
                    </Button>
                  </div>
                </div>
              </div>
            </motion.section>

          </div>
        </div>
      )}
    </div>
  );
}
