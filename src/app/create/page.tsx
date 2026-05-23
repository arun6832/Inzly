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
    const [visibility, setVisibility] = useState<"public" | "restricted" | "investor">("public");
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
        return (
            <div className="flex-1 flex justify-center items-center bg-black min-h-screen nothing-grid">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] animate-pulse">Loading Studio Session...</span>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black min-h-screen nothing-grid">
                <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest mb-6">Authentication required to participate.</h2>
                <Link href="/login">
                    <Button className="bg-white text-black hover:bg-black hover:text-white border border-white rounded-none px-6 h-11 font-mono uppercase tracking-widest text-[10px] font-bold transition-colors">Log In</Button>
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
                    visibility: visibility
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
        <div className="flex-1 flex items-center justify-center p-4 py-12 min-h-screen overflow-x-hidden bg-black nothing-grid">
            <div className="w-full max-w-2xl space-y-8 bg-black p-8 sm:p-10 rounded-none border border-white/10 shadow-2xl relative">
                
                {/* Structural hairline graph grid within the form chassis */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                {/* ─── Mode Toggle (Stark Monochrome Hardware Selectors) ─── */}
                <div className="flex bg-black p-1 rounded-none border border-white/10 z-10 relative">
                    <button 
                        type="button"
                        onClick={() => setMode("idea")}
                        className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-widest rounded-none transition-all ${mode === "idea" ? "bg-white text-black font-black" : "text-zinc-500 hover:text-white"}`}
                    >
                        Publish Idea
                    </button>
                    <button 
                        type="button"
                        onClick={() => setMode("problem") }
                        className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-widest rounded-none transition-all ${mode === "problem" ? "bg-white text-black font-black" : "text-zinc-500 hover:text-white"}`}
                    >
                        Define Problem
                    </button>
                </div>

                <div className="text-center space-y-2 z-10 relative">
                    <h2 className="text-2xl font-bold font-dot uppercase tracking-wider text-white mb-2">
                        {mode === "idea" ? "Commit Innovation" : "Articulate Challenge"}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        {mode === "idea" ? "Ideas move toward execution through refinement." : "Define a problem that needs a brilliant solution."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 z-10 relative">
                    {error && (
                        <div className="p-4 bg-black border border-red-600/30 text-red-600 text-[10px] font-mono uppercase tracking-wider rounded-none">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">
                                {mode === "idea" ? "Idea Title" : "Problem Statement"}
                            </Label>
                            <Input
                                id="title"
                                placeholder={mode === "idea" ? "e.g. Decentralized Energy Grid" : "e.g. Inefficient Last-Mile Logistics in Rural Areas"}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-12 bg-transparent border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 px-4 text-sm font-mono transition-colors placeholder:text-zinc-700"
                                maxLength={80}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">Sector</Label>
                                <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
                                    <SelectTrigger className="w-full h-12 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-sm font-mono transition-colors">
                                        <SelectValue placeholder="Select Sector" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                                        {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {mode === "idea" && (
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">Current Status</Label>
                                    <Select value={executionStatus} onValueChange={(val) => setExecutionStatus(val as ExecutionStatus)} required>
                                        <SelectTrigger className="w-full h-12 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-sm font-mono transition-colors">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                                            <SelectItem value="Thinking" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">Thinking</SelectItem>
                                            <SelectItem value="Refining" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">Refining</SelectItem>
                                            <SelectItem value="Building" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">Building</SelectItem>
                                            <SelectItem value="Launched" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs uppercase tracking-wide">Launched</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {mode === "idea" && (
                                <div className="space-y-2">
                                    <Label htmlFor="visibility" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">Visibility</Label>
                                    <Select value={visibility} onValueChange={(val) => setVisibility(val as any)} required>
                                        <SelectTrigger className="w-full h-12 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-sm font-mono transition-colors">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                                            <SelectItem value="public" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs">
                                                <div className="flex flex-col items-start gap-0.5 py-1">
                                                    <span className="font-bold uppercase tracking-wider">Public</span>
                                                    <span className="text-[8px] text-zinc-500 uppercase tracking-tight font-medium">Visible to all users in feed.</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="restricted" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs">
                                                <div className="flex flex-col items-start gap-0.5 py-1">
                                                    <span className="font-bold uppercase tracking-wider">Restricted</span>
                                                    <span className="text-[8px] text-zinc-500 uppercase tracking-tight font-medium">Requires approval + Soft NDA.</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="investor" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs">
                                                <div className="flex flex-col items-start gap-0.5 py-1">
                                                    <span className="font-bold uppercase tracking-wider">Investor Only</span>
                                                    <span className="text-[8px] text-zinc-500 uppercase tracking-tight font-medium">Only Catalysts + Soft NDA.</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        {mode === "idea" && (
                            <div className="space-y-2">
                                <Label htmlFor="problemLink" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">Linked Problem (Optional)</Label>
                                <Select value={problemId || "standalone"} onValueChange={(val) => setProblemId(val === "standalone" ? null : val)}>
                                    <SelectTrigger className="w-full h-12 bg-transparent border-white/10 text-white rounded-none focus:border-white focus:ring-0 px-4 text-sm font-mono transition-colors">
                                        <SelectValue placeholder="Standalone Idea" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border border-white/10 text-white rounded-none">
                                        <SelectItem value="standalone" className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-[9px] uppercase tracking-widest font-bold">Standalone Concept</SelectItem>
                                        {problems.map((p) => (
                                            <SelectItem key={p.id} value={p.id} className="focus:bg-white focus:text-black cursor-pointer rounded-none my-1 font-mono text-xs">
                                                {p.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest">
                                {mode === "idea" ? "The Solution" : "Context & Impact"}
                            </Label>
                            <Textarea
                                id="description"
                                placeholder={mode === "idea" ? "Describe your brilliant execution plan..." : "Why is this a priority? Who does it affect?"}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                className="min-h-[160px] bg-transparent border border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 p-4 text-sm font-mono resize-none transition-colors placeholder:text-zinc-700"
                            />
                        </div>

                        {mode === "idea" && (
                            <div className="space-y-2">
                                <Label htmlFor="githubUrl" className="text-zinc-400 font-mono font-bold text-[9px] uppercase tracking-widest flex items-center">
                                    <Github className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                    Repository (Optional)
                                </Label>
                                <Input
                                    id="githubUrl"
                                    placeholder="https://github.com/organization/repository"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    className="h-12 bg-transparent border-white/10 text-white rounded-none focus-visible:border-white focus-visible:ring-0 px-4 text-sm font-mono transition-colors placeholder:text-zinc-700"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-white/10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-white rounded-none px-6 h-12 font-mono uppercase tracking-widest text-[10px] font-bold bg-transparent border border-white/10 hover:bg-white/5"
                        >
                            Back
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-white text-black hover:bg-black hover:text-white border border-white rounded-none px-8 h-12 font-mono uppercase tracking-widest text-[10px] font-bold transition-all"
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
