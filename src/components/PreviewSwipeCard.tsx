"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { X, Heart, Lock } from "lucide-react";
import { Github } from "@/components/icons";

interface Idea {
    id: string;
    title: string;
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
    const [isExpanded, setIsExpanded] = useState(false);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-8, 0, 8]);
    const cardOpacity = useTransform(x, [-300, -150, 0, 150, 300], [0.85, 1, 1, 1, 0.85]);
    const dragScale = useTransform(x, [-300, 0, 300], [0.98, 1, 0.98]);

    const saveOpacity = useTransform(x, [0, 60, 150], [0, 0.3, 0.9]);
    const skipOpacity = useTransform(x, [-150, -60, 0], [0.9, 0.3, 0]);

    const triggerGate = useCallback((message: string) => {
        setGateMessage(message);
        setShowGate(true);
        // Auto-redirect after a brief moment showing the gate
        setTimeout(() => {
            window.location.href = "/signup";
        }, 2200);
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
                    className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl overflow-hidden"
                >
                    {/* Dark card backdrop */}
                    <div className="absolute inset-0 bg-card/95 backdrop-blur-md border border-border" />

                    {/* Structural hairline graph grid within the gate chassis */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                        className="relative z-10 text-center space-y-6 p-8 w-full max-w-sm"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-blue-500/5 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20"
                        >
                            <Lock className="w-6 h-6 text-white" />
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold font-sans tracking-tight text-white leading-snug uppercase">{gateMessage}</h3>
                            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Redirecting to sign up console...</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.href = "/signup"}
                                className="bg-white text-black hover:bg-black hover:text-white border border-white rounded-xl px-8 h-12 font-mono uppercase tracking-widest text-xs font-bold transition-all"
                            >
                                Create Free Account
                            </Button>
                            <Button
                                onClick={() => window.location.href = "/login"}
                                variant="ghost"
                                className="text-zinc-500 hover:text-white rounded-xl px-6 h-10 font-mono uppercase tracking-widest text-[9px] font-bold border border-border bg-card hover:bg-white/5"
                            >
                                Log In to Existing Account
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Ghost cards behind for depth feel */}
            <div className="absolute inset-0 scale-[0.98] translate-y-2.5 opacity-30 bg-card rounded-3xl border border-border" />
            <div className="absolute inset-0 scale-[0.96] translate-y-5 opacity-10 bg-card rounded-3xl border border-border" />

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
                className="absolute inset-0 flex flex-col justify-between bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 cursor-grab active:cursor-grabbing overflow-hidden"
            >
                {/* Structural hairline graph grid within the card chassis */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                {/* Swipe Direction Indicators */}
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

                <div className="flex-1 overflow-y-auto space-y-6 select-none hide-scrollbar relative z-10">
                    <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold font-mono bg-white/5 text-zinc-400 border border-border uppercase tracking-wider">
                            {idea.category}
                        </span>
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
                                <div className="flex items-center bg-background border border-border px-2 py-0.5 rounded-lg group/gh">
                                    <Github className="w-3 h-3 text-zinc-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight text-white leading-tight uppercase">
                        {idea.title}
                    </h2>

                    <div className="relative">
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

                <div className="pt-6 mt-4 flex justify-between items-center px-1 relative z-10 border-t border-border">
                    {/* Skip trigger */}
                    <Button
                        onClick={() => handleManualSwipe("left")}
                        size="icon"
                        variant="outline"
                        className="w-12 h-12 rounded-full border border-white/20 bg-transparent text-zinc-400 hover:bg-white hover:text-black hover:border-white transition-all shadow-md flex items-center justify-center"
                        title="Skip Concept"
                    >
                        <X className="w-5 h-5" />
                    </Button>

                    <Button
                        onClick={handleReadMore}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white text-[9px] font-mono uppercase tracking-widest font-bold rounded-lg bg-card border border-border hover:bg-white/5 px-6 h-9"
                    >
                        Read Details
                    </Button>

                    {/* Like trigger */}
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
        </div>
    );
}
