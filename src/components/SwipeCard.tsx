"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { X, Heart, ExternalLink, MessageSquare, User, Lock, Eye, Flag, ShieldAlert } from "lucide-react";
import { Github } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Idea {
    id: string;
    title: string;
    idea: string;
    category: string;
    userId: string;
    likesCount?: number;
    views?: number;
    githubUrl?: string;
    authorUsername?: string;
    authorTrustScore?: number;
    visibility?: "public" | "restricted" | "investor";
    tags?: string[];
}

interface SwipeCardProps {
    idea: Idea;
    onSwipe: (dir: "left" | "right") => void;
    active: boolean;
    zIndex: number;
    userMode?: string;
}

const SWIPE_THRESHOLD = 80;
const EXIT_DISTANCE = 600;

export default function SwipeCard({ idea, onSwipe, active, zIndex, userMode }: SwipeCardProps) {
    const [exiting, setExiting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const router = useRouter();

    const x = useMotionValue(0);
    // Gentler rotation — max ±8° at ±300px drag
    const rotate = useTransform(x, [-300, 0, 300], [-8, 0, 8]);
    // Keep full opacity during drag, only dim slightly at extremes
    const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.85, 1, 1, 1, 0.85]);
    // Subtle scale breathing during drag
    const dragScale = useTransform(x, [-300, 0, 300], [0.98, 1, 0.98]);

    // Subtle swipe indicators (clean outlines, no neon glows)
    const saveOpacity = useTransform(x, [0, 60, 150], [0, 0.3, 0.9]);
    const skipOpacity = useTransform(x, [-150, -60, 0], [0.9, 0.3, 0]);

    const performSwipe = useCallback((dir: "left" | "right") => {
        if (exiting) return;
        setExiting(true);
        const target = dir === "left" ? -EXIT_DISTANCE : EXIT_DISTANCE;

        animate(x, target, {
            type: "spring",
            stiffness: 300,
            damping: 30,
            velocity: x.getVelocity(),
        });

        // Trigger the callback after sufficient animation time
        setTimeout(() => onSwipe(dir), 250);
    }, [exiting, onSwipe, x]);

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        // Swipe if past threshold OR if velocity is high enough
        if (offset > SWIPE_THRESHOLD || velocity > 500) {
            performSwipe("right");
        } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
            performSwipe("left");
        } else {
            // Spring back to center
            animate(x, 0, {
                type: "spring",
                stiffness: 500,
                damping: 35,
            });
        }
    }, [performSwipe, x]);

    const handleManualSwipe = (dir: "left" | "right") => {
        performSwipe(dir);
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity: cardOpacity,
                scale: dragScale,
                zIndex,
            }}
            drag={active && !exiting ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.9}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
            onDragEnd={handleDragEnd}
            initial={active ? { scale: 1, y: 0 } : { scale: 0.98, y: 6 }}
            animate={
                exiting
                    ? {} // Let the imperative animate() handle exit
                    : active
                    ? { scale: 1, y: 0, opacity: 1 }
                    : { scale: 0.98, y: 6, opacity: 0.5 }
            }
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
            }}
            className={`absolute inset-0 flex flex-col justify-between bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 cursor-grab active:cursor-grabbing overflow-hidden ${!active ? 'pointer-events-none' : ''}`}
        >
            {/* Structural hairline graph grid within the card chassis */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

            {/* Swipe Direction Indicators */}
            {active && (
                <>
                    {/* LIKE overlay */}
                    <motion.div
                        style={{ opacity: saveOpacity }}
                        className="absolute inset-0 rounded-3xl border border-blue-500/30 bg-card/90 pointer-events-none z-20 flex items-center justify-center p-8"
                    >
                        <div className="px-6 py-3 border border-blue-500 text-blue-400 font-sans font-bold text-3xl tracking-[0.2em] rotate-[-5deg] uppercase bg-card rounded-xl">
                          SAVE CONCEPT
                        </div>
                    </motion.div>
                    {/* NOPE overlay */}
                    <motion.div
                        style={{ opacity: skipOpacity }}
                        className="absolute inset-0 rounded-3xl border border-red-500/30 bg-card/90 pointer-events-none z-20 flex items-center justify-center p-8"
                    >
                        <div className="px-6 py-3 border border-red-600 text-red-600 font-sans font-bold text-3xl tracking-[0.2em] rotate-[5deg] uppercase bg-card rounded-xl">
                          SKIP CONCEPT
                        </div>
                    </motion.div>
                </>
            )}

            <div className="flex-1 overflow-y-auto space-y-6 select-none hide-scrollbar relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-white/5 text-zinc-400 border border-border uppercase tracking-wider">
                            {idea.category}
                        </span>
                        {idea.tags && idea.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 max-w-full">
                                {idea.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        {idea.authorUsername && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/user/${idea.authorUsername}`);
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background text-[9px] font-mono font-bold text-zinc-500 hover:text-white border border-border transition-colors uppercase tracking-wider"
                            >
                                <User className="w-2.5 h-2.5" />
                                <span>{idea.authorUsername}</span>
                                {idea.authorTrustScore && idea.authorTrustScore >= 95 && (
                                    <ShieldAlert className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                )}
                            </button>
                        )}
                        
                        {/* Integrity Pulse */}
                        {idea.authorTrustScore !== undefined && (
                            <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 rounded-lg border border-border font-mono text-[9px] text-zinc-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.7)]" />
                                <span className="font-bold text-zinc-400">{idea.authorTrustScore} SCORE</span>
                            </div>
                        )}
                        
                        {/* Visibility Badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border border-border bg-background text-zinc-400">
                            {idea.visibility === 'public' ? <Eye className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            <span>{idea.visibility || 'public'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 text-zinc-500 text-xs font-mono">
                        <div className="flex items-center bg-background border border-border px-2 py-0.5 rounded-lg">
                            <Heart className="w-3 h-3 mr-1 text-zinc-400" />
                            {idea.likesCount || 0}
                        </div>
                        <div className="flex items-center bg-background border border-border px-2 py-0.5 rounded-lg">
                            <span className="mr-1 text-[10px]">👁</span>
                            {idea.views || 0}
                        </div>
                        {idea.githubUrl && (
                            <Link href={idea.githubUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center bg-background border border-border hover:bg-white hover:text-black px-2 py-0.5 rounded-lg transition-colors group/gh">
                                    <Github className="w-3 h-3 text-zinc-400 group-hover/gh:text-black" />
                                </div>
                            </Link>
                        )}
                        <Link href={`/idea/${idea.id}`} target="_blank">
                            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-6.5 w-6.5 rounded-lg bg-background border border-border p-0 hover:bg-white/5">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white leading-tight uppercase">
                    {idea.title}
                </h2>

                <div className="space-y-4 relative">
                    <p className={`text-zinc-400 font-sans text-sm sm:text-base leading-relaxed transition-all duration-300 ${isExpanded ? "" : "line-clamp-6"}`}>
                        {idea.idea}
                    </p>
                    {idea.idea.length > 240 && (
                        <div className={`flex justify-start ${isExpanded ? "pt-1" : "absolute bottom-0 left-0 right-0 pt-8 bg-gradient-to-t from-card via-card/90 to-transparent"}`}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="text-pink-500 hover:text-pink-400 font-mono text-[10px] font-black uppercase tracking-widest bg-card px-2 py-0.5 rounded border border-pink-500/20 hover:bg-pink-500/5 transition-all shadow-sm cursor-pointer z-30"
                            >
                                {isExpanded ? "Read Less" : "Read More"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls: Tactile Dial buttons & monochrome pills */}
            <div className="pt-6 mt-4 flex justify-between items-center px-1 relative z-10 border-t border-border">
                {/* Manual Skip - Tactile circular outline dial */}
                <Button
                    onClick={() => handleManualSwipe("left")}
                    size="icon"
                    variant="outline"
                    className="w-12 h-12 rounded-full border border-white/20 bg-transparent text-zinc-400 hover:bg-white hover:text-black hover:border-white transition-all shadow-md flex items-center justify-center"
                    title="Skip Concept"
                >
                    <X className="w-5 h-5" />
                </Button>

                <div className="flex items-center space-x-2">
                    <Link href={`/idea/${idea.id}`}>
                        <Button variant="ghost" className="text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-widest font-bold rounded-lg bg-card border border-border hover:bg-white/5 px-4 h-9">
                            Read Details
                        </Button>
                    </Link>
                    {userMode === 'catalyst' ? (
                        <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!active) return;
                                handleManualSwipe("right");
                                alert("Concept Liked! Match request sent to the Architect. Chat will unlock once they accept.");
                            }}
                            className="text-pink-400 hover:text-pink-300 rounded-lg bg-card border border-pink-500/20 hover:bg-pink-500/5 w-9 h-9 flex items-center justify-center p-0 shadow-lg shadow-pink-500/5"
                            title="Like & Request Match"
                        >
                            <Heart className="w-3.5 h-3.5 fill-pink-500/20" />
                        </Button>
                    ) : (
                        <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={async (e) => {
                                e.stopPropagation();
                                const { getOrCreateChat } = await import("@/lib/messaging");
                                if (!active) return;
                                const { auth } = await import("@/lib/firebase");
                                const currentUser = auth.currentUser;
                                if (!currentUser) {
                                    window.location.href = "/login";
                                    return;
                                }
                                if (currentUser.uid === idea.userId) {
                                    alert("This is your idea. Visit Messages to see your chats.");
                                    return;
                                }
                                const chatId = await getOrCreateChat(currentUser.uid, idea.userId);
                                window.location.href = `/messages/${chatId}`;
                            }}
                            className="text-zinc-400 hover:text-white rounded-lg bg-card border border-border hover:bg-white/5 w-9 h-9 flex items-center justify-center p-0"
                            title="Chat with Architect"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!active) return;
                            alert("Reporting system active. Visit idea detail to file a priority report.");
                        }}
                        className="text-red-500/50 hover:text-red-400 rounded-lg bg-card border border-red-500/10 hover:bg-red-500/5 w-9 h-9 flex items-center justify-center p-0"
                        title="Report Misuse"
                    >
                        <Flag className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* Manual Like - Tactile solid white dial button */}
                <Button
                    onClick={() => handleManualSwipe("right")}
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white text-black hover:bg-black hover:text-white hover:border hover:border-white transition-all shadow-md flex items-center justify-center p-0"
                    title="Save Concept"
                >
                    <Heart className="w-5 h-5 fill-current" />
                </Button>
            </div>
        </motion.div>
    );
}
