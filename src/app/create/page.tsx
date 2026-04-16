"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { containsSpam } from "@/lib/filter";
import { Github } from "@/components/icons";
import { getCurrentLocation, getNearestCity, encodeGeohash, ExecutionStatus } from "@/lib/geoUtils";

const CATEGORIES = [
    "SaaS",
    "Consumer Social",
    "Fintech",
    "Healthtech",
    "AI/ML",
    "DevTools",
    "E-commerce",
    "Other"
];



export default function CreateIdeaPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState<"idea" | "problem">("idea");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [githubUrl, setGithubUrl] = useState("");
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatus>("Thinking");
    const [problemId, setProblemId] = useState<string | null>(null);
    const [problems, setProblems] = useState<any[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; city: string } | null>(null);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const pos = await getCurrentLocation();
                const city = getNearestCity(pos.lat, pos.lng);
                setUserLocation({ ...pos, city });
            } catch (err) {
                console.error("Auto-location failed:", err);
            }
        };

        const fetchProblems = async () => {
            try {
                const q = query(collection(db, "problems"), orderBy("createdAt", "desc"), limit(20));
                const snap = await getDocs(q);
                setProblems(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
            } catch (e) {
                console.error("Failed to fetch problems:", e);
            }
        };

        fetchLocation();
        fetchProblems();
    }, []);

    if (loading) {
        return <div className="flex-1 flex justify-center items-center">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0B0B0F]">
                <h2 className="text-xl font-medium text-white mb-6">Authentication required to participate.</h2>
                <Link href="/login">
                    <Button className="bg-white text-black hover:bg-zinc-200">Log In</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !category) {
            setError("All fields are required.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        if (containsSpam(title) || containsSpam(description)) {
            setError("Content flagged by filter. Please refine your phrasing.");
            setIsSubmitting(false);
            return;
        }

        let loc = userLocation;
        if (!loc) {
            try {
                const pos = await getCurrentLocation();
                const city = getNearestCity(pos.lat, pos.lng);
                loc = { ...pos, city };
                setUserLocation(loc);
            } catch (err) {
                setError("Location access is required to participate. Please enable location permissions.");
                setIsSubmitting(false);
                return;
            }
        }

        try {
            if (mode === "problem") {
                await addDoc(collection(db, "problems"), {
                    title,
                    description,
                    category,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                    status: "open",
                    location: {
                        lat: loc.lat,
                        lng: loc.lng,
                        city: loc.city,
                        geohash: encodeGeohash(loc.lat, loc.lng)
                    }
                });
            } else {
                const ideaDoc = await addDoc(collection(db, "ideas"), {
                    title,
                    idea: description,
                    category,
                    githubUrl: githubUrl.trim() || null,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                    problemId: problemId || null,
                    executionStatus: executionStatus,
                    currentVersion: 1,
                    location: {
                        lat: loc.lat,
                        lng: loc.lng,
                        city: loc.city,
                        geohash: encodeGeohash(loc.lat, loc.lng)
                    },
                    visibility: "public"
                });

                // Create initial v1 snapshot
                await addDoc(collection(db, "ideas", ideaDoc.id, "versions"), {
                    versionNumber: 1,
                    titleSnapshot: title,
                    descriptionSnapshot: description,
                    changelog: "Initial Concept",
                    timestamp: serverTimestamp()
                });
            }
            router.push("/");
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to commit content.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-8 min-h-screen overflow-x-hidden bg-[#050507]">
            <div className="w-full max-w-2xl space-y-8 bg-[#0a0a0c] p-8 sm:p-10 rounded-[32px] border border-white/[0.04] shadow-2xl relative">
                
                {/* ─── Mode Toggle ─── */}
                <div className="flex bg-white/[0.03] p-1 rounded-2xl border border-white/[0.05]">
                    <button 
                        onClick={() => setMode("idea")}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "idea" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-500 hover:text-white"}`}
                    >
                        Publish Idea
                    </button>
                    <button 
                        onClick={() => setMode("problem") }
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "problem" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "text-zinc-500 hover:text-white"}`}
                    >
                        Define Problem
                    </button>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-white mb-2">
                        {mode === "idea" ? "Commit Innovation" : "Articulate Challenge"}
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium tracking-wide">
                        {mode === "idea" ? "Ideas move toward execution through refinement." : "Define a problem that needs a brilliant solution."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-zinc-400 font-medium ml-1 text-[10px] uppercase tracking-widest">
                                {mode === "idea" ? "Idea Title" : "Problem Statement"}
                            </Label>
                            <Input
                                id="title"
                                placeholder={mode === "idea" ? "e.g. Decentralized Energy Grid" : "e.g. Inefficient Last-Mile Logistics in Rural Areas"}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 px-4 text-base transition-all"
                                maxLength={80}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-zinc-400 font-medium ml-1 text-[10px] uppercase tracking-widest">Sector</Label>
                                <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
                                    <SelectTrigger className="w-full h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 px-4 text-base transition-all">
                                        <SelectValue placeholder="Select Sector" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0c] border-white/[0.05] text-white rounded-xl">
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {mode === "idea" && (
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-zinc-400 font-medium ml-1 text-[10px] uppercase tracking-widest">Current Status</Label>
                                    <Select value={executionStatus} onValueChange={(val) => setExecutionStatus(val as ExecutionStatus)} required>
                                        <SelectTrigger className="w-full h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 px-4 text-base transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#0a0a0c] border-white/[0.05] text-white rounded-xl">
                                            <SelectItem value="Thinking" className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">Thinking</SelectItem>
                                            <SelectItem value="Refining" className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">Refining</SelectItem>
                                            <SelectItem value="Building" className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">Building</SelectItem>
                                            <SelectItem value="Launched" className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">Launched</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {mode === "idea" && (
                            <div className="space-y-2">
                                <Label htmlFor="problemLink" className="text-zinc-400 font-medium ml-1 text-[10px] uppercase tracking-widest">Linked Problem (Optional)</Label>
                                <Select value={problemId || "standalone"} onValueChange={(val) => setProblemId(val === "standalone" ? null : val)}>
                                    <SelectTrigger className="w-full h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 px-4 text-sm transition-all">
                                        <SelectValue placeholder="Standalone Idea" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0a0a0c] border-white/[0.05] text-white rounded-xl">
                                        <SelectItem value="standalone" className="focus:bg-indigo-500/20 focus:text-white cursor-pointer rounded-lg my-1 italic text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Standalone Concept</SelectItem>
                                        {problems.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="focus:bg-white/[0.05] focus:text-white cursor-pointer rounded-lg my-1">
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-zinc-400 font-medium ml-1 text-[10px] uppercase tracking-widest">
                                {mode === "idea" ? "The Solution" : "Context & Impact"}
                            </Label>
                            <Textarea
                                id="description"
                                placeholder={mode === "idea" ? "Describe your brilliant execution plan..." : "Why is this a priority? Who does it affect?"}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="min-h-[160px] bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 p-4 text-base resize-none transition-all"
                            />
                        </div>

                        {mode === "idea" && (
                            <div className="space-y-2">
                                <Label htmlFor="githubUrl" className="text-zinc-400 font-medium ml-1 flex items-center text-[10px] uppercase tracking-widest">
                                    <Github className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                    Repository (Optional)
                                </Label>
                                <Input
                                    id="githubUrl"
                                    placeholder="https://github.com/organization/repository"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    className="h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-indigo-500/50 px-4 text-base transition-all"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-white/[0.02]">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-white rounded-xl px-6 h-12"
                        >
                            Back
                        </Button>
                        <Button 
                            type="submit" 
                            className={`rounded-xl px-8 h-12 font-bold transition-all hover:scale-[1.02] ${mode === "idea" ? "bg-indigo-500 text-white" : "bg-purple-500 text-white"}`} 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Committing..." : (mode === "idea" ? "Publish Idea" : "Post Problem")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

