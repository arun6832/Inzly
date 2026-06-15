"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Globe, Medal, User, Search } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface LeaderboardUser {
    id: string;
    name: string;
    username: string;
    totalLikes: number;
    trustScore: number;
    country: string;
}

const COUNTRIES = [
    "Afghanistan", "Algeria", "Angola", "Argentina", "Australia", "Bangladesh", "Brazil", "Canada", "China", "Colombia",
    "DR Congo", "Egypt", "Ethiopia", "France", "Germany", "Ghana", "India", "Indonesia", "Iran", "Iraq", "Italy",
    "Japan", "Kenya", "Malaysia", "Mexico", "Morocco", "Mozambique", "Myanmar", "Nepal", "Nigeria", "Pakistan",
    "Peru", "Philippines", "Poland", "Russia", "Saudi Arabia", "South Africa", "South Korea", "Spain", "Sudan",
    "Tanzania", "Thailand", "Turkey", "Uganda", "Ukraine", "United Kingdom", "United States", "Uzbekistan",
    "Venezuela", "Vietnam", "Yemen", "Other", "Unknown"
];

export default function LeaderboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [overallUsers, setOverallUsers] = useState<LeaderboardUser[]>([]);
    const [countryUsers, setCountryUsers] = useState<LeaderboardUser[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("India");
    const [loadingOverall, setLoadingOverall] = useState(true);
    const [loadingCountry, setLoadingCountry] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"totalLikes" | "trustScore">("totalLikes");

    useEffect(() => {
        const fetchOverall = async () => {
            try {
                const q = query(collection(db, "users"), orderBy(sortBy, "desc"), limit(100));
                const snap = await getDocs(q);
                const users: LeaderboardUser[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    users.push({
                        id: doc.id,
                        name: data.name,
                        username: data.username || "unknown",
                        totalLikes: data.totalLikes || 0,
                        trustScore: data.trustScore || 100,
                        country: data.country || "Unknown"
                    });
                });
                setOverallUsers(users);
            } catch (err) {
                console.error("Failed to fetch overall leaderboard", err);
            } finally {
                setLoadingOverall(false);
            }
        };
        fetchOverall();
    }, [sortBy]);

    useEffect(() => {
        const fetchCountry = async () => {
            setLoadingCountry(true);
            try {
                const q = query(
                    collection(db, "users"),
                    where("country", "==", selectedCountry),
                    orderBy(sortBy, "desc"),
                    limit(50)
                );
                const snap = await getDocs(q);
                const users: LeaderboardUser[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    users.push({
                        id: doc.id,
                        name: data.name,
                        username: data.username || "unknown",
                        totalLikes: data.totalLikes || 0,
                        trustScore: data.trustScore || 100,
                        country: data.country
                    });
                });
                setCountryUsers(users);
            } catch (err) {
                console.error("Failed to fetch country leaderboard", err);
            } finally {
                setLoadingCountry(false);
            }
        };
        fetchCountry();
    }, [selectedCountry, sortBy]);

    const medalColors = ["text-yellow-400", "text-zinc-300", "text-amber-600"];

    const renderUserItem = (u: LeaderboardUser, index: number) => {
        const isTop3 = index < 3;
        const isMe = user?.uid === u.id;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                key={u.id}
                onClick={() => router.push(`/user/${u.username}`)}
                className={`flex items-center justify-between p-4 sm:p-5 bg-card border rounded-2xl shadow-sm hover:border-blue-500/40 transition-colors cursor-pointer group ${isMe ? "border-blue-500/50 bg-blue-500/5" : "border-border"}`}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 flex justify-center font-bold text-lg shrink-0">
                        {isTop3
                            ? <Medal className={`w-7 h-7 ${medalColors[index]}`} />
                            : <span className="text-muted-foreground text-sm font-mono">#{index + 1}</span>}
                    </div>
                    <div className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-foreground font-bold text-base flex items-center gap-2">
                            {u.name}
                            {isMe && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-semibold">
                                    You
                                </span>
                            )}
                        </h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <span className="text-blue-400/80 font-medium">@{u.username}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            {u.country}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-6 sm:gap-8">
                    <div className="text-right">
                        <div className={`text-xl font-black ${sortBy === "totalLikes" ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400" : "text-muted-foreground"}`}>
                            {u.totalLikes}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Likes</div>
                    </div>
                    <div className="text-right border-l border-border pl-6 sm:pl-8">
                        <div className={`text-xl font-black ${sortBy === "trustScore" ? "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400" : "text-muted-foreground"}`}>
                            {u.trustScore}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Trust</div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const filteredOverall = overallUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCountry = countryUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 min-h-screen bg-background nothing-grid relative pt-28">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[400px] pointer-events-none z-0 nothing-radial-glow opacity-50" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 pb-24 space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Trophy className="w-7 h-7 text-yellow-500" />
                        <h1 className="text-4xl sm:text-5xl font-black font-dot tracking-tight text-foreground">Hall of Fame</h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                        Discover the most influential builders and idea generators on Inzly.
                    </p>

                    {/* Search */}
                    <div className="max-w-md mx-auto pt-4 relative">
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Find founder by name or @username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 bg-card border-border rounded-2xl text-foreground focus:border-blue-500 shadow-lg"
                        />
                    </div>
                </div>

                <Tabs defaultValue="overall" className="w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        {/* Tab switcher */}
                        <TabsList className="w-full max-w-sm grid grid-cols-2 bg-card border border-border rounded-2xl p-1.5 h-14 shadow-lg">
                            <TabsTrigger value="overall" className="rounded-xl text-muted-foreground font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors">
                                <Globe className="w-4 h-4 mr-2" />
                                Global
                            </TabsTrigger>
                            <TabsTrigger value="country" className="rounded-xl text-muted-foreground font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-colors">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                By Country
                            </TabsTrigger>
                        </TabsList>

                        {/* Sort toggle */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-card border border-border rounded-2xl h-14 shadow-lg">
                            <button
                                onClick={() => setSortBy("totalLikes")}
                                className={`px-5 h-full rounded-xl text-xs font-bold transition-all ${sortBy === "totalLikes" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Impact
                            </button>
                            <button
                                onClick={() => setSortBy("trustScore")}
                                className={`px-5 h-full rounded-xl text-xs font-bold transition-all ${sortBy === "trustScore" ? "bg-blue-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Integrity
                            </button>
                        </div>
                    </div>

                    <TabsContent value="overall" className="space-y-3 animate-in fade-in-50 duration-500">
                        {loadingOverall ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
                            </div>
                        ) : filteredOverall.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
                                {searchQuery ? "No builders match your search." : "No users found on the leaderboard yet."}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredOverall.map((u, i) => renderUserItem(u, i))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="country" className="space-y-6 animate-in fade-in-50 duration-500">
                        <div className="flex justify-center">
                            <div className="w-full max-w-xs">
                                <Select value={selectedCountry} onValueChange={(val) => setSelectedCountry(val || "India")}>
                                    <SelectTrigger className="w-full h-12 bg-card border-border text-foreground rounded-2xl focus-visible:ring-blue-500">
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground max-h-[300px]">
                                        {COUNTRIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {loadingCountry ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-t-2 border-blue-500 animate-spin" />
                            </div>
                        ) : filteredCountry.length === 0 ? (
                            <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
                                {searchQuery ? "No builders match your search in this country." : `No top users found in ${selectedCountry} yet.`}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredCountry.map((u, i) => renderUserItem(u, i))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
