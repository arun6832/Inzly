"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SwipeCard from "@/components/SwipeCard";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
        const q = query(
          collection(db, "ideas"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const fetchedIdeas: Idea[] = [];
        snapshot.forEach((doc) => {
          fetchedIdeas.push({ id: doc.id, ...doc.data() } as Idea);
        });
        setIdeas(fetchedIdeas);
      } catch (err) {
        console.error("Failed to fetch ideas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  const handleSwipe = async (dir: "left" | "right", ideaId: string) => {
    // Only logged in users can save ideas, but anyone can swipe
    if (dir === "right" && user) {
      try {
        await addDoc(collection(db, "savedIdeas"), {
          userId: user.uid,
          ideaId: ideaId,
          createdAt: serverTimestamp(),
        });
        console.log("Idea saved successfully");
      } catch (err) {
        console.error("Failed to save idea", err);
      }
    }

    // Remove the swiped idea from the stack after animation (300ms)
    setTimeout(() => {
      setIdeas((prev) => prev.slice(1));
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0B0B0F] relative">
      {/* Animated Background Orbs (Logged In) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1000px] pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[40vh] h-[40vh] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[20%] right-[20%] w-[40vh] h-[40vh] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[30%] w-[40vh] h-[40vh] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="flex-1 w-full max-w-[420px] mx-auto relative flex items-center justify-center p-4 min-h-[600px] h-full z-10">
        {ideas.length === 0 ? (
          <div className="text-center space-y-5">
            <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">👀</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">You're all caught up</h2>
            <p className="text-zinc-400">We're out of fresh ideas for now.</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-white/[0.05] text-white hover:bg-white/[0.1] rounded-full px-8 font-semibold mt-4 border-none"
            >
              Refresh Feed
            </Button>
          </div>
        ) : (
          <div className="relative w-full h-[600px] sm:h-[680px] max-h-[85vh]">
            {/* Render cards in reverse so array[0] is on top */}
            {[...ideas].reverse().map((idea, index) => {
              const realIndex = ideas.length - 1 - index;
              return (
                <SwipeCard
                  key={idea.id}
                  idea={idea}
                  active={realIndex === 0}
                  zIndex={ideas.length - realIndex}
                  onSwipe={(dir) => handleSwipe(dir, idea.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
