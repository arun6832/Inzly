"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import AuthTelemetryPanel from "@/components/AuthTelemetryPanel";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await sendPasswordResetEmail(auth, email);
            setSent(true);
        } catch (err) {
            const e = err as { code?: string; message?: string };
            if (e.code === "auth/user-not-found") {
                setError("No account found with this email address.");
            } else {
                setError(e.message || "Failed to send reset email.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black min-h-[90vh] overflow-hidden">
                <AuthTelemetryPanel activePage="RE-KEY" />
                
                <div className="flex items-center justify-center p-4 bg-black nothing-grid">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md relative z-10"
                    >
                        <div className="bg-black p-8 sm:p-10 rounded-none border border-white/10 shadow-2xl text-center space-y-6 relative overflow-hidden">
                            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                            <div className="z-10 relative space-y-4 font-mono">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="w-16 h-16 bg-white/5 rounded-none border border-white/10 flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </motion.div>
                                <h2 className="text-xl font-bold font-dot uppercase tracking-wider text-white">Transmitted</h2>
                                <p className="text-[10px] uppercase text-zinc-500 leading-relaxed">
                                    A password reset payload was sent to <span className="text-white font-bold">{email}</span>. Click the link to proceed.
                                </p>
                                <p className="text-zinc-600 text-[9px] uppercase tracking-widest leading-relaxed">
                                    No receipt? Verify spelling or scan your spam directory.
                                </p>
                                <div className="pt-4 flex flex-col gap-3">
                                    <Button
                                        onClick={() => setSent(false)}
                                        variant="ghost"
                                        className="text-zinc-500 hover:text-white uppercase tracking-widest text-[9px] font-bold font-mono h-10 border border-white/5 hover:border-white/10 rounded-none bg-transparent"
                                    >
                                        Transmit Again
                                    </Button>
                                    <Link href="/login" className="block">
                                        <Button className="w-full h-11 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-mono uppercase tracking-widest text-xs font-bold transition-all">
                                            <ArrowLeft className="mr-2 h-4 w-4 inline" /> Return to Login
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black min-h-[90vh] overflow-hidden">
            <AuthTelemetryPanel activePage="RE-KEY" />
            
            <div className="flex items-center justify-center p-4 py-12 relative bg-black nothing-grid">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-black p-8 sm:p-10 rounded-none border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                        <div className="z-10 relative">
                            <Link href="/login" className="inline-flex items-center text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest mb-8 transition-colors">
                                <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to login
                            </Link>

                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold font-dot uppercase tracking-wider text-white mb-2">Reset Password</h2>
                                <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest leading-relaxed">Enter your email vector to retrieve authentication credentials.</p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-4">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-black border border-red-500/30 text-red-500 text-[10px] font-mono uppercase tracking-wider rounded-none"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 font-mono text-xs placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-mono uppercase tracking-widest text-xs font-bold transition-all mt-4"
                                    disabled={loading}
                                >
                                    {loading ? "Transmitting..." : "Send Reset Vector"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
