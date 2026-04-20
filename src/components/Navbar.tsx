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
        <nav className={`w-full sticky top-0 z-[100] transition-all duration-500 ${
            isScrolled 
                ? "bg-[#050507]/90 backdrop-blur-2xl border-b border-white/[0.05] py-2" 
                : "bg-transparent py-4"
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-12 sm:h-14">
                    
                    {/* --- LEFT: Logo --- */}
                    <Link href="/" className="flex items-center gap-3 group shrink-0" onClick={closeMenu}>
                        <div className="relative">
                            <img 
                                src="/images/inzly-logo.png" 
                                alt="Inzly" 
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-1 ring-white/10 group-hover:scale-105 transition-all duration-300" 
                            />
                            <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="hidden sm:block text-xl font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                            inzly
                        </span>
                    </Link>

                    {/* --- CENTER: Navigation Dock (Desktop) --- */}
                    {user && (
                        <div className="hidden lg:flex items-center px-1.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full backdrop-blur-md">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href}>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all group">
                                        <link.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{link.label}</span>
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
                                    <Button className="bg-white text-black hover:bg-zinc-200 rounded-full px-5 h-9 lg:h-10 text-xs font-bold shadow-lg shadow-white/5 transition-all hover:scale-[1.03]">
                                        Post Idea
                                    </Button>
                                </Link>

                                {/* Post Idea (Mobile Icon) */}
                                <Link href="/create" className="sm:hidden" onClick={closeMenu}>
                                    <Button size="icon" className="bg-white text-black rounded-lg w-9 h-9">
                                        <Rocket className="w-4 h-4" />
                                    </Button>
                                </Link>

                                {/* User Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button 
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center gap-2 p-1 pl-1 bg-white/[0.03] border border-white/[0.06] rounded-full hover:bg-white/[0.08] transition-all group"
                                    >
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-black text-white shadow-inner">
                                            {initials}
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {profileMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute right-0 mt-2 w-48 bg-[#0B0B0F]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden py-1 z-[110]"
                                            >
                                                <div className="px-4 py-3 border-b border-white/5 mb-1">
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-0.5">Signed in as</p>
                                                    <p className="text-xs font-bold text-white truncate">@{userData?.username || 'user'}</p>
                                                </div>
                                                <Link href={`/user/${userData?.username || user?.uid}`} onClick={() => setProfileMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                                                        <User className="w-4 h-4" />
                                                        Profile
                                                    </button>
                                                </Link>
                                                <Link href="/settings" onClick={() => setProfileMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                                                        <Settings className="w-4 h-4" />
                                                        Settings
                                                    </button>
                                                </Link>
                                                <button 
                                                    onClick={() => { signOut(); setProfileMenuOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400/80 hover:text-red-400 hover:bg-red-500/5 transition-colors mt-1 border-t border-white/5"
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
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="hidden sm:block">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white rounded-full px-4 h-9 text-xs font-bold">
                                        Log In
                                    </Button>
                                </Link>
                                <Link href="/signup">
                                    <Button className="bg-white text-black hover:bg-zinc-100 rounded-full px-5 h-9 text-xs font-bold transition-all">
                                        Join
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden">
                            <button 
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400"
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
