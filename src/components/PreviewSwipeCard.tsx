"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { X, Heart, Lock, ExternalLink } from "lucide-react";
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

interface PreviewSwipeCardProps {
    idea: Idea;
}

const SWIPE_THRESHOLD = 50;

export default function PreviewSwipeCard({ idea }: PreviewSwipeCardProps) {
    const [showGate, setShowGate] = useState(false);
    const [gateMessage, setGateMessage] = useState("");

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
    const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.85, 1, 1, 1, 0.85]);
    const dragScale = useTransform(x, [-300, 0, 300], [0.95, 1, 0.95]);

    const likeOpacity = useTransform(x, [0, 60, 150], [0, 0.4, 1]);
    const nopeOpacity = useTransform(x, [-150, -60, 0], [1, 0.4, 0]);

    const triggerGate = useCallback((message: string) => {
        setGateMessage(message);
        setShowGate(true);
        // Auto-redirect after a brief moment showing the gate
        setTimeout(() => {
            window.location.href = "/signup";
        }, 1800);
    }, []);

    const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (Math.abs(offset) > SWIPE_THRESHOLD || Math.abs(velocity) > 400) {
            // User tried to swipe — show gate then redirect
            const dir = offset > 0 || velocity > 400 ? "right" : "left";
            const exitTarget = dir === "right" ? 200 : -200;

            animate(x, exitTarget, {
                type: "spring",
                stiffness: 300,
                damping: 30,
                velocity: x.getVelocity(),
            });

            setTimeout(() => {
                triggerGate(dir === "right" ? "Sign up to save ideas you love" : "Sign up to discover more ideas");
            }, 200);
        } else {
            // Spring back
            animate(x, 0, {
                type: "spring",
                stiffness: 500,
                damping: 35,
            });
        }
    }, [x, triggerGate]);

    const handleReadMore = () => {
        triggerGate("Sign up to read full idea details");
    };

    const handleManualSwipe = (dir: "left" | "right") => {
        const exitTarget = dir === "right" ? 200 : -200;
        animate(x, exitTarget, {
            type: "spring",
            stiffness: 300,
            damping: 30,
        });
        setTimeout(() => {
            triggerGate(dir === "right" ? "Sign up to save ideas you love" : "Sign up to discover more ideas");
        }, 200);
    };

    return (
        <div className="relative w-full h-[580px] sm:h-[640px] max-h-[75vh]">
            {/* Auth Gate Overlay */}
            {showGate && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 flex items-center justify-center rounded-[32px] overflow-hidden"
                >
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-[#0B0B0F]/80 backdrop-blur-xl" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                        className="relative z-10 text-center space-y-6 p-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto border border-white/10"
                        >
                            <Lock className="w-9 h-9 text-indigo-400" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">{gateMessage}</h3>
                            <p className="text-zinc-400 text-sm">Redirecting to sign up...</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.href = "/signup"}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-full px-10 h-12 font-semibold shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                            >
                                Create Free Account
                            </Button>
                            <Button
                                onClick={() => window.location.href = "/login"}
                                variant="ghost"
                                className="text-zinc-400 hover:text-white rounded-full px-8 h-10 font-medium"
                            >
                                Already have an account? Log in
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Ghost card behind for depth feel */}
            <div className="absolute inset-0 scale-[0.95] translate-y-2 opacity-30 bg-[#121218]/80 rounded-[32px] border border-white/[0.03]" />
            <div className="absolute inset-0 scale-[0.90] translate-y-4 opacity-15 bg-[#121218]/60 rounded-[32px] border border-white/[0.02]" />

            {/* Main interactive preview card */}
            <motion.div
                style={{
                    x,
                    rotate,
                    opacity: cardOpacity,
                    scale: dragScale,
                }}
                drag={!showGate ? "x" : false}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.9}
                dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                onDragEnd={handleDragEnd}
                className="absolute inset-0 flex flex-col justify-between bg-[#121218]/95 backdrop-blur-sm border border-white/[0.06] rounded-[32px] shadow-2xl p-6 sm:p-8 cursor-grab active:cursor-grabbing"
            >
                {/* Swipe Direction Indicators */}
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
                        <div className="relative">
                            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">The Idea</h3>
                            <p className="text-white text-lg line-clamp-3">{idea.idea}</p>
                            {/* Fade-out gradient to tease more content */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#121218] to-transparent pointer-events-none" />
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

                    <Button
                        onClick={handleReadMore}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-6"
                    >
                        Read Details
                    </Button>

                    <Button
                        onClick={() => handleManualSwipe("right")}
                        size="icon"
                        className="w-16 h-16 rounded-full border-none bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all duration-300 transform hover:scale-110 shadow-[0_8px_30px_rgb(168,85,247,0.4)]"
                    >
                        <Heart className="w-8 h-8 fill-current" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
