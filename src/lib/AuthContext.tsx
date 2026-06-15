"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, LogOut as LogOutIcon } from "lucide-react";


interface AuthContextType {
    user: User | null;
    userMode: string;
    userData: any | null; // additional firestore data
    loading: boolean;
    signOut: () => Promise<void>;
    updateUserMode: (mode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userMode, setUserMode] = useState<string>("explorer");
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const startTime = Date.now();
        
        // Fallback in case Firebase network initialization hangs
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
            console.warn("Firebase Auth timed out. Proceeding as unauthenticated.");
        }, 6000); // Increased timeout slightly to accommodate the 3s delay

        let userUnsub: (() => void) | null = null;
        let isFirstEmit = true;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (currentUser) => {
                const { doc, onSnapshot } = await import("firebase/firestore");
                
                if (currentUser) {
                    if (userUnsub) {
                        userUnsub();
                    }
                    userUnsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setUserMode(data.mode || "explorer");
                            setUserData(data);
                        } else {
                            setUserMode("explorer");
                            setUserData(null);
                        }
                        
                        if (isFirstEmit) {
                            isFirstEmit = false;
                            const elapsed = Date.now() - startTime;
                            const remaining = Math.max(0, 500 - elapsed);
                            
                            setTimeout(() => {
                                clearTimeout(timeout);
                                setUser(currentUser);
                                setLoading(false);
                            }, remaining);
                        }
                    }, (err) => {
                        console.error("onSnapshot error:", err);
                        if (isFirstEmit) {
                            isFirstEmit = false;
                            const elapsed = Date.now() - startTime;
                            const remaining = Math.max(0, 500 - elapsed);
                            
                            setTimeout(() => {
                                clearTimeout(timeout);
                                setUser(currentUser);
                                setLoading(false);
                            }, remaining);
                        }
                    });
                } else {
                    if (userUnsub) {
                        userUnsub();
                        userUnsub = null;
                    }
                    setUserMode("explorer");
                    setUserData(null);
                    
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, 500 - elapsed);
                    
                    setTimeout(() => {
                        clearTimeout(timeout);
                        setUser(null);
                        setLoading(false);
                    }, remaining);
                }
            },
            (error) => {
                console.error("Firebase connection error:", error);
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 500 - elapsed);
                
                setTimeout(() => {
                    clearTimeout(timeout);
                    setLoading(false);
                }, remaining);
            }
        );

        return () => {
            clearTimeout(timeout);
            if (userUnsub) userUnsub();
            unsubscribe();
        }
    }, [loading]);

    const signOut = async () => {
        await firebaseSignOut(auth);
        router.push("/");
    };

    const updateUserMode = async (mode: string) => {
        if (!user) return;
        try {
            const { doc, setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "users", user.uid), { mode }, { merge: true });
        } catch (error) {
            console.error("Failed to update user mode", error);
        }
    };

    const isUnapproved = user && userData && userData.approved === false;

    return (
        <AuthContext.Provider value={{ user, userMode, userData, loading, signOut, updateUserMode }}>
            {loading ? (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
                </div>
            ) : isUnapproved ? (
                <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden nothing-grid">
                    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-[400px] nothing-radial-glow opacity-30" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-card border border-border rounded-2xl p-8 sm:p-10 text-center max-w-md w-full relative z-10 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg animate-pulse">
                                <ShieldAlert className="w-8 h-8 text-yellow-500" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-foreground uppercase tracking-wider font-dot">Account Under Review</h2>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Platform Identity verification pending</p>
                            </div>

                            <div className="text-sm text-muted-foreground leading-relaxed space-y-3 px-2 font-medium">
                                <p>
                                    Hello <span className="text-foreground font-bold">{userData.name || "Innovator"}</span>, your profile (<span className="text-indigo-500 font-bold">@{userData.username}</span>) is currently in the verification pipeline.
                                </p>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed font-sans">
                                    To maintain a high-signal, secure workspace for startup orchestration, our security team manually verifies all newly registered profiles. This process is typically resolved in under 24 hours.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-border flex flex-col gap-3">
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center justify-center gap-2 h-11 bg-muted hover:bg-accent text-foreground border border-border rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                                >
                                    <LogOutIcon className="w-3.5 h-3.5" />
                                    Disconnect Session
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
