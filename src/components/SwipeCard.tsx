"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { X, Heart, ExternalLink } from "lucide-react";
import { Github } from "@/components/icons";
import Link from "next/link";

interface Idea {
    id: string;
    title: string;
    problem: string;
    idea: string;
    category: string;
    userId: string;
    likesCount?: number;
    views?: number;
    githubUrl?: string;
}

interface SwipeCardProps {
    idea: Idea;
    onSwipe: (dir: "left" | "right") => void;
    active: boolean;
    zIndex: number;
}

const SWIPE_THRESHOLD = 80;
const EXIT_DISTANCE = 600;

export default function SwipeCard({ idea, onSwipe, active, zIndex }: SwipeCardProps) {
    const [exiting, setExiting] = useState(false);

    const x = useMotionValue(0);
    // Gentler rotation — max ±12° at ±300px drag
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
    // Keep full opacity during drag, only dim slightly at extremes
    const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.85, 1, 1, 1, 0.85]);
    // Subtle scale breathing during drag
    const dragScale = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95]);

    // Swipe direction indicator overlays
    const likeOpacity = useTransform(x, [0, 60, 150], [0, 0.4, 1]);
    const nopeOpacity = useTransform(x, [-150, -60, 0], [1, 0.4, 0]);

    // Background glow that shifts with swipe direction
    // const bgGlowX = useTransform(x, [-200, 0, 200], [-30, 0, 30]);

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

        // Swipe if past threshold OR if velocity is high enough (flick gesture)
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
            initial={active ? { scale: 1, y: 0 } : { scale: 0.95, y: 8 }}
            animate={
                exiting
                    ? {} // Let the imperative animate() handle exit
                    : active
                    ? { scale: 1, y: 0, opacity: 1 }
                    : { scale: 0.95, y: 8, opacity: 0.6 }
            }
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
            }}
            className={`absolute inset-0 flex flex-col justify-between bg-[#121218]/95 backdrop-blur-sm border border-white/[0.06] rounded-[32px] shadow-2xl p-6 sm:p-8 cursor-grab active:cursor-grabbing ${!active ? 'pointer-events-none' : ''}`}
        >
            {/* Swipe Direction Indicators */}
            {active && (
                <>
                    {/* LIKE overlay */}
                    <motion.div
                        style={{ opacity: likeOpacity }}
                        className="absolute inset-0 rounded-[32px] border-[3px] border-green-400/60 pointer-events-none z-20 flex items-start justify-start p-8"
                    >
                        <div className="px-4 py-2 rounded-xl border-2 border-green-400 text-green-400 font-black text-xl tracking-wider rotate-[-12deg] uppercase">
                            Like
                        </div>
                    </motion.div>
                    {/* NOPE overlay */}
                    <motion.div
                        style={{ opacity: nopeOpacity }}
                        className="absolute inset-0 rounded-[32px] border-[3px] border-red-400/60 pointer-events-none z-20 flex items-start justify-end p-8"
                    >
                        <div className="px-4 py-2 rounded-xl border-2 border-red-400 text-red-400 font-black text-xl tracking-wider rotate-[12deg] uppercase">
                            Nope
                        </div>
                    </motion.div>
                </>
            )}

            <div className="flex-1 overflow-y-auto space-y-6 select-none hide-scrollbar relative z-10">
                <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {idea.category}
                    </span>
                    <div className="flex items-center space-x-3 text-zinc-400 text-sm font-medium">
                        <div className="flex items-center bg-white/5 px-2 py-1 rounded-full">
                            <Heart className="w-3.5 h-3.5 mr-1 text-red-400" />
                            {idea.likesCount || 0}
                        </div>
                        <div className="flex items-center bg-white/5 px-2 py-1 rounded-full">
                            <span className="mr-1 text-zinc-300">👁️</span>
                            {idea.views || 0}
                        </div>
                        {idea.githubUrl && (
                            <Link href={idea.githubUrl} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full group/gh transition-colors">
                                    <Github className="w-3.5 h-3.5 text-zinc-400 group-hover/gh:text-white" />
                                </div>
                            </Link>
                        )}
                        <Link href={`/idea/${idea.id}`} target="_blank">
                            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-7 w-7 rounded-full ml-1">
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white leading-tight">
                    {idea.title}
                </h2>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">The Problem</h3>
                        <p className="text-zinc-300 text-lg line-clamp-4">{idea.problem}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">The Idea</h3>
                        <p className="text-white text-lg line-clamp-6">{idea.idea}</p>
                    </div>
                </div>
            </div>

            <div className="pt-6 mt-4 flex justify-between items-center px-2 relative z-10">
                <Button
                    onClick={() => handleManualSwipe("left")}
                    size="icon"
                    variant="outline"
                    className="w-16 h-16 rounded-full border-none bg-white/[0.04] text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 transform hover:scale-110 shadow-md"
                >
                    <X className="w-8 h-8" />
                </Button>

                <Link href={`/idea/${idea.id}`}>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-6">
                        Read Details
                    </Button>
                </Link>

                <Button
                    onClick={() => handleManualSwipe("right")}
                    size="icon"
                    className="w-16 h-16 rounded-full border-none bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-110 shadow-[0_8px_30px_rgb(168,85,247,0.4)]"
                >
                    <Heart className="w-8 h-8 fill-current" />
                </Button>
            </div>
        </motion.div>
    );
}
