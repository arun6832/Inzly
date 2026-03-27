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
        } catch (err: any) {
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email address.");
            } else {
                setError(err.message || "Failed to send reset email.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0%,transparent_70%)] pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Click the link in the email to set a new password.
                        </p>
                        <p className="text-zinc-500 text-sm">
                            Didn't receive it? Check your spam folder or try again.
                        </p>
                        <div className="pt-4 flex flex-col gap-3">
                            <Button
                                onClick={() => setSent(false)}
                                variant="ghost"
                                className="text-zinc-400 hover:text-white"
                            >
                                Send again
                            </Button>
                            <Link href="/login">
                                <Button variant="ghost" className="text-indigo-400 hover:text-indigo-300 w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15)_0%,transparent_70%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
                    <Link href="/login" className="inline-flex items-center text-zinc-400 hover:text-white text-sm mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
                    </Link>

                    <div className="text-left mb-10">
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">Reset password</h2>
                        <p className="text-zinc-400">Enter your email and we'll send you a link to reset your password.</p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

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
                                    className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
