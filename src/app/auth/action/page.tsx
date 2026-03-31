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
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-zinc-500 animate-pulse text-lg">Verifying reset link...</div>
            </div>
        );
    }

    if (invalid) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-zinc-900/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl text-center space-y-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Invalid or Expired Link</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            This password reset link is invalid or has already been used. Please request a new one.
                        </p>
                        <Link href="/forgot-password">
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl px-8 h-12 font-medium mt-2">
                                Request New Link
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (success) {
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
                        <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            Your password has been successfully updated. You can now log in with your new password.
                        </p>
                        <Link href="/login">
                            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl px-10 h-12 font-medium mt-2">
                                Go to Login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
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
                        <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">Set new password</h2>
                        <p className="text-zinc-400">
                            Resetting password for <span className="text-white font-medium">{email}</span>
                        </p>
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

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-zinc-300 font-medium ml-1">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-zinc-300 font-medium ml-1">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPass}
                                        onChange={(e) => setConfirmPass(e.target.value)}
                                        required
                                        minLength={6}
                                        className="pl-10 h-12 bg-zinc-950/50 border-zinc-800 text-white rounded-xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                            disabled={loading}
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-zinc-500 animate-pulse text-lg">Loading...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
