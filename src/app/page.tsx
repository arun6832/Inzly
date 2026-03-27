"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";

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
      <div className="flex-1 flex flex-col relative w-full">
        {/* High-Performance Soft Organic Background Fluid (No expensive CSS blur filters) */}
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1400px] pointer-events-none z-0 opacity-80">
          <div className="absolute top-[10%] left-[10%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] animate-organic-blob"></div>
          <div className="absolute top-[20%] right-[10%] w-[40vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] animate-organic-blob animation-delay-2000" style={{ animationDirection: "reverse" }}></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[60vw] h-[40vw] max-w-[800px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] animate-organic-blob animation-delay-4000"></div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[95vh] px-4 text-center">
          
          {/* Central Organic Abstract Visual */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-12 animate-fade-in-up flex items-center justify-center">
            {/* Core */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-400 to-blue-300 opacity-20 filter blur-2xl animate-organic-blob"></div>
            {/* Flowing Layers */}
            <div className="absolute inset-4 bg-gradient-to-bl from-indigo-400/40 to-purple-500/30 backdrop-blur-md animate-organic-blob animation-delay-2000 mix-blend-overlay border border-white/5"></div>
            <div className="absolute inset-8 bg-gradient-to-tr from-blue-300/30 to-indigo-500/40 backdrop-blur-xl animate-organic-blob animation-delay-4000 border border-white/10 shadow-[0_0_60px_rgba(99,102,241,0.2)]"></div>
          </div>

          <div className="inline-flex items-center px-5 py-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md text-sm font-medium text-indigo-200/80 mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 mr-3 animate-pulse opacity-70"></span>
            A thoughtful ecosystem for ideas
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-medium text-white tracking-tight leading-[1.05] animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            Plant. Nurture. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-blue-300 font-light italic pr-4">Evolve.</span>
          </h1>

          <p className="mt-10 text-xl text-zinc-400/80 font-normal max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            Discover organic growth for your next great venture. We seamlessly connect visionary founders to the elements they need to thrive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-14 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <Button
              onClick={() => window.location.href = "/signup"}
              className="w-full sm:w-auto bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-full px-12 h-14 font-medium text-lg backdrop-blur-lg transition-all hover:scale-[1.02]"
            >
              Start Growing
            </Button>
            <Button
              onClick={() => window.location.href = "/login"}
              variant="ghost"
              className="w-full sm:w-auto text-zinc-400 hover:text-white rounded-full px-10 h-14 font-medium text-lg transition-all"
            >
              Log In
            </Button>
          </div>
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center text-zinc-500/60 opacity-0 animate-fade-in-up" style={{ animationDelay: "800ms", opacity: 1 }}>
             <span className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3">Flow Downwards</span>
             <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
          </div>
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
                Innovation isn't manufactured; it grows organically when the right minds intersect. Find co-founders whose skills complement your own perfectly.
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
    <div className="flex-1 flex flex-col bg-[#0B0B0F] relative w-full min-h-screen">
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
    </div>
  );
}
