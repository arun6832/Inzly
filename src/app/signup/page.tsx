"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
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
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("");
    const [bio, setBio] = useState("");
    const [error, setError] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [success, setSuccess] = useState(false);

    const validateUsername = (val: string) => {
        const regex = /^[a-zA-Z0-9_]{3,15}$/;
        if (!val) return "";
        if (!regex.test(val)) return "Username must be 3-15 characters (letters, numbers, underscores).";
        return "";
    };

    const handleUsernameChange = async (val: string) => {
        const cleanVal = val.toLowerCase().replace(/\s/g, "");
        setUsername(cleanVal);
        const validationErr = validateUsername(cleanVal);
        setUsernameError(validationErr);

        if (!validationErr && cleanVal.length >= 3) {
            setCheckingUsername(true);
            try {
                const { collection, query, where, getDocs } = await import("firebase/firestore");
                const q = query(collection(db, "users"), where("username", "==", cleanVal));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setUsernameError("Username is already taken.");
                }
            } catch (err) {
                console.error("Username check failed", err);
            } finally {
                setCheckingUsername(false);
            }
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const vErr = validateUsername(username);
        if (vErr || usernameError) {
            setError(vErr || usernameError);
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name,
                username: username.toLowerCase(),
                email,
                country: country || "Unknown",
                bio: bio || "",
                totalLikes: 0,
                emailVerified: false,
                createdAt: serverTimestamp(),
            });

            // Show success state instantly to give user feedback
            setSuccess(true);

            // Delay redirect slightly for UX so they can read the success message
            setTimeout(() => {
                window.location.href = "/";
            }, 2500);

        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to create an account.");
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
                    <p className="text-zinc-400 leading-relaxed">A verification link has been sent to <span className="text-white font-medium">{email}</span>. Please check your inbox.</p>
                    <p className="text-zinc-500 text-sm">Redirecting you to the feed...</p>
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
                                <div className="flex justify-between items-center ml-1">
                                    <Label htmlFor="username" className="text-zinc-300 font-medium">Username</Label>
                                    {checkingUsername && <span className="text-[10px] text-blue-400 animate-pulse uppercase tracking-widest font-bold">Checking...</span>}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-zinc-500 font-bold text-sm">@</span>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="arunp"
                                        value={username}
                                        onChange={(e) => handleUsernameChange(e.target.value)}
                                        required
                                        className={`pl-8 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all ${usernameError ? 'border-red-500/50' : ''}`}
                                    />
                                </div>
                                {usernameError && <p className="text-[10px] text-red-500 ml-1 font-medium">{usernameError}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-zinc-300 font-medium ml-1">One-line Bio</Label>
                                <div className="relative">
                                    <Input
                                        id="bio"
                                        type="text"
                                        placeholder="Full-stack builder | Startup Enthusiast"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-all"
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
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                                        {[
                                            "Afghanistan", "Algeria", "Angola", "Argentina", "Australia", "Bangladesh", "Brazil", "Canada", "China", "Colombia", 
                                            "DR Congo", "Egypt", "Ethiopia", "France", "Germany", "Ghana", "India", "Indonesia", "Iran", "Iraq", "Italy", 
                                            "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Mozambique", "Myanmar", "Nepal", "Nigeria", "Pakistan", 
                                            "Peru", "Philippines", "Poland", "Russia", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sudan", 
                                            "Tanzania", "Thailand", "Turkey", "Uganda", "Ukraine", "United Kingdom", "United States", "Uzbekistan", 
                                            "Venezuela", "Vietnam", "Yemen", "Other"
                                        ].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
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
