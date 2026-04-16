"use client";

import { motion } from "framer-motion";
import { Globe, Building2, Navigation } from "lucide-react";

export type FilterMode = "global" | "city" | "nearby";
export type RadiusKm = 5 | 10 | 25 | "25+";

interface Props {
    mode: FilterMode;
    radius: RadiusKm;
    city: string | null;
    hasLocation: boolean;
    onModeChange: (mode: FilterMode) => void;
    onRadiusChange: (radius: RadiusKm) => void;
    showIdeas: boolean;
    showProblems: boolean;
    onToggleIdeas: () => void;
    onToggleProblems: () => void;
}

const RADII: RadiusKm[] = [5, 10, 25, "25+"];

export default function FilterBar({ mode, radius, city, hasLocation, onModeChange, onRadiusChange, showIdeas, showProblems, onToggleIdeas, onToggleProblems }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-16 lg:top-24 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center px-4"
        >
            <div
                className="flex items-center gap-1 p-1 rounded-2xl"
                style={{
                    background: "rgba(13,13,24,0.9)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                {/* Global */}
                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onModeChange("global")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${mode === "global"
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    Global
                    <span className="ml-1 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-[9px] text-amber-400 tracking-wider">PRO</span>
                </motion.button>

                {/* My City */}
                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onModeChange("city")}
                    disabled={!city}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${mode === "city"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    title={!city ? "Location not available" : `Filter to ${city}`}
                >
                    <Building2 className="w-3.5 h-3.5" />
                    My City
                </motion.button>

                {/* Nearby */}
                <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(168, 85, 247, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onModeChange("nearby")}
                    disabled={!hasLocation}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${mode === "nearby"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    title={!hasLocation ? "Enable location access" : "Filter by distance"}
                >
                    <Navigation className="w-3.5 h-3.5" />
                    Nearby
                </motion.button>
            </div>

            {/* Radius selector — only when nearby is active */}
            {mode === "nearby" && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 p-1 rounded-2xl"
                    style={{
                        background: "rgba(13,13,24,0.9)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(168,85,247,0.2)",
                    }}
                >
                    {RADII.map(r => (
                        <motion.button
                            key={r}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(168, 85, 247, 0.15)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onRadiusChange(r)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${radius === r
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "text-zinc-500 hover:text-zinc-300"
                                }`}
                        >
                            {r}{typeof r === "number" ? "km" : " km"}
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Entity Filter (Ideas / Problems) */}
            <div
                className="flex items-center gap-1 p-1 rounded-2xl"
                style={{
                    background: "rgba(13,13,24,0.9)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggleIdeas}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showIdeas
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        : "text-zinc-600 hover:text-zinc-400"
                        }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${showIdeas ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-zinc-800'} mr-1`} />
                    Ideas
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onToggleProblems}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showProblems
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "text-zinc-600 hover:text-zinc-400"
                        }`}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${showProblems ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]' : 'bg-zinc-800'} mr-1`} />
                    Problems
                </motion.button>
            </div>
        </motion.div>
    );
}
