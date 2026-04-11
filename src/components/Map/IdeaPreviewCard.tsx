"use client";

import { X, ExternalLink, MapPin, Heart, Eye } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { MapIdea } from "@/lib/geoUtils";

const CATEGORY_COLORS: Record<string, string> = {
    "AI/ML": "#6366f1",
    "FinTech": "#10b981",
    "HealthTech": "#f43f5e",
    "EdTech": "#f59e0b",
    "SaaS": "#a855f7",
    "CleanTech": "#14b8a6",
    "AgriTech": "#84cc16",
    "Social": "#ec4899",
};

interface Props {
    idea: MapIdea | null;
    onClose: () => void;
}

export default function IdeaPreviewCard({ idea, onClose }: Props) {
    const color = idea ? (CATEGORY_COLORS[idea.category] || "#6366f1") : "#6366f1";

    return (
        <AnimatePresence>
            {idea && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-[1000]"
                >
                    <div
                        className="relative rounded-3xl overflow-hidden shadow-2xl"
                        style={{
                            background: "rgba(13, 13, 24, 0.92)",
                            backdropFilter: "blur(20px)",
                            border: `1px solid ${color}40`,
                        }}
                    >
                        {/* Glow accent */}
                        <div
                            className="absolute top-0 left-0 w-full h-1"
                            style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                        />

                        <div className="p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                            style={{ background: `${color}20`, color }}
                                        >
                                            {idea.category}
                                        </span>
                                        {idea.city && (
                                            <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                                                <MapPin className="w-2.5 h-2.5" />
                                                {idea.city}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-base font-black text-white leading-tight truncate">{idea.title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full text-zinc-600 hover:text-white transition-colors flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Problem preview */}
                            <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed mb-4">{idea.idea}</p>

                            {/* Stats + CTA */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-zinc-600">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {idea.likesCount || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {idea.views || 0}
                                    </span>
                                    {idea.authorUsername && (
                                        <span className="text-zinc-600">@{idea.authorUsername}</span>
                                    )}
                                </div>
                                <Link
                                    href={`/idea/${idea.id}`}
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
                                    style={{ background: `${color}20`, color }}
                                >
                                    Open <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
