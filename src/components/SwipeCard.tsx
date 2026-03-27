"use client";

import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Button } from "./ui/button";
import { X, Heart, ExternalLink } from "lucide-react";
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
}

interface SwipeCardProps {
    idea: Idea;
    onSwipe: (dir: "left" | "right") => void;
    active: boolean;
    zIndex: number;
}

export default function SwipeCard({ idea, onSwipe, active, zIndex }: SwipeCardProps) {
    const [exitX, setExitX] = useState<number | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
    const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8]);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) {
            setExitX(300);
            onSwipe("right");
        } else if (info.offset.x < -100) {
            setExitX(-300);
            onSwipe("left");
        }
    };

    const handleManualSwipe = (dir: "left" | "right") => {
        setExitX(dir === "left" ? -300 : 300);
        onSwipe(dir);
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity,
                scale,
                zIndex,
            }}
            drag={active ? "x" : false}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            animate={exitX !== null ? { x: exitX, opacity: 0, scale: 0.8 } : {}}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 flex flex-col justify-between bg-[#121218] border border-white/[0.04] rounded-[32px] shadow-2xl p-6 sm:p-8 cursor-grab active:cursor-grabbing ${!active ? 'pointer-events-none' : ''}`}
        >
            <div className="flex-1 overflow-y-auto space-y-6 select-none hide-scrollbar">
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

            <div className="pt-6 mt-4 flex justify-between items-center px-2">
                <Button
                    onClick={() => handleManualSwipe("left")}
                    size="icon"
                    variant="outline"
                    className="w-16 h-16 rounded-full border-none bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white transition-all transform hover:scale-105 shadow-md"
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
                    className="w-16 h-16 rounded-full border-none bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all transform hover:scale-105 shadow-[0_8px_30px_rgb(168,85,247,0.4)]"
                >
                    <Heart className="w-8 h-8 fill-current" />
                </Button>
            </div>
        </motion.div>
    );
}
