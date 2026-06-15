"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    query, 
    orderBy,
    where
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Users, ShieldAlert, CheckCircle2, Search, Filter, 
    Lock, ArrowRight, Mail, LayoutDashboard, Database,
    Activity, Globe, Sliders, ChevronDown, TrendingUp,
    PieChart, BarChart3, RefreshCw
} from "lucide-react";
import { getLaymanRole } from "@/lib/constants";

interface UserProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    mode: "explorer" | "sparker" | "builder" | "catalyst";
    country: string;
    approved?: boolean;
    createdAt?: any;
    interests?: string[];
    kycStatus?: "unverified" | "pending" | "verified";
    kycApplication?: {
        linkedin: string;
        website: string;
        score: number;
        role?: string;
        timestamp?: any;
    };
}

export default function AdminDashboardPage() {
    const { user, userData, loading: authLoading, signOut } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    
    // Auth Console credentials
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    // Dashboard Data
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    // Executive Interactive Analytics Console States
    const [chartTab, setChartTab] = useState<"trends" | "distribution" | "demographics" | "kyc">("trends");
    const [hoveredDateIdx, setHoveredDateIdx] = useState<number | null>(null);
    const [hoveredRoleSegment, setHoveredRoleSegment] = useState<string | null>(null);
    const [hoveredCountryIdx, setHoveredCountryIdx] = useState<number | null>(null);
    const [countrySort, setCountrySort] = useState<"count" | "name">("count");
    const [timeFilterUserIds, setTimeFilterUserIds] = useState<string[] | null>(null);
    const [selectedTimelineLabel, setSelectedTimelineLabel] = useState<string | null>(null);

    // Check admin permissions
    useEffect(() => {
        if (authLoading) return;
        
        const checkAdminPrivileges = () => {
            if (user) {
                const isEmailAdmin = user.email?.toLowerCase() === "admin@inzly.com";
                const isDocAdmin = userData?.isAdmin === true;
                if (isEmailAdmin || isDocAdmin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        };

        checkAdminPrivileges();
    }, [user, userData, authLoading]);

    // Fetch users for admin
    const fetchUsers = async () => {
        setLoadingData(true);
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            const userList: UserProfile[] = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                userList.push({
                    id: docSnap.id,
                    name: data.name || "Unknown",
                    username: data.username || "unknown",
                    email: data.email || "",
                    mode: data.mode || "explorer",
                    country: data.country || "Unknown",
                    approved: data.approved,
                    interests: data.interests || [],
                    kycStatus: data.kycStatus,
                    kycApplication: data.kycApplication,
                });
            });
            setUsers(userList);
        } catch (e) {
            console.error("Failed to load user directory", e);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    // Handle Admin Console authentication
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            const loggedInUser = userCredential.user;
            
            // Check manual privileges after signing in
            const isEmailAdmin = loggedInUser.email?.toLowerCase() === "admin@inzly.com";
            
            // Fetch document directly to prevent delay
            const { getDoc, doc } = await import("firebase/firestore");
            const userDocSnap = await getDoc(doc(db, "users", loggedInUser.uid));
            const isDocAdmin = userDocSnap.exists() && userDocSnap.data().isAdmin === true;

            if (isEmailAdmin || isDocAdmin) {
                setIsAdmin(true);
            } else {
                setLoginError("Unauthorized. This session lacks structural Admin credentials.");
                await auth.signOut();
            }
        } catch (err: any) {
            setLoginError(err.message || "Authentication transmission failed.");
        } finally {
            setLoginLoading(false);
        }
    };

    // Manual status toggle actions
    const handleStatusUpdate = async (userId: string, newStatus: boolean) => {
        try {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, { approved: newStatus });
            
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: newStatus } : u));
        } catch (e) {
            alert("Approval modification transaction failed.");
            console.error(e);
        }
    };

    // Manual KYC Auditing clearance triggers
    const handleKycClearance = async (userId: string, approve: boolean) => {
        try {
            const userDocRef = doc(db, "users", userId);
            if (approve) {
                // Set KYC status to verified and automatically boost trust score to 150
                await updateDoc(userDocRef, { 
                    kycStatus: "verified",
                    trustScore: 150 
                });
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: "verified", trustScore: 150 } : u));
                alert("Ecosystem KYC Clearance granted successfully!");
            } else {
                // Reset KYC status to unverified and wipe application payload
                await updateDoc(userDocRef, { 
                    kycStatus: "unverified",
                    kycApplication: null 
                });
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, kycStatus: "unverified", kycApplication: undefined } : u));
                alert("Verification application declined.");
            }
        } catch (e) {
            alert("Verification audit update transaction failed.");
            console.error(e);
        }
    };

    // Analytics computation
    const totalUsers = users.length;
    const pendingApprovals = users.filter(u => u.approved === false).length;
    const approvedUsers = users.filter(u => u.approved !== false).length;
    const pendingKycCount = users.filter(u => u.kycStatus === "pending").length;

    const countByRole = (role: string) => users.filter(u => u.mode === role).length;
    const roleStats = {
        explorer: countByRole("explorer"),
        sparker: countByRole("sparker"),
        builder: countByRole("builder"),
        catalyst: countByRole("catalyst"),
    };

    // Interest tags metrics breakdown
    const getInterestTagsBreakdown = () => {
        const counts: Record<string, number> = {};
        users.forEach(u => {
            u.interests?.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };
    const topInterests = getInterestTagsBreakdown();
    
    // Chronological timeline builder for Ecosystem Trends (growth line chart)
    const timelineData = (() => {
        const sortedUsers = [...users].sort((a, b) => {
            const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
            const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
            return timeA - timeB;
        });

        if (users.length === 0) {
            return Array.from({ length: 6 }).map((_, i) => ({
                label: `P${i + 1}`,
                dateRange: "Pending Sync",
                count: 0,
                cumulative: 0,
                userIds: []
            }));
        }

        const firstTime = sortedUsers[0].createdAt?.seconds 
            ? sortedUsers[0].createdAt.seconds * 1000 
            : Date.now() - 30 * 24 * 60 * 60 * 1000;
        const lastTime = sortedUsers[sortedUsers.length - 1].createdAt?.seconds 
            ? sortedUsers[sortedUsers.length - 1].createdAt.seconds * 1000 
            : Date.now();

        const range = Math.max(lastTime - firstTime, 24 * 60 * 60 * 1000);
        const bucketSize = range / 6;

        const buckets = Array.from({ length: 6 }).map((_, i) => {
            const start = firstTime + i * bucketSize;
            const end = start + bucketSize;
            const startDate = new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            const endDate = new Date(end).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return {
                label: `Phase ${i + 1}`,
                dateRange: `${startDate} - ${endDate}`,
                count: 0,
                cumulative: 0,
                userIds: [] as string[]
            };
        });

        let runningTotal = 0;
        sortedUsers.forEach(u => {
            const uTime = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : (u.createdAt?.toDate ? u.createdAt.toDate().getTime() : firstTime);
            let bucketIdx = Math.floor((uTime - firstTime) / bucketSize);
            if (bucketIdx < 0) bucketIdx = 0;
            if (bucketIdx >= 6) bucketIdx = 5;
            buckets[bucketIdx].count++;
            buckets[bucketIdx].userIds.push(u.id);
        });

        buckets.forEach(b => {
            runningTotal += b.count;
            b.cumulative = runningTotal;
        });

        return buckets;
    })();

    // Role dynamic segment definitions for SVG Donut (Role Dynamics)
    const donutSegments = (() => {
        const roles = [
            { id: "explorer", label: "Viewer", count: roleStats.explorer, color: "stroke-emerald-500", fill: "fill-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", bg: "bg-emerald-500/10", hex: "#10b981" },
            { id: "sparker", label: "Thinker", count: roleStats.sparker, color: "stroke-yellow-500", fill: "fill-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-500", bg: "bg-yellow-500/10", hex: "#eab308" },
            { id: "builder", label: "Builder", count: roleStats.builder, color: "stroke-indigo-500", fill: "fill-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500", bg: "bg-indigo-500/10", hex: "#6366f1" },
            { id: "catalyst", label: "Investor", count: roleStats.catalyst, color: "stroke-purple-500", fill: "fill-purple-500/10", border: "border-purple-500/20", text: "text-purple-500", bg: "bg-purple-500/10", hex: "#a855f7" }
        ];

        const total = roles.reduce((sum, r) => sum + r.count, 0) || 1;
        let cumulativeAngle = 0;

        return roles.map(r => {
            const percentage = (r.count / total) * 100;
            const angleSpan = (r.count / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angleSpan;
            cumulativeAngle = endAngle;

            return {
                ...r,
                percentage,
                startAngle,
                endAngle: angleSpan === 360 ? 359.9 : endAngle // prevent overlapping coordinates
            };
        });
    })();

    // Country demographic segments for SVG Bar Chart (Demographics)
    const countryStatsList = (() => {
        const counts: Record<string, number> = {};
        users.forEach(u => {
            const c = u.country || "Unknown";
            counts[c] = (counts[c] || 0) + 1;
        });

        const list = Object.entries(counts).map(([name, count]) => ({ name, count }));

        if (countrySort === "count") {
            list.sort((a, b) => b.count - a.count);
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        return list.slice(0, 5); // top 5 countries
    })();

    // Helper for donut slice SVG generator
    const getDonutSlicePath = (
        cx: number, cy: number, 
        innerRadius: number, outerRadius: number, 
        startAngle: number, endAngle: number
    ) => {
        const toRad = (degree: number) => (degree - 90) * Math.PI / 180;
        
        const sAngle = toRad(startAngle);
        const eAngle = toRad(endAngle);
        
        const x1_out = cx + outerRadius * Math.cos(sAngle);
        const y1_out = cy + outerRadius * Math.sin(sAngle);
        const x2_out = cx + outerRadius * Math.cos(eAngle);
        const y2_out = cy + outerRadius * Math.sin(eAngle);
        
        const x1_in = cx + innerRadius * Math.cos(eAngle);
        const y1_in = cy + innerRadius * Math.sin(eAngle);
        const x2_in = cx + innerRadius * Math.cos(sAngle);
        const y2_in = cy + innerRadius * Math.sin(sAngle);
        
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        return `
            M ${x1_out} ${y1_out}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2_out} ${y2_out}
            L ${x1_in} ${y1_in}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2_in} ${y2_in}
            Z
        `.replace(/\s+/g, " ").trim();
    };

    // Client-side filtering logic
    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = 
            statusFilter === "all" ? true :
            statusFilter === "pending" ? u.approved === false :
            u.approved !== false;

        const matchesRole = 
            roleFilter === "all" ? true :
            u.mode === roleFilter;

        const matchesTime = 
            timeFilterUserIds === null ? true :
            timeFilterUserIds.includes(u.id);

        return matchesSearch && matchesStatus && matchesRole && matchesTime;
    });

    if (authLoading) {
        return (
            <div className="flex-1 flex justify-center items-center bg-background min-h-screen">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin" />
            </div>
        );
    }

    // Render Admin Login Form if not logged in as admin
    if (!isAdmin) {
        return (
            <div className="flex-1 min-h-[90vh] flex items-center justify-center p-4 bg-background relative overflow-hidden nothing-grid">
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-[400px] nothing-radial-glow opacity-30" />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="bg-card p-8 sm:p-10 border border-border shadow-2xl rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                        <div className="text-center mb-8 z-10 relative space-y-2">
                            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center mx-auto shadow-inner">
                                <Lock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-2xl font-black font-dot tracking-tight text-foreground uppercase">Admin Authentication</h2>
                            <p className="text-muted-foreground font-mono text-[9px] uppercase tracking-widest leading-relaxed">Secure Workspace Control Console</p>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-4 z-10 relative">
                            {loginError && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-mono uppercase tracking-wider rounded-xl"
                                >
                                    {loginError}
                                </motion.div>
                            )}

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="adminEmail" className="text-muted-foreground font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Admin Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="adminEmail"
                                            type="email"
                                            placeholder="admin@inzly.com"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            required
                                            className="pl-10 h-11 bg-muted border-border text-foreground rounded-xl focus:ring-1 focus:ring-indigo-500 font-sans text-sm placeholder:text-muted-foreground/60"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="adminPassword" className="text-muted-foreground font-mono font-bold text-[9px] uppercase tracking-widest ml-1">Console Key</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="adminPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            required
                                            className="pl-10 h-11 bg-muted border-border text-foreground rounded-xl focus:ring-1 focus:ring-indigo-500 font-sans text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all group mt-6 cursor-pointer"
                                disabled={loginLoading}
                            >
                                {loginLoading ? "Verifying..." : (
                                    <>
                                        Access console
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-h-screen bg-background pt-24 pb-20 px-4 sm:px-6 relative nothing-grid">
            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                
                {/* Dashboard Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center px-2.5 py-0.5 border border-border bg-card text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse mr-2" />
                            Security clearance level 1
                        </div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-indigo-500" />
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground font-medium text-xs">Verify new users and manage platform directory metrics.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={fetchUsers} 
                            variant="outline" 
                            className="bg-card border-border hover:bg-muted text-foreground text-xs font-mono font-bold uppercase tracking-widest px-4 h-10 rounded-xl"
                        >
                            Sync DB
                        </Button>
                        <Button 
                            onClick={() => signOut()} 
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-mono font-bold uppercase tracking-widest px-4 h-10 rounded-xl cursor-pointer"
                        >
                            Lock console
                        </Button>
                    </div>
                </header>

                {/* Dashboard Analytics Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Widget 1: Total Users */}
                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest">Total Registered</p>
                                <p className="text-3xl font-black text-foreground">{totalUsers}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            Active Directory database
                        </p>
                    </div>

                    {/* Widget 2: Pending Approvals */}
                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors pointer-events-none" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest">Pending Review</p>
                                <p className="text-3xl font-black text-foreground">{pendingApprovals}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center animate-pulse">
                                <ShieldAlert className="w-5 h-5 text-yellow-500" />
                            </div>
                        </div>
                        <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-4 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            Manual review requested
                        </p>
                    </div>

                    {/* Widget 3: Approved Users */}
                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-colors pointer-events-none" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest">Approved Directory</p>
                                <p className="text-3xl font-black text-foreground">{approvedUsers}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                        <p className="text-[10px] text-green-600 dark:text-green-400 mt-4 font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            Active ecosystem nodes
                        </p>
                    </div>

                    {/* Widget 4: Role Distribution Percentage */}
                    <div className="p-6 bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />
                        <div className="flex justify-between items-start">
                            <div className="space-y-1.5 w-full">
                                <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-widest">Role distribution</p>
                                <div className="space-y-1.5 pt-1 pr-6 font-mono text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Investor</span>
                                        <span className="text-foreground">{roleStats.catalyst}</span>
                                    </div>
                                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${totalUsers ? (roleStats.catalyst / totalUsers) * 100 : 0}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>Builder</span>
                                        <span className="text-foreground">{roleStats.builder}</span>
                                    </div>
                                    <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalUsers ? (roleStats.builder / totalUsers) * 100 : 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EXECUTIVE INTERACTIVE ANALYTICS CONSOLE (Inzly v1.2.0) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="p-6 bg-card border border-border rounded-2xl shadow-xl relative overflow-hidden group nothing-grid"
                >
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    {/* Console Section Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-sm font-black font-dot uppercase tracking-wider text-foreground flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                                Executive Analytics Hub
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                Interactive visual system for high-level directory diagnostics
                            </p>
                        </div>

                        {/* Interactive Tab Controls */}
                        <div className="flex items-center gap-1 bg-muted/60 border border-border/80 p-0.5 rounded-xl">
                            <button
                                onClick={() => setChartTab("trends")}
                                className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${chartTab === "trends" ? "bg-card text-indigo-500 shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Trends
                            </button>
                            <button
                                onClick={() => setChartTab("distribution")}
                                className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${chartTab === "distribution" ? "bg-card text-purple-500 shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <PieChart className="w-3.5 h-3.5" />
                                Roles
                            </button>
                            <button
                                onClick={() => setChartTab("demographics")}
                                className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${chartTab === "demographics" ? "bg-card text-emerald-500 shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                Demographics
                            </button>
                            <button
                                onClick={() => setChartTab("kyc")}
                                className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${chartTab === "kyc" ? "bg-card text-red-500 shadow-sm border border-border/10" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <Lock className="w-3.5 h-3.5" />
                                KYC Audits
                                {pendingKycCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[7px] font-mono font-black scale-90 animate-pulse">
                                        {pendingKycCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Active Interactive Filters Status Indicator */}
                    {(timeFilterUserIds !== null || roleFilter !== "all") && (
                        <div className="mt-4 px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                <span>Active Interactive Filter Pivot:</span>
                                {timeFilterUserIds !== null && (
                                    <span className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-white text-[9px]">
                                        Timeline: {selectedTimelineLabel}
                                    </span>
                                )}
                                {roleFilter !== "all" && (
                                    <span className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded text-white text-[9px]">
                                        Role: {getLaymanRole(roleFilter)}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setTimeFilterUserIds(null);
                                    setSelectedTimelineLabel(null);
                                    setRoleFilter("all");
                                }}
                                className="text-[9px] text-muted-foreground hover:text-white flex items-center gap-1 transition-colors cursor-pointer border border-border/40 hover:border-white/20 px-2.5 py-0.5 rounded-lg bg-card/40"
                            >
                                <RefreshCw className="w-2.5 h-2.5" />
                                Clear Interactive Filters
                            </button>
                        </div>
                    )}

                    {/* Interactive Showcase Panel */}
                    <div className="mt-6 relative z-10 min-h-[250px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            
                            {/* Tab 1: Ecosystem Growth Trends (Line Curve Chart) */}
                            {chartTab === "trends" && (
                                <motion.div
                                    key="trends-chart"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-center"
                                >
                                    {/* Line SVG Visualization */}
                                    <div className="lg:col-span-2 relative flex flex-col items-center">
                                        <svg 
                                            viewBox="0 0 540 220" 
                                            className="w-full max-w-[540px] h-auto overflow-visible select-none"
                                            onMouseLeave={() => setHoveredDateIdx(null)}
                                        >
                                            <defs>
                                                {/* Area Glow under S-Curve */}
                                                <linearGradient id="trendsGlow" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                                </linearGradient>
                                                {/* Line color path gradient */}
                                                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#818cf8" />
                                                    <stop offset="50%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#a855f7" />
                                                </linearGradient>
                                                <filter id="laserGlow">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>

                                            {/* Horizontal grid lines */}
                                            {Array.from({ length: 4 }).map((_, i) => {
                                                const y = 40 + (i * 140) / 3;
                                                return (
                                                    <line 
                                                        key={i} 
                                                        x1="40" 
                                                        y1={y} 
                                                        x2="500" 
                                                        y2={y} 
                                                        className="stroke-border/40" 
                                                        strokeDasharray="4 6" 
                                                    />
                                                );
                                            })}

                                            {/* Build dynamic coordinate mappings */}
                                            {(() => {
                                                const chartWidth = 540;
                                                const chartHeight = 220;
                                                const chartPadding = 40;
                                                const maxVal = Math.max(...timelineData.map(t => t.cumulative), 1);

                                                const points = timelineData.map((d, idx) => {
                                                    const x = chartPadding + (idx * (chartWidth - 2 * chartPadding)) / 5;
                                                    const y = chartHeight - chartPadding - (d.cumulative * (chartHeight - 2 * chartPadding)) / maxVal;
                                                    return { x, y, ...d };
                                                });

                                                const getBezierPathStr = (pts: typeof points) => {
                                                    if (pts.length === 0) return "";
                                                    let path = `M ${pts[0].x} ${pts[0].y}`;
                                                    for (let i = 0; i < pts.length - 1; i++) {
                                                        const p0 = pts[i];
                                                        const p1 = pts[i + 1];
                                                        const cp1x = p0.x + (p1.x - p0.x) / 3;
                                                        const cp1y = p0.y;
                                                        const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                                                        const cp2y = p1.y;
                                                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                                                    }
                                                    return path;
                                                };

                                                const bezierStr = getBezierPathStr(points);
                                                const fillStr = bezierStr 
                                                    ? `${bezierStr} L ${points[points.length - 1].x} ${chartHeight - chartPadding} L ${points[0].x} ${chartHeight - chartPadding} Z` 
                                                    : "";

                                                return (
                                                    <>
                                                        {/* Gradient Area Fill */}
                                                        {fillStr && <path d={fillStr} fill="url(#trendsGlow)" className="transition-all duration-300" />}

                                                        {/* Curved Cubic Bezier Trendline */}
                                                        {bezierStr && (
                                                            <path 
                                                                d={bezierStr} 
                                                                fill="none" 
                                                                stroke="url(#lineColor)" 
                                                                strokeWidth="3.5" 
                                                                strokeLinecap="round" 
                                                                className="transition-all duration-300 drop-shadow-[0_2px_8px_rgba(99,102,241,0.3)]" 
                                                            />
                                                        )}

                                                        {/* Mouse interaction zones */}
                                                        {points.map((p, idx) => {
                                                            const isHovered = hoveredDateIdx === idx;
                                                            return (
                                                                <g 
                                                                    key={idx}
                                                                    onMouseEnter={() => setHoveredDateIdx(idx)}
                                                                    onClick={() => {
                                                                        setTimeFilterUserIds(p.userIds);
                                                                        setSelectedTimelineLabel(p.label);
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {/* Hover Laser Line */}
                                                                    {isHovered && (
                                                                        <line 
                                                                            x1={p.x} 
                                                                            y1="25" 
                                                                            x2={p.x} 
                                                                            y2="180" 
                                                                            className="stroke-indigo-500/40" 
                                                                            strokeWidth="1.5"
                                                                            strokeDasharray="3 3"
                                                                            filter="url(#laserGlow)"
                                                                        />
                                                                    )}

                                                                    {/* Core Node circle */}
                                                                    <circle 
                                                                        cx={p.x} 
                                                                        cy={p.y} 
                                                                        r={isHovered ? 7.5 : 4.5} 
                                                                        className={`transition-all duration-200 fill-card stroke-[2.5] ${isHovered ? "stroke-indigo-500 scale-125" : "stroke-indigo-400/80"}`} 
                                                                    />

                                                                    {/* Invisible broad mouse hover catcher */}
                                                                    <circle 
                                                                        cx={p.x} 
                                                                        cy={p.y} 
                                                                        r="16" 
                                                                        className="fill-transparent" 
                                                                    />
                                                                </g>
                                                            );
                                                        })}

                                                        {/* Time Scale Labels */}
                                                        {points.map((p, idx) => (
                                                            <text 
                                                                key={idx} 
                                                                x={p.x} 
                                                                y={chartHeight - 12} 
                                                                textAnchor="middle" 
                                                                className="fill-muted-foreground font-mono text-[9px] font-bold uppercase tracking-wider"
                                                            >
                                                                {p.label}
                                                            </text>
                                                        ))}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                    </div>

                                    {/* Line Chart Interactive Tooltip display (1/3 width) */}
                                    <div className="bg-muted/40 border border-border/80 p-5 rounded-2xl space-y-4 font-mono text-xs uppercase tracking-wider font-bold">
                                        <div className="flex items-center gap-2 border-b border-border pb-3">
                                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[11px] font-black text-foreground">Interactive Timeline</span>
                                        </div>

                                        {hoveredDateIdx !== null ? (
                                            <div className="space-y-3 animate-fade-in text-[10px]">
                                                <div>
                                                    <span className="text-muted-foreground block text-[9px] tracking-widest font-bold">Period interval</span>
                                                    <span className="text-white text-xs">{timelineData[hoveredDateIdx].dateRange}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-muted-foreground block text-[9px] tracking-widest">New Signups</span>
                                                        <span className="text-indigo-400 text-lg font-black">{timelineData[hoveredDateIdx].count}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block text-[9px] tracking-widest">Total Nodes</span>
                                                        <span className="text-white text-lg font-black">{timelineData[hoveredDateIdx].cumulative}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[8px] text-indigo-400/80 italic leading-relaxed border-t border-border/30 pt-2 font-normal">
                                                    Click this point to isolate registered accounts inside the list below.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground text-[10px] space-y-2 font-normal normal-case leading-relaxed">
                                                <span className="w-2.5 h-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                                                    <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                                </span>
                                                <p className="uppercase tracking-widest font-bold text-[9px] text-zinc-400">Tactical Cursor Guide</p>
                                                <p className="text-zinc-500">Hover dates to track ecosystem nodes growth. Click nodes to filter user table.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab 2: Role Density Analytics (SVG Donut Chart) */}
                            {chartTab === "distribution" && (
                                <motion.div
                                    key="distribution-chart"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
                                >
                                    {/* Donut SVG Illustration */}
                                    <div className="flex justify-center items-center relative">
                                        <svg 
                                            viewBox="0 0 260 260" 
                                            className="w-full max-w-[260px] h-auto overflow-visible select-none"
                                            onMouseLeave={() => setHoveredRoleSegment(null)}
                                        >
                                            <defs>
                                                <filter id="segmentGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                            </defs>
                                            <g transform="translate(130, 130)">
                                                {donutSegments.map((r, idx) => {
                                                    const isHovered = hoveredRoleSegment === r.id;
                                                    const isFiltered = roleFilter === r.id;
                                                    const slicePath = getDonutSlicePath(0, 0, 78, 108, r.startAngle, r.endAngle);

                                                    // Translate vector along mid-angle for hover slice-pop
                                                    const midRad = ((r.startAngle + r.endAngle) / 2 - 90) * Math.PI / 180;
                                                    const shift = isHovered ? 8 : 0;
                                                    const tx = shift * Math.cos(midRad);
                                                    const ty = shift * Math.sin(midRad);

                                                    return (
                                                        <g
                                                            key={r.id}
                                                            transform={`translate(${tx}, ${ty})`}
                                                            onMouseEnter={() => setHoveredRoleSegment(r.id)}
                                                            onClick={() => {
                                                                if (roleFilter === r.id) {
                                                                    setRoleFilter("all");
                                                                } else {
                                                                    setRoleFilter(r.id);
                                                                }
                                                            }}
                                                            className="cursor-pointer transition-all duration-300"
                                                        >
                                                            {/* Segment path block */}
                                                            <path
                                                                d={slicePath}
                                                                className={`transition-all duration-300 stroke-[1.5] ${r.fill} ${r.color} ${isHovered || isFiltered ? "opacity-100 filter drop-shadow-md" : "opacity-85"}`}
                                                                style={{
                                                                    filter: isHovered ? `drop-shadow(0 0 8px ${r.hex}50)` : "none"
                                                                }}
                                                            />
                                                        </g>
                                                    );
                                                })}
                                            </g>

                                            {/* Center Label Hole display */}
                                            {(() => {
                                                const hoveredSeg = donutSegments.find(s => s.id === hoveredRoleSegment);
                                                if (hoveredSeg) {
                                                    return (
                                                        <g transform="translate(130, 130)" textAnchor="middle" className="pointer-events-none font-mono">
                                                            <text y="-18" className="fill-muted-foreground text-[8px] font-bold uppercase tracking-widest">{hoveredSeg.label}</text>
                                                            <text y="8" className="fill-white text-lg font-black tracking-tight">{hoveredSeg.count} Nodes</text>
                                                            <text y="28" className={`${hoveredSeg.text} text-[10px] font-bold`}>{hoveredSeg.percentage.toFixed(1)}% Share</text>
                                                        </g>
                                                    );
                                                }
                                                return (
                                                    <g transform="translate(130, 130)" textAnchor="middle" className="pointer-events-none font-mono">
                                                        <text y="-14" className="fill-muted-foreground text-[8px] font-bold uppercase tracking-widest">Ecosystem</text>
                                                        <text y="8" className="fill-white text-base font-black tracking-tight">{users.length} Nodes</text>
                                                        <text y="24" className="fill-indigo-400 text-[8px] font-bold uppercase tracking-widest">Total Seeded</text>
                                                    </g>
                                                );
                                            })()}
                                        </svg>
                                    </div>

                                    {/* Donut interactive metrics list */}
                                    <div className="space-y-4">
                                        <div className="bg-muted/40 border border-border/80 p-5 rounded-2xl space-y-4">
                                            <div className="flex items-center gap-2 border-b border-border pb-3 font-mono text-xs uppercase tracking-wider font-bold">
                                                <PieChart className="w-4 h-4 text-purple-500" />
                                                <span className="text-[11px] font-black text-foreground">Interactive Segment Roles</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {donutSegments.map(s => {
                                                    const isFiltered = roleFilter === s.id;
                                                    return (
                                                        <div 
                                                            key={s.id} 
                                                            onClick={() => {
                                                                if (roleFilter === s.id) {
                                                                    setRoleFilter("all");
                                                                } else {
                                                                    setRoleFilter(s.id);
                                                                }
                                                            }}
                                                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 font-mono cursor-pointer transition-all ${isFiltered ? "bg-indigo-500/10 border-indigo-500/30 scale-[1.02]" : "bg-card/40 border-border/40 hover:border-border/80"}`}
                                                        >
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.bg} border ${s.border}`} />
                                                                <span className="text-[10px] font-black uppercase text-foreground">{s.label}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xs font-black text-white block">{s.count}</span>
                                                                <span className="text-[8px] text-muted-foreground block">{s.percentage.toFixed(0)}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="font-mono text-[8px] text-purple-400 italic text-center mt-2 leading-relaxed font-normal">
                                                Hover slices to inspect segment density. Click grid roles or slices to filter user directory.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab 3: Geographic Demographics & Sector Taxonomy Tags */}
                            {chartTab === "demographics" && (
                                <motion.div
                                    key="demographics-chart"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 items-center"
                                >
                                    {/* Countries SVG Bar Chart (2/3 width) */}
                                    <div className="lg:col-span-2 relative flex flex-col items-center">
                                        <div className="w-full flex items-center justify-between mb-4 border-b border-border/40 pb-2.5">
                                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Geographic Distribution Metrics</span>
                                            <div className="flex items-center gap-1.5 bg-muted/40 border border-border/60 p-0.5 rounded-lg">
                                                <button
                                                    onClick={() => setCountrySort("count")}
                                                    className={`px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${countrySort === "count" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    By Density
                                                </button>
                                                <button
                                                    onClick={() => setCountrySort("name")}
                                                    className={`px-2.5 py-1 text-[8px] font-mono font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${countrySort === "name" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                    A-Z Name
                                                </button>
                                            </div>
                                        </div>

                                        <svg 
                                            viewBox="0 0 500 200" 
                                            className="w-full max-w-[500px] h-auto overflow-visible select-none"
                                            onMouseLeave={() => setHoveredCountryIdx(null)}
                                        >
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                                                    <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
                                                </linearGradient>
                                                <linearGradient id="barGlowGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                                                    <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
                                                </linearGradient>
                                            </defs>

                                            {/* Draw horizontal benchmark lines */}
                                            {Array.from({ length: 4 }).map((_, i) => {
                                                const y = 20 + (i * 120) / 3;
                                                return (
                                                    <line 
                                                        key={i} 
                                                        x1="35" 
                                                        y1={y} 
                                                        x2="465" 
                                                        y2={y} 
                                                        className="stroke-border/20" 
                                                        strokeDasharray="2 4" 
                                                    />
                                                );
                                            })}

                                            {/* Dynamic Bars Rendering */}
                                            {(() => {
                                                const maxCount = Math.max(...countryStatsList.map(c => c.count), 1);
                                                const padding = 35;
                                                const width = 500;
                                                const height = 180;
                                                const gap = 15;
                                                const countList = countryStatsList.length || 1;
                                                const barWidth = (width - 2 * padding) / countList - gap;

                                                return countryStatsList.map((c, idx) => {
                                                    const barHeight = (c.count / maxCount) * (height - 2 * padding);
                                                    const x = padding + idx * (barWidth + gap) + gap / 2;
                                                    const y = height - padding - barHeight;
                                                    const isHovered = hoveredCountryIdx === idx;

                                                    return (
                                                        <g 
                                                            key={c.name}
                                                            onMouseEnter={() => setHoveredCountryIdx(idx)}
                                                            onClick={() => setSearchQuery(c.name)}
                                                            className="cursor-pointer"
                                                        >
                                                            {/* Spring animated looking bar */}
                                                            <rect
                                                                x={x}
                                                                y={y}
                                                                width={barWidth}
                                                                height={Math.max(barHeight, 4)}
                                                                rx={4}
                                                                ry={4}
                                                                fill={isHovered ? "url(#barGlowGradient)" : "url(#barGradient)"}
                                                                className="transition-all duration-300 stroke-emerald-500/20 stroke-[1.5]"
                                                                style={{
                                                                    filter: isHovered ? "drop-shadow(0 0 6px rgba(16,185,129,0.3))" : "none"
                                                                }}
                                                            />

                                                            {/* Country label text */}
                                                            <text
                                                                x={x + barWidth / 2}
                                                                y={height - 12}
                                                                textAnchor="middle"
                                                                className="fill-muted-foreground font-mono text-[8px] font-bold uppercase tracking-wider"
                                                            >
                                                                {c.name.slice(0, 8)}
                                                            </text>
                                                        </g>
                                                    );
                                                });
                                            })()}
                                        </svg>
                                    </div>

                                    {/* Taxonomy tags list / quick summary (1/3 width) */}
                                    <div className="bg-muted/40 border border-border/80 p-5 rounded-2xl space-y-4 font-mono text-xs uppercase tracking-wider font-bold">
                                        <div className="flex items-center gap-2 border-b border-border pb-3">
                                            <Globe className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[11px] font-black text-emerald-400">Interactive Hotspots</span>
                                        </div>

                                        {hoveredCountryIdx !== null ? (
                                            <div className="space-y-3 animate-fade-in text-[10px]">
                                                <div>
                                                    <span className="text-muted-foreground block text-[9px] tracking-widest font-bold">Target Region</span>
                                                    <span className="text-white text-xs">{countryStatsList[hoveredCountryIdx].name}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[9px] tracking-widest">Active Signups</span>
                                                    <span className="text-emerald-400 text-lg font-black">{countryStatsList[hoveredCountryIdx].count} Accounts</span>
                                                </div>
                                                <p className="text-[8px] text-emerald-400/80 italic leading-relaxed border-t border-border/30 pt-2 font-normal">
                                                    Click this bar to filter the directory listing to users from {countryStatsList[hoveredCountryIdx].name}.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center text-muted-foreground text-[10px] space-y-2 font-normal normal-case leading-relaxed">
                                                <span className="w-2.5 h-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                                                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                                </span>
                                                <p className="uppercase tracking-widest font-bold text-[9px] text-zinc-400">Demographic Vector</p>
                                                <p className="text-zinc-500">Hover geographic coordinates to audit regional signups. Click columns to search that country.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Tab 4: KYC Audits Panel */}
                            {chartTab === "kyc" && (
                                <motion.div
                                    key="kyc-panel"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="w-full space-y-4"
                                >
                                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">Identity & anti-spam audits workspace</span>
                                        <span className="bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-red-500/5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                            {pendingKycCount} applications pending audit
                                        </span>
                                    </div>

                                    {users.filter(u => u.kycStatus === "pending").length === 0 ? (
                                        <div className="py-12 text-center bg-muted/20 border border-border/40 rounded-xl space-y-2 max-w-lg mx-auto">
                                            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto animate-bounce" />
                                            <p className="text-foreground text-xs font-mono font-bold uppercase tracking-wide">All Audits Cleared</p>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed max-w-xs mx-auto">No pending KYC submissions exist in the directory database queue. Clear anti-spam signal maintained.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                            {users.filter(u => u.kycStatus === "pending").map((u) => {
                                                const initials = u.name
                                                    ? u.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                                                    : "?";
                                                return (
                                                    <div key={u.id} className="p-4 bg-muted/40 border border-border/60 hover:border-border rounded-2xl flex flex-col justify-between gap-4 font-mono relative overflow-hidden transition-all shadow-sm">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-border flex items-center justify-center font-dot font-black text-foreground text-xs shrink-0">
                                                                    {initials}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="text-[11px] font-black text-foreground truncate">{u.name}</h4>
                                                                    <p className="text-[9px] text-muted-foreground truncate">@{u.username}</p>
                                                                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1 py-0.5 rounded mt-1 inline-block">
                                                                        {getLaymanRole(u.mode)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[8px] text-muted-foreground block uppercase">Challenge Score</span>
                                                                <span className="text-xs font-black text-indigo-400 block">{u.kycApplication?.score || 0} / 3</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2 border-t border-border/20 pt-2.5">
                                                            <div className="flex items-center justify-between text-[9px] gap-2 text-muted-foreground">
                                                                <span>LinkedIn:</span>
                                                                <a 
                                                                    href={u.kycApplication?.linkedin} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="text-indigo-400 hover:text-white truncate max-w-[150px] underline hover:no-underline transition-colors"
                                                                >
                                                                    {u.kycApplication?.linkedin.replace(/https?:\/\/(www\.)?/, "")}
                                                                </a>
                                                            </div>
                                                            {u.kycApplication?.website && u.kycApplication.website !== "None" && (
                                                                <div className="flex items-center justify-between text-[9px] gap-2 text-muted-foreground">
                                                                    <span>Website/GitHub:</span>
                                                                    <a 
                                                                        href={u.kycApplication.website} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="text-emerald-400 hover:text-white truncate max-w-[150px] underline hover:no-underline transition-colors"
                                                                    >
                                                                        {u.kycApplication.website.replace(/https?:\/\/(www\.)?/, "")}
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 border-t border-border/20 pt-3">
                                                            <Button
                                                                onClick={() => handleKycClearance(u.id, false)}
                                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-mono text-[8px] font-bold uppercase tracking-widest h-8 rounded-xl cursor-pointer"
                                                            >
                                                                Decline
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleKycClearance(u.id, true)}
                                                                className="bg-green-600 hover:bg-green-700 text-white font-mono text-[8px] font-bold uppercase tracking-widest h-8 rounded-xl cursor-pointer"
                                                            >
                                                                Clear Node
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>

                </motion.div>

                {/* Main Dashboard Workspace Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Column: Interest Taxonomy Analytics (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-5">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Sliders className="w-5 h-5 text-indigo-500" />
                                <h3 className="text-[11px] font-black text-foreground uppercase tracking-wider font-mono">Taxonomy interests analytics</h3>
                            </div>

                            {topInterests.length === 0 ? (
                                <p className="text-muted-foreground text-xs text-center py-6 font-mono">No sector interests seeded in profile tags.</p>
                            ) : (
                                <div className="space-y-4 font-mono text-xs uppercase tracking-wider font-bold">
                                    {topInterests.map(([tag, count], idx) => {
                                        const maxCount = topInterests[0][1] || 1;
                                        return (
                                            <div key={tag} className="space-y-1.5">
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>#{tag}</span>
                                                    <span className="text-foreground">{count} Accounts</span>
                                                </div>
                                                <div className="w-full bg-muted h-2.5 rounded-lg overflow-hidden border border-border/20">
                                                    <div 
                                                        className={`h-full rounded-lg ${
                                                            idx === 0 ? "bg-indigo-500" :
                                                            idx === 1 ? "bg-purple-500" :
                                                            idx === 2 ? "bg-blue-500" : "bg-yellow-500"
                                                        }`} 
                                                        style={{ width: `${(count / maxCount) * 100}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: User Management Board (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm space-y-6">
                            
                            {/* Toolbar controls */}
                            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between border-b border-border pb-5">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search directory by name, username, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-muted border-border text-foreground rounded-xl h-10 focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Status Filter */}
                                    <div className="inline-flex bg-muted border border-border rounded-xl p-0.5">
                                        <button 
                                            onClick={() => setStatusFilter("all")} 
                                            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${statusFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            All
                                        </button>
                                        <button 
                                            onClick={() => setStatusFilter("pending")} 
                                            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${statusFilter === "pending" ? "bg-card text-yellow-500 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Pending
                                        </button>
                                        <button 
                                            onClick={() => setStatusFilter("approved")} 
                                            className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${statusFilter === "approved" ? "bg-card text-green-500 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            Approved
                                        </button>
                                    </div>

                                    {/* Role Selector */}
                                    <select 
                                        value={roleFilter} 
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="bg-muted border border-border rounded-xl px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground focus:outline-none focus:text-foreground cursor-pointer h-10"
                                    >
                                        <option value="all">Roles (All)</option>
                                        <option value="explorer">Viewer</option>
                                        <option value="sparker">Thinker</option>
                                        <option value="builder">Builder</option>
                                        <option value="catalyst">Investor</option>
                                    </select>
                                </div>
                            </div>

                            {/* User management list */}
                            <div className="space-y-3">
                                {loadingData ? (
                                    <div className="py-20 text-center flex justify-center items-center">
                                        <div className="w-6 h-6 rounded-full border-t-2 border-indigo-500 animate-spin" />
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="py-16 text-center bg-muted/40 border border-border rounded-xl space-y-2">
                                        <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                                        <p className="text-muted-foreground text-xs font-mono">No matching records found in active directory.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        <AnimatePresence mode="popLayout">
                                            {filteredUsers.map((profileUser) => {
                                                const initials = profileUser.name
                                                    ? profileUser.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                                                    : "?";
                                                const isUnapproved = profileUser.approved === false;
                                                return (
                                                    <motion.div
                                                        layout
                                                        key={profileUser.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.98 }}
                                                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                    >
                                                        {/* User Details */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-border flex items-center justify-center font-dot font-black text-foreground text-sm shrink-0">
                                                                {initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="text-sm font-bold text-foreground truncate pr-2">
                                                                    {profileUser.name}
                                                                    <span className="ml-2 font-normal font-mono text-[10px] text-muted-foreground">@{profileUser.username}</span>
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground font-mono truncate">{profileUser.email}</p>
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-[8px] font-bold uppercase tracking-wider">
                                                                    <span className="text-indigo-500 dark:text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded">
                                                                        {getLaymanRole(profileUser.mode)}
                                                                    </span>
                                                                    <span className="text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                        <Globe className="w-2.5 h-2.5" />
                                                                        {profileUser.country}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Manual status controls */}
                                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                            {isUnapproved ? (
                                                                <span className="px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse" />
                                                                    Under Review
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1">
                                                                    <span className="w-1 h-1 rounded-full bg-green-500" />
                                                                    Approved Node
                                                                </span>
                                                            )}

                                                            <div className="h-4 w-px bg-border hidden sm:block" />

                                                            {isUnapproved ? (
                                                                <Button
                                                                    onClick={() => handleStatusUpdate(profileUser.id, true)}
                                                                    className="bg-green-600 hover:bg-green-700 text-white font-mono text-[9px] font-bold uppercase tracking-widest px-3 h-8 rounded-lg cursor-pointer"
                                                                >
                                                                    Approve
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => handleStatusUpdate(profileUser.id, false)}
                                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-mono text-[9px] font-bold uppercase tracking-widest px-3 h-8 rounded-lg cursor-pointer"
                                                                >
                                                                    Revoke
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
