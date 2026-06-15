"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import AuthTelemetryPanel from "@/components/AuthTelemetryPanel";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "/";
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to login. Please check your credentials.");
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black min-h-[90vh] overflow-hidden">
            <AuthTelemetryPanel activePage="AUTHORIZE" />
            
            <div className="flex items-center justify-center p-4 py-12 relative bg-black nothing-grid">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-card p-8 sm:p-10 rounded-2xl border border-border shadow-2xl relative overflow-hidden">
                        {/* Hairline graph pattern inside form block */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                        <div className="text-center mb-10 z-10 relative">
                            <h2 className="text-3xl font-bold font-dot tracking-tight text-white mb-2">Welcome back</h2>
                            <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest leading-relaxed">Enter your credentials to continue discovering startup concepts.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6 z-10 relative">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-black border border-red-500/30 text-red-500 text-[10px] font-mono uppercase tracking-wider rounded-none"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
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
                                            className="pl-10 h-12 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1 font-mono text-[9px]">
                                        <Label htmlFor="password" className="text-zinc-400 font-bold uppercase tracking-widest">Password</Label>
                                        <Link href="/forgot-password" className="text-zinc-500 hover:text-white uppercase tracking-wider transition-colors">Forgot?</Link>
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="pl-10 h-12 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 border border-blue-500 rounded-xl font-sans font-semibold text-sm transition-all group mt-2"
                                disabled={loading}
                            >
                                {loading ? "Authorizing..." : (
                                    <>
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center z-10 relative font-mono text-[10px]">
                            <p className="text-zinc-500 uppercase tracking-widest">
                                New innovator?{" "}
                                <Link href="/signup" className="text-white hover:underline font-bold transition-colors">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
