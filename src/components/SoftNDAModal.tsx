"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { Button } from "./ui/button";

interface SoftNDAModalProps {
    isOpen: boolean;
    onAccept: () => void;
    ideaTitle: string;
}

export default function SoftNDAModal({ isOpen, onAccept, ideaTitle }: SoftNDAModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                        <div className="relative z-10 space-y-8 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto shadow-inner">
                                <ShieldAlert className="w-10 h-10 text-indigo-400" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-light text-white tracking-tight leading-tight">
                                    Confidentiality <span className="text-indigo-400 font-bold italic">Agreement</span>
                                </h2>
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                                    This idea is shared for evaluation purposes only. You are accessing <span className="text-white font-bold">"{ideaTitle}"</span>.
                                </p>
                            </div>

                            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] text-left space-y-4">
                                <div className="flex gap-4">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3 h-3 text-green-400" />
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                        I agree to respect the intellectual property of the creator and will not replicate or disclose this concept without explicit permission.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Lock className="w-3 h-3 text-indigo-400" />
                                    </div>
                                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                                        I understand that my access will be logged and traceable for accountability.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={onAccept}
                                    className="w-full h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                                >
                                    I Agree & Continue
                                </Button>
                                <p className="mt-6 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                                    Trust-driven innovation by Inzly
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
