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

    // Fetch Overall Leaderboard
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

    // Fetch Country Leaderboard
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

    const renderUserItem = (u: LeaderboardUser, index: number) => {
        const isTop3 = index < 3;
        const medals = ["text-yellow-400", "text-zinc-300", "text-amber-600"];
        
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={u.id} 
                onClick={() => router.push(`/user/${u.username}`)}
                className={`flex items-center justify-between p-4 sm:p-6 bg-[#121218] border ${user?.uid === u.id ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/[0.04]'} rounded-3xl shadow-lg hover:border-white/10 transition-colors cursor-pointer group`}
            >
                <div className="flex items-center space-x-4">
                    <div className="w-10 flex justify-center font-bold text-lg">
                        {isTop3 ? <Medal className={`w-8 h-8 ${medals[index]}`} /> : <span className="text-zinc-500">#{index + 1}</span>}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <User className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center">
                            {u.name}
                            {user?.uid === u.id && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">You</span>}
                        </h3>
                        <p className="text-zinc-500 text-sm flex items-center gap-2">
                            <span className="text-indigo-400/80 font-medium">@{u.username}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            {u.country}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <div className={`text-xl font-black ${sortBy === 'totalLikes' ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' : 'text-zinc-400'}`}>
                            {u.totalLikes}
                        </div>
                        <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Likes</div>
                    </div>
                    <div className="text-right border-l border-white/5 pl-8">
                        <div className={`text-xl font-black ${sortBy === 'trustScore' ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-indigo-400' : 'text-zinc-400'}`}>
                            {u.trustScore}
                        </div>
                        <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Trust</div>
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
        <div className="flex-1 min-h-screen bg-[#0B0B0F] px-4 py-8 pt-32">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-4">
                    <div className="w-20 h-20 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20 shadow-[0_0_40px_rgba(234,179,8,0.15)]">
                        <Trophy className="w-10 h-10 text-yellow-500" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Hall of Fame</h1>
                    <p className="text-lg text-zinc-400 max-w-xl mx-auto">Discover the most influential builders and idea generators on Inzly.</p>
                    
                    <div className="max-w-md mx-auto pt-8 relative">
                        <Search className="absolute left-4 top-11 h-5 w-5 text-zinc-500" />
                        <Input
                            placeholder="Find founder by name or @username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 bg-[#121218] border-white/5 rounded-2xl text-white focus:placeholder:text-zinc-600 shadow-2xl"
                        />
                    </div>
                </div>

                <Tabs defaultValue="overall" className="w-full">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                        <TabsList className="w-full max-w-sm grid grid-cols-2 bg-[#121218] border border-white/[0.04] rounded-full p-1.5 h-14 shadow-xl">
                            <TabsTrigger value="overall" className="rounded-full text-zinc-400 font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                                <Globe className="w-4 h-4 mr-2" />
                                Global
                            </TabsTrigger>
                            <TabsTrigger value="country" className="rounded-full text-zinc-400 font-semibold data-[state=active]:bg-white/10 data-[state=active]:text-white">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                By Country
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 p-1.5 bg-[#121218] border border-white/[0.04] rounded-full h-14 shadow-xl">
                            <button 
                                onClick={() => setSortBy("totalLikes")}
                                className={`px-5 h-full rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'totalLikes' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Impact
                            </button>
                            <button 
                                onClick={() => setSortBy("trustScore")}
                                className={`px-5 h-full rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'trustScore' ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Integrity
                            </button>
                        </div>
                    </div>

                    <TabsContent value="overall" className="space-y-4 animate-in fade-in-50 duration-500">
                        {loadingOverall ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                            </div>
                        ) : filteredOverall.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 bg-[#121218] rounded-[32px] border border-white/[0.04]">
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
                                    <SelectTrigger className="w-full h-12 bg-[#121218] border-white/10 text-white rounded-2xl focus-visible:ring-indigo-500">
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[300px]">
                                        {COUNTRIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {loadingCountry ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                            </div>
                        ) : filteredCountry.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500 bg-[#121218] rounded-[32px] border border-white/[0.04]">
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
