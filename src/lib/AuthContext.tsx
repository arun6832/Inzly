"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fallback in case Firebase network initialization hangs
        let timeout = setTimeout(() => {
            if (loading) setLoading(false);
            console.warn("Firebase Auth timed out. Proceeding as unauthenticated.");
        }, 4000);

        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                clearTimeout(timeout);
                setUser(user);
                setLoading(false);
            },
            (error) => {
                console.error("Firebase connection error:", error);
                clearTimeout(timeout);
                setLoading(false);
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
                <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] relative overflow-hidden">
                    <div className="relative flex items-center justify-center animate-pulse duration-1000">
                        <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-[40px] w-32 h-32 -m-8"></div>
                        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-[0_0_40px_rgba(79,70,229,0.3)] z-10 transition-transform hover:scale-105">
                            I
                        </div>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
