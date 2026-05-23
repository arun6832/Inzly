"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LogMessage {
    id: string;
    timestamp: string;
    level: "INFO" | "SUCCESS" | "WARN" | "CORE";
    message: string;
}

const DUMMY_MESSAGES = [
    { level: "INFO", message: "handshake handshake initialized with node_nz_01" },
    { level: "SUCCESS", message: "handshake verification completed successfully" },
    { level: "INFO", message: "decrypting core sector metrics for active explorers" },
    { level: "CORE", message: "integrity metrics loaded. trust factor: stable" },
    { level: "SUCCESS", message: "ip location encrypted. vector mapping complete" },
    { level: "INFO", message: "scanning District coordinates for local opportunities" },
    { level: "WARN", message: "high concept density detected in vector 5km" },
    { level: "SUCCESS", message: "telemetry pulse established with Firestore core" },
    { level: "INFO", message: "updating user reputation score cache" },
    { level: "CORE", message: " inzly shielding: active at 98.4% efficiency" },
    { level: "INFO", message: "syncing collaborative pipeline threads" },
    { level: "SUCCESS", message: "connection pipe optimized for Turbopack compiler" }
];

export default function AuthTelemetryPanel({ activePage }: { activePage: string }) {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [systemLoad, setSystemLoad] = useState(24.8);
    const [activeNodes, setActiveNodes] = useState(148);
    const [latency, setLatency] = useState(14);

    // Dynamic telemetry updates
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemLoad(prev => parseFloat((prev + (Math.random() * 2 - 1)).toFixed(1)));
            setActiveNodes(prev => prev + (Math.random() > 0.6 ? 1 : Math.random() < 0.4 ? -1 : 0));
            setLatency(prev => Math.max(8, prev + Math.floor(Math.random() * 5 - 2)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Live logging system
    useEffect(() => {
        // Initial set of logs
        const initialLogs: LogMessage[] = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date(Date.now() - (6 - i) * 8000);
            const timeStr = date.toLocaleTimeString([], { hour12: false });
            const item = DUMMY_MESSAGES[i % DUMMY_MESSAGES.length];
            initialLogs.push({
                id: Math.random().toString(),
                timestamp: timeStr,
                level: item.level as any,
                message: item.message
            });
        }
        setLogs(initialLogs);

        // Keep pushing new logs
        const logInterval = setInterval(() => {
            const date = new Date();
            const timeStr = date.toLocaleTimeString([], { hour12: false });
            const item = DUMMY_MESSAGES[Math.floor(Math.random() * DUMMY_MESSAGES.length)];
            
            setLogs(prev => [
                ...prev.slice(1), 
                {
                    id: Math.random().toString(),
                    timestamp: timeStr,
                    level: item.level as any,
                    message: item.message
                }
            ]);
        }, 4500);

        return () => clearInterval(logInterval);
    }, []);

    return (
        <div className="hidden lg:flex flex-col bg-black border-r border-white/10 p-8 font-mono text-[9px] relative overflow-hidden select-none select-none">
            {/* Structural grid background */}
            <div className="absolute inset-0 z-0 opacity-15 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            {/* Environment lines */}
            <div className="absolute left-0 right-0 top-16 h-px bg-white/5 z-10"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 z-10"></div>

            {/* Header Telemetry */}
            <div className="flex justify-between items-center z-20 relative mb-12">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    <span className="font-bold tracking-widest text-[9px] text-white uppercase">INZLY SECURE PIPELINE</span>
                </div>
                <div className="text-zinc-500 uppercase tracking-widest">
                    SYSTEM STATUS: <span className="text-white font-bold">ONLINE</span>
                </div>
            </div>

            {/* Dynamic visual radar core */}
            <div className="flex-1 flex flex-col justify-center items-center relative z-20 my-10 space-y-8">
                <div className="relative w-44 h-44 flex items-center justify-center border border-white/5">
                    {/* Corner decorators */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white/40"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-white/40"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-white/40"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-white/40"></div>
                    
                    {/* Radar swept concentric circles */}
                    <div className="absolute inset-4 rounded-full border border-dashed border-white/5"></div>
                    <div className="absolute inset-10 rounded-full border border-white/5"></div>
                    <div className="absolute inset-20 rounded-full border border-white/10"></div>

                    {/* Rotating grid sweeping arm */}
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.06)_0deg,transparent_120deg)] pointer-events-none"
                    />

                    {/* Inner core dial */}
                    <div className="w-12 h-12 bg-black border border-white/15 flex flex-col items-center justify-center">
                        <span className="font-dot text-white text-[12px] font-bold tracking-widest">{latency}</span>
                        <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-wider">MS</span>
                    </div>
                </div>

                {/* Grid analytics table */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-sm border border-white/10 bg-black p-4 relative">
                    <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white"></div>

                    <div className="flex flex-col">
                        <span className="text-zinc-500 uppercase tracking-wider font-bold">SYSTEM LOAD</span>
                        <span className="text-[14px] font-bold text-white font-dot tracking-widest mt-1">{systemLoad}%</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-zinc-500 uppercase tracking-wider font-bold">NODE CLUSTER</span>
                        <span className="text-[14px] font-bold text-white font-dot tracking-widest mt-1">{activeNodes}</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4">
                        <span className="text-zinc-500 uppercase tracking-wider font-bold">SECTOR AUTH</span>
                        <span className="text-[14px] font-bold text-white mt-1 uppercase tracking-widest">{activePage}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Real-time logs panel */}
            <div className="w-full border-t border-white/10 pt-6 z-20 relative bg-black/60 backdrop-blur-sm min-h-[140px] flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-zinc-500 uppercase font-bold tracking-widest">LIVE EVENT DATALOGGER</span>
                    <span className="px-2 py-0.5 border border-white/10 text-white rounded-none uppercase text-[8px] font-bold tracking-widest">BUFFERS OK</span>
                </div>

                <div className="flex-1 space-y-1.5 overflow-hidden select-none select-none text-[8px] font-mono leading-relaxed">
                    <AnimatePresence mode="popLayout">
                        {logs.map((log) => {
                            const levelColors = {
                                INFO: "text-zinc-500",
                                SUCCESS: "text-white font-bold",
                                WARN: "text-red-500 font-bold",
                                CORE: "text-zinc-300 font-bold border-l-2 border-white pl-1"
                            };

                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex gap-3 items-start"
                                >
                                    <span className="text-zinc-600 font-bold shrink-0">{log.timestamp}</span>
                                    <span className="text-zinc-700 shrink-0 uppercase tracking-widest">[{log.level}]</span>
                                    <span className={`uppercase tracking-wider ${levelColors[log.level]}`}>
                                        {log.message}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
