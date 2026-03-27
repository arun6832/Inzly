"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save additional user defaults to Firestore
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name,
                email,
                country: country || "Unknown",
                totalLikes: 0,
                createdAt: serverTimestamp(),
            });

            // Show success state instantly to give user feedback
            setSuccess(true);

            // Delay redirect slightly for UX so they can read the success message
            setTimeout(() => {
                window.location.href = "/";
            }, 1000);

        } catch (err: any) {
            setError(err.message || "Failed to create an account.");
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 bg-zinc-900/60 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">Account Created!</h2>
                    <p className="text-zinc-400">Taking you to the feed...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-extrabold tracking-tight text-white mb-3">Join Inzly</h2>
                        <p className="text-zinc-400">Create an account to discover, save, and discuss startup ideas.</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-300 font-medium ml-1">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Arun M"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

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
                                <Label className="text-zinc-300 font-medium ml-1">Country</Label>
                                <Select value={country} onValueChange={(val) => setCountry(val || "")}>
                                    <SelectTrigger className="w-full h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all">
                                        <SelectValue placeholder="Select your country" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="United States">United States</SelectItem>
                                        <SelectItem value="India">India</SelectItem>
                                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                        <SelectItem value="Canada">Canada</SelectItem>
                                        <SelectItem value="Australia">Australia</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 font-medium ml-1">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all group mt-2"
                            disabled={loading}
                        >
                            {loading ? "Creating your account..." : (
                                <>
                                    Create Account
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-zinc-400">
                            Already have an account?{" "}
                            <Link href="/login" className="text-white hover:text-blue-400 font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
