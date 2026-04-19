"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Flag, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => void;
    ideaTitle: string;
}

const REPORT_REASONS = [
    "Idea Misuse / Replication",
    "Plagiarism / Copying",
    "Suspicious Behavior",
    "Inappropriate Content",
    "Spam / Low Quality",
    "Other"
];

export default function ReportModal({ isOpen, onClose, onSubmit, ideaTitle }: ReportModalProps) {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleReport = () => {
        if (!reason) return;
        setSubmitting(true);
        onSubmit(reason, description);
        setTimeout(() => {
            setSubmitting(false);
            onClose();
        }, 800);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 sm:p-10 space-y-8 relative">
                            <button 
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <Flag className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Protect Ecosystem</h3>
                                    <p className="text-xs text-zinc-500 font-medium">Reporting: <span className="text-white">"{ideaTitle}"</span></p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Select Violation</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {REPORT_REASONS.map((r) => (
                                            <button
                                                key={r}
                                                onClick={() => setReason(r)}
                                                className={`px-4 py-3 rounded-xl border text-[11px] font-bold text-left transition-all ${
                                                    reason === r 
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                                    : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                                                }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Context & Details (Optional)</label>
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Please provide more information about the violation..."
                                        className="min-h-[100px] bg-white/[0.02] border-white/5 text-white rounded-xl focus-visible:ring-red-500/50 p-4 text-xs resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-zinc-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={!reason || submitting}
                                    onClick={handleReport}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-500/10 transition-all hover:scale-[1.02]"
                                >
                                    {submitting ? 'Transmitting...' : 'Submit Report'}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-red-500/5 px-8 py-4 border-t border-red-500/10 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-red-400/50" />
                            <p className="text-[10px] text-zinc-500 font-medium">Your report will be reviewed by the Inzly security team. Thank you for keeping the platform safe.</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
