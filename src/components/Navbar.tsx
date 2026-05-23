"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";
import { 
    Menu, X, Rocket, MessageSquare, Heart, Trophy, LogOut, 
    Search, UserCircle2, MapPin, ChevronDown, User, Settings, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const { user, userMode, userData, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close on click outside profile menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const closeMenu = () => setMobileMenuOpen(false);

    const initials = userData?.name
        ? userData.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
        : (userData?.username?.[0] || "?").toUpperCase();

    const isScrolled = mounted && scrolled;

    const navLinks = [
        { href: "/dashboard", label: "Studio", icon: LayoutDashboard },
        { href: "/map", label: "Map", icon: MapPin },
        { href: "/leaderboard", label: "Rank", icon: Trophy },
        { href: "/messages", label: "Chats", icon: MessageSquare },
        { href: "/saved", label: "Saved", icon: Heart },
    ];

    return (
        <nav className={`w-full sticky top-0 z-[100] transition-all duration-300 ${
            isScrolled 
                ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-[0_1px_0_0_rgba(59,130,246,0.08)] py-1.5" 
                : "bg-transparent py-3"
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? "h-10" : "h-12 sm:h-14"}`}>
                    
                    {/* --- LEFT: Logo --- */}
                    <Link href="/" className="flex items-center gap-2 group shrink-0" onClick={closeMenu}>
                        <div className="flex items-center gap-1.5">
                            <span className={`rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)] shrink-0 transition-all duration-300 ${isScrolled ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
                            <span className={`rounded-full bg-red-600 animate-red-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0 transition-all duration-300 ${isScrolled ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
                            <span className={`font-black font-dot tracking-tight text-white pl-1 transition-all duration-300 ${isScrolled ? "text-base" : "text-xl"}`}>
                                Inzly.
                            </span>
                        </div>
                    </Link>

                    {/* --- CENTER: Navigation Dock (Desktop) --- */}
                    {user && (
                        <div className={`hidden lg:flex items-center bg-card border border-border rounded-full shadow-lg transition-all duration-300 ${isScrolled ? "px-1 py-0.5" : "px-1.5 py-1"}`}>
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    <button className={`flex items-center gap-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all group font-sans font-medium ${isScrolled ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"}`}>
                                        <link.icon className={`group-hover:scale-105 transition-all duration-300 ${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
                                        <span>{link.label}</span>
                                    </button>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* --- RIGHT: Actions --- */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Search (Icon on mobile, Full on desktop) */}
                        <div className="hidden md:block w-40 lg:w-48 xl:w-64">
                            <GlobalSearch />
                        </div>
                        <div className="md:hidden">
                             <GlobalSearch />
                        </div>

                        {user ? (
                            <div className="flex items-center gap-2">
                                {/* Post Idea (Desktop) */}
                                <Link href="/create" className="hidden sm:block">
                                    <Button className="bg-white text-black hover:bg-white/90 border border-white rounded-xl px-5 h-9 text-xs font-mono uppercase tracking-widest font-bold transition-all shadow-md">
                                        Post Idea
                                    </Button>
                                </Link>

                                {/* Post Idea (Mobile Icon) */}
                                <Link href="/create" className="sm:hidden" onClick={closeMenu}>
                                    <Button size="icon" className="bg-white text-black rounded-xl w-9 h-9 border border-white">
                                        <Rocket className="w-4 h-4" />
                                    </Button>
                                </Link>

                                {/* User Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button 
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-2 p-0.5 bg-background border border-border rounded-xl hover:bg-white/5 transition-all group"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white text-black flex items-center justify-center text-[10px] font-mono font-bold border border-white">
                                            {initials}
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {profileMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                                className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden py-1 z-[110]"
                                            >
                                                <div className="px-4 py-3 border-b border-border mb-1 font-mono">
                                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Signed in as</p>
                                                    <p className="text-xs font-bold text-white truncate">@{userData?.username || 'user'}</p>
                                                </div>
                                                <Link href={`/user/${userData?.username || user?.uid}`} onClick={() => setProfileMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                                        <User className="w-4 h-4" />
                                                        Profile
                                                    </button>
                                                </Link>
                                                <Link href="/settings" onClick={() => setProfileMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left">
                                                        <Settings className="w-4 h-4" />
                                                        Settings
                                                    </button>
                                                </Link>
                                                <button 
                                                    onClick={() => { signOut(); setProfileMenuOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/5 transition-colors mt-1 border-t border-border text-left"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Log Out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 font-mono uppercase tracking-widest text-[10px]">
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-xl px-4 h-9 font-bold">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-white text-black hover:bg-white/90 border border-white rounded-xl px-5 h-9 font-bold transition-all shadow-md">
                                        Join
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="w-9 h-9 flex items-center justify-center rounded-none bg-white/[0.03] border border-white/[0.06] text-zinc-400"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="lg:hidden absolute top-full left-0 w-full bg-[#050507]/98 border-b border-white/[0.05] shadow-2xl backdrop-blur-3xl overflow-hidden py-4 px-4 space-y-3 z-[90]"
                    >
                        {user ? (
                            <div className="grid grid-cols-2 gap-3">
                                {navLinks.map((link) => (
                                    <Link key={link.href} href={link.href} onClick={closeMenu}>
                                        <div className="flex flex-col items-center justify-center p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all">
                                            <link.icon className="w-5 h-5 mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
                                        </div>
                                    </Link>
                                ))}
                                <Link href={`/user/${userData?.username || user?.uid}`} onClick={closeMenu} className="col-span-2">
                                    <div className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                                        <User className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">My Account</span>
                                    </div>
                                </Link>
                                <button 
                                    onClick={() => { signOut(); closeMenu(); }}
                                    className="col-span-2 flex items-center justify-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500/60"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link href="/signup" onClick={closeMenu}>
                                    <Button className="w-full bg-white text-black h-12 rounded-xl font-black text-sm">Create Account</Button>
                                </Link>
                                <Link href="/login" onClick={closeMenu}>
                                    <Button variant="ghost" className="w-full text-zinc-400 h-12 border border-white/5 rounded-xl font-bold">Log In</Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
