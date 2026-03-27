"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "./ui/button";

export default function Navbar() {
    const { user, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`w-full sticky top-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.04]" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? "h-14" : "h-20"}`}>
                    <Link href="/" className="flex items-center space-x-3 group">
                        <img src="/images/inzly-logo.png" alt="Inzly" className="w-10 h-10 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        <span className="text-2xl font-black tracking-tight text-white hidden sm:block">
                            inzly
                        </span>
                    </Link>

                    <div className="flex items-center space-x-3">
                        {user ? (
                            <>
                                <Link href="/leaderboard" className="hidden sm:block">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                        Leaderboard
                                    </Button>
                                </Link>
                                <Link href="/saved">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                        Saved
                                    </Button>
                                </Link>
                                <Link href="/create">
                                    <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 h-10 font-bold shadow-lg shadow-white/10 transition-transform hover:scale-105">
                                        Post Idea
                                    </Button>
                                </Link>
                                <Button variant="ghost" className="text-zinc-500 hover:text-red-400 rounded-full px-4 h-10" onClick={signOut}>
                                    Log Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/leaderboard" className="hidden sm:block">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                        Leaderboard
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button variant="ghost" className="text-zinc-300 hover:text-white rounded-full px-5 h-10 font-medium">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full px-6 h-10 font-bold shadow-[0_4px_20px_rgb(79,70,229,0.3)] transition-transform hover:scale-105 hover:from-blue-500 hover:to-indigo-500">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
