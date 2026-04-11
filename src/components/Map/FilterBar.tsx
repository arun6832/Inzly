"use client";

import { motion } from "framer-motion";
import { Globe, Building2, Navigation } from "lucide-react";

export type FilterMode = "global" | "city" | "nearby";
export type RadiusKm = 5 | 10 | 25;

interface Props {
    mode: FilterMode;
    radius: RadiusKm;
    city: string | null;
    hasLocation: boolean;
    onModeChange: (mode: FilterMode) => void;
    onRadiusChange: (radius: RadiusKm) => void;
}

const RADII: RadiusKm[] = [5, 10, 25];

export default function FilterBar({ mode, radius, city, hasLocation, onModeChange, onRadiusChange }: Props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center px-4"
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
                <button
                    onClick={() => onModeChange("global")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        mode === "global"
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                >
                    <Globe className="w-3.5 h-3.5" />
                    Global
                </button>

                {/* My City */}
                <button
                    onClick={() => onModeChange("city")}
                    disabled={!city}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        mode === "city"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    title={!city ? "Location not available" : `Filter to ${city}`}
                >
                    <Building2 className="w-3.5 h-3.5" />
                    {city ? city : "My City"}
                </button>

                {/* Nearby */}
                <button
                    onClick={() => onModeChange("nearby")}
                    disabled={!hasLocation}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                        mode === "nearby"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-zinc-500 hover:text-zinc-300"
                    }`}
                    title={!hasLocation ? "Enable location access" : "Filter by distance"}
                >
                    <Navigation className="w-3.5 h-3.5" />
                    Nearby
                </button>
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
                        <button
                            key={r}
                            onClick={() => onRadiusChange(r)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                radius === r
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "text-zinc-500 hover:text-zinc-300"
                            }`}
                        >
                            {r}km
                        </button>
                    ))}
                </motion.div>
            )}
        </motion.div>
    );
}
