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
            // Force a hard redirect so user immediately feels logged in and page re-evaluates auth state immediately
            window.location.href = "/";
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to login. Please check your credentials.");
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-3">Welcome back</h2>
                        <p className="text-zinc-400">Enter your credentials to continue discovering great ideas.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300 font-medium ml-1">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                                    <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all group"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-zinc-400">
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className="text-white hover:text-blue-400 font-semibold transition-colors">
                                Sign up for free
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
