"use client";

import { useState, useEffect, Suspense } from "react";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import AuthTelemetryPanel from "@/components/AuthTelemetryPanel";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode") || "";
    const mode = searchParams.get("mode") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [email, setEmail] = useState("");
    const [success, setSuccess] = useState(false);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        const verify = async () => {
            if (!oobCode || mode !== "resetPassword") {
                setInvalid(true);
                setVerifying(false);
                return;
            }
            try {
                const userEmail = await verifyPasswordResetCode(auth, oobCode);
                setEmail(userEmail);
            } catch {
                setInvalid(true);
            } finally {
                setVerifying(false);
            }
        };
        verify();
    }, [oobCode, mode]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPass) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setSuccess(true);
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to reset password. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center bg-black w-full px-4 text-center nothing-grid min-h-[90vh]">
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    Transmitting Verification Request...
                </p>
            </div>
        );
    }

    if (invalid) {
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
                                <div className="w-16 h-16 bg-white/5 rounded-none border border-red-500/30 flex items-center justify-center mx-auto">
                                    <AlertTriangle className="w-8 h-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold font-dot uppercase tracking-wider text-white">Verification Failed</h2>
                                <p className="text-[10px] uppercase text-zinc-500 leading-relaxed">
                                    This security token is invalid or has already expired. Please request a new transmission.
                                </p>
                                <Link href="/forgot-password" className="block">
                                    <Button className="w-full h-11 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-mono uppercase tracking-widest text-xs font-bold transition-all mt-2">
                                        Request Reset
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (success) {
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
                                <h2 className="text-xl font-bold font-dot uppercase tracking-wider text-white">Password Updated</h2>
                                <p className="text-[10px] uppercase text-zinc-500 leading-relaxed">
                                    Security credentials have been re-keyed successfully.
                                </p>
                                <Link href="/login" className="block">
                                    <Button className="w-full h-11 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-mono uppercase tracking-widest text-xs font-bold transition-all mt-2">
                                        Proceed to Login
                                    </Button>
                                </Link>
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
            
            <div className="flex items-center justify-center p-4 py-12 bg-black nothing-grid relative overflow-hidden">
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
                                <h2 className="text-3xl font-bold font-dot uppercase tracking-wider text-white mb-2">Set Password</h2>
                                <p className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest leading-relaxed">
                                    Resetting password for <span className="text-white font-bold">{email}</span>
                                </p>
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

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="newPassword" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">New Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 font-mono text-xs placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="confirmPassword" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-600" />
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="••••••••"
                                                value={confirmPass}
                                                onChange={(e) => setConfirmPass(e.target.value)}
                                                required
                                                minLength={6}
                                                className="pl-10 h-11 bg-transparent border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 font-mono text-xs placeholder:text-zinc-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-white text-black hover:bg-black hover:text-white border border-white rounded-none font-mono uppercase tracking-widest text-xs font-bold transition-all mt-4"
                                    disabled={loading}
                                >
                                    {loading ? "Updating..." : "Commit Password"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col justify-center items-center bg-black w-full px-4 text-center nothing-grid min-h-[90vh]">
                <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-[0.4em] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-red-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
                    Initializing Secure Handshake...
                </p>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
