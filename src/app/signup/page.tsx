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
import AuthTelemetryPanel from "@/components/AuthTelemetryPanel";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [country, setCountry] = useState("");
    const [bio, setBio] = useState("");
    const [error, setError] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [mode, setMode] = useState("explorer");
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
                mode,
                country: country || "Unknown",
                bio: bio || "",
                totalLikes: 0,
                emailVerified: false,
                createdAt: serverTimestamp(),
            });

            setSuccess(true);

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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black min-h-[90vh] overflow-hidden">
                <AuthTelemetryPanel activePage="REGISTER" />
                
                <div className="flex items-center justify-center p-4 bg-black nothing-grid">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-4 bg-card p-10 rounded-2xl border border-border shadow-2xl max-w-sm w-full relative overflow-hidden"
                    >
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
                            <h2 className="text-xl font-bold font-dot tracking-tight text-white">Account Created</h2>
                            <p className="text-[10px] uppercase text-zinc-500 leading-relaxed">
                                Verification link transmitted to <span className="text-white font-bold">{email}</span>. Please verify.
                            </p>
                            <p className="text-zinc-600 text-[9px] uppercase tracking-widest animate-pulse mt-4">Redirecting to feed...</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black min-h-[90vh] overflow-hidden">
            <AuthTelemetryPanel activePage="REGISTER" />
            
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

                        <div className="text-center mb-8 z-10 relative">
                            <h2 className="text-3xl font-bold font-dot tracking-tight text-white mb-2">Join Inzly</h2>
                            <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest leading-relaxed">Create an account to discover, save, and discuss startup concepts.</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-4 z-10 relative">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-black border border-red-500/30 text-red-500 text-[10px] font-mono uppercase tracking-wider rounded-none"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="name" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Arun M"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center ml-1 font-mono text-[9px]">
                                        <Label htmlFor="username" className="text-zinc-400 font-bold uppercase tracking-widest">Username</Label>
                                        {checkingUsername && <span className="text-[8px] text-zinc-500 animate-pulse uppercase tracking-wider font-bold">Checking...</span>}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-3 text-zinc-600 font-bold text-xs">@</span>
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="arunp"
                                            value={username}
                                            onChange={(e) => handleUsernameChange(e.target.value)}
                                            required
                                            className={`pl-8 h-11 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700 ${usernameError ? 'border-red-500/50' : ''}`}
                                        />
                                    </div>
                                    {usernameError && <p className="text-[8px] text-red-500 ml-1 font-mono uppercase tracking-wider">{usernameError}</p>}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="bio" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">One-line Bio</Label>
                                    <Input
                                        id="bio"
                                        type="text"
                                        placeholder="Full-stack builder | Startup Enthusiast"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="h-11 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                    />
                                </div>

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
                                            className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Role</Label>
                                        <Select value={mode} onValueChange={(val) => setMode(val || "explorer")}>
                                            <SelectTrigger className="w-full h-11 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-xs font-mono transition-colors">
                                                <SelectValue placeholder="Platform Role" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                                                {[
                                                    { id: "explorer", label: "Explorer" },
                                                    { id: "sparker", label: "Sparker" },
                                                    { id: "builder", label: "Builder" },
                                                    { id: "catalyst", label: "Catalyst" }
                                                ].map(m => (
                                                    <SelectItem key={m.id} value={m.id} className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Country</Label>
                                        <Select value={country} onValueChange={(val) => setCountry(val || "")}>
                                            <SelectTrigger className="w-full h-11 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-xs font-mono transition-colors">
                                                <SelectValue placeholder="Country" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-black border border-white/10 text-white rounded-none max-h-[250px]">
                                                {[
                                                    "Afghanistan", "Algeria", "Angola", "Argentina", "Australia", "Bangladesh", "Brazil", "Canada", "China", "Colombia", 
                                                    "DR Congo", "Egypt", "Ethiopia", "France", "Germany", "Ghana", "India", "Indonesia", "Iran", "Iraq", "Italy", 
                                                    "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Mozambique", "Myanmar", "Nepal", "Nigeria", "Pakistan", 
                                                    "Peru", "Philippines", "Poland", "Russia", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sudan", 
                                                    "Tanzania", "Thailand", "Turkey", "Uganda", "Ukraine", "United Kingdom", "United States", "Uzbekistan", 
                                                    "Venezuela", "Vietnam", "Yemen", "Other"
                                                ].map(c => (
                                                    <SelectItem key={c} value={c} className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="password" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-xl focus-visible:border-blue-500 focus-visible:ring-0 font-sans text-sm placeholder:text-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 border border-blue-500 rounded-xl font-sans font-semibold text-sm transition-all group mt-4"
                                disabled={loading}
                            >
                                {loading ? "Registering..." : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center z-10 relative font-mono text-[10px]">
                            <p className="text-zinc-500 uppercase tracking-widest">
                                Already registered?{" "}
                                <Link href="/login" className="text-white hover:underline font-bold transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
