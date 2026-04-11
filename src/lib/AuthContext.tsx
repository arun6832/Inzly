"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";


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
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                const { doc, onSnapshot } = await import("firebase/firestore");
                
                if (user) {
                    userUnsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setUserMode(data.mode || "explorer");
                            setUserData(data);
                        } else {
                            setUserMode("explorer");
                            setUserData(null);
                        }
                    });
                } else {
                    if (userUnsub) userUnsub();
                    setUserMode("explorer");
                    setUserData(null);
                }

                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 500 - elapsed);
                
                setTimeout(() => {
                    clearTimeout(timeout);
                    setUser(user);
                    setLoading(false);
                }, remaining);
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

    return (
        <AuthContext.Provider value={{ user, userMode, userData, loading, signOut, updateUserMode }}>
            {loading ? (
                <div className="min-h-screen bg-[#050507]" />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
