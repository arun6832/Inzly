"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PRECISE_AI_NEWS } from "./constants";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingNews, setLoadingNews] = useState("");
    const router = useRouter();

    useEffect(() => {
        setLoadingNews(PRECISE_AI_NEWS[Math.floor(Math.random() * PRECISE_AI_NEWS.length)]);
    }, []);

    useEffect(() => {
        const startTime = Date.now();
        
        // Fallback in case Firebase network initialization hangs
        const timeout = setTimeout(() => {
            if (loading) setLoading(false);
            console.warn("Firebase Auth timed out. Proceeding as unauthenticated.");
        }, 6000); // Increased timeout slightly to accommodate the 3s delay

        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 3000 - elapsed);
                
                setTimeout(() => {
                    clearTimeout(timeout);
                    setUser(user);
                    setLoading(false);
                }, remaining);
            },
            (error) => {
                console.error("Firebase connection error:", error);
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 3000 - elapsed);
                
                setTimeout(() => {
                    clearTimeout(timeout);
                    setLoading(false);
                }, remaining);
            }
        );

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        }
    }, [loading]);

    const signOut = async () => {
        await firebaseSignOut(auth);
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {loading ? (
                <div className="min-h-screen flex flex-col items-center justify-center bg-[#050507] px-8 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-indigo-500/5 rounded-full blur-[100px] animate-pulse"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight max-w-xl mx-auto italic pr-1">
                                &ldquo;{loadingNews}&rdquo;
                            </h3>
                            <p className="mt-8 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] animate-pulse">
                                AI Intelligence Stream
                            </p>
                        </motion.div>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
