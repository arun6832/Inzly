"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";
import { Menu, X, Rocket, MessageSquare, Heart, Trophy, LogOut, Search, UserCircle2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
export default function Navbar() {
    const { user, userMode, userData, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close menu when route changes (on click)
    const closeMenu = () => setMobileMenuOpen(false);

    // Generate initials from display name stored in userData
    const initials = userData?.name
        ? userData.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
        : (userData?.username?.[0] || "?").toUpperCase();

    const isScrolled = mounted && scrolled;

    return (
        <nav className={`w-full sticky top-0 z-[100] transition-all duration-300 ${isScrolled ? "bg-[#050507]/80 backdrop-blur-xl border-b border-white/[0.04]" : "bg-transparent"}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? "h-14" : "h-20"}`}>
                    <Link href="/" className="flex items-center space-x-3 group shrink-0" onClick={closeMenu}>
                        <img src="/images/inzly-logo.png" alt="Inzly" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover group-hover:scale-105 transition-transform" />
                        <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            inzly
                        </span>
                    </Link>

                    {/* Desktop Search Center */}
                    <div className="hidden lg:flex flex-1 justify-center max-w-md mx-8">
                        <GlobalSearch />
                    </div>

                    <div className="flex items-center space-x-3">
                        {/* Mobile Actions */}
                        <div className="lg:hidden flex items-center gap-1">
                             <GlobalSearch />
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-zinc-400"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                             >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                             </Button>
                        </div>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center space-x-2">
                            {user ? (
                                <>
                                    <Link href={`/user/${userData?.username || user?.uid}`}>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                                            <span className="text-sm font-black text-white">{initials}</span>
                                        </div>
                                    </Link>
                                    <Link href={`/user/${userData?.username || user?.uid}`}>
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                            View Profile
                                        </Button>
                                    </Link>
                                    <Link href="/map">
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            Map
                                        </Button>
                                    </Link>
                                    <Link href="/leaderboard">
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                            Leaderboard
                                        </Button>
                                    </Link>
                                    <Link href="/messages">
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium">
                                            Messages
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
                                    <Link href="/map">
                                        <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full bg-white/[0.03] hover:bg-white/[0.08] px-5 h-10 font-medium flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            Map
                                        </Button>
                                    </Link>
                                    <Link href="/leaderboard">
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
                                        <Button className="bg-white text-black rounded-full px-6 h-10 font-bold transition-transform hover:scale-105">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-[#0B0B0F] border-b border-white/[0.04] py-6 px-4 space-y-2 shadow-2xl backdrop-blur-3xl"
                    >
                        {user ? (
                            <div className="flex flex-col space-y-2">
                                <Link href={`/user/${userData?.username || user?.uid}`} onClick={closeMenu}>
                                    <div className="flex items-center justify-center p-4 bg-white/[0.03] border border-white/5 rounded-2xl mb-2 hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center mr-3">
                                            <span className="text-sm font-black text-white">{initials}</span>
                                        </div>
                                        <span className={`text-sm font-black uppercase tracking-widest ${
                                            userMode === 'catalyst' ? 'text-emerald-400' :
                                            userMode === 'builder' ? 'text-amber-400' :
                                            userMode === 'sparker' ? 'text-purple-400' :
                                            'text-blue-400'
                                        }`}>
                                            {userMode || 'Member'}
                                        </span>
                                    </div>
                                </Link>

                                <Link href="/create" onClick={closeMenu}>
                                    <Button className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl h-14 font-black text-lg gap-3">
                                        <Rocket className="w-5 h-5" />
                                        Post Idea
                                    </Button>
                                </Link>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                                    <Link href={`/user/${userData?.username || user?.uid}`} onClick={closeMenu} className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04] text-zinc-400 hover:text-white">
                                        <UserCircle2 className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Profile</span>
                                    </Link>
                                    <Link href="/messages" onClick={closeMenu} className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04] text-zinc-400 hover:text-white">
                                        <MessageSquare className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Chats</span>
                                    </Link>
                                    <Link href="/saved" onClick={closeMenu} className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04] text-zinc-400 hover:text-white">
                                        <Heart className="w-6 h-6 mb-2 text-red-500/50" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Saved</span>
                                    </Link>
                                    <Link href="/leaderboard" onClick={closeMenu} className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04] text-zinc-400 hover:text-white">
                                        <Trophy className="w-6 h-6 mb-2 text-yellow-500/50" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Rank</span>
                                    </Link>
                                    <button onClick={() => { signOut(); closeMenu(); }} className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.04] text-zinc-500 hover:text-red-400">
                                        <LogOut className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Exit</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-4">
                                <Link href="/signup" onClick={closeMenu}>
                                    <Button className="w-full bg-white text-black h-14 rounded-2xl font-black text-lg">Sign Up Now</Button>
                                </Link>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link href="/login" onClick={closeMenu}>
                                        <Button variant="ghost" className="w-full text-white border border-white/10 rounded-xl h-12">Log In</Button>
                                    </Link>
                                    <Link href="/leaderboard" onClick={closeMenu}>
                                        <Button variant="ghost" className="w-full text-zinc-400 rounded-xl h-12">Leaderboard</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
