"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { containsSpam } from "@/lib/filter";
import { Github } from "@/components/icons";

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

    const [title, setTitle] = useState("");
    const [problem, setProblem] = useState("");
    const [idea, setIdea] = useState("");
    const [category, setCategory] = useState("");
    const [githubUrl, setGithubUrl] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (loading) {
        return <div className="flex-1 flex justify-center items-center">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-white mb-4">You must be logged in to post an idea.</h2>
                <Link href="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Log In</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !problem || !idea || !category) {
            setError("All fields are required.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        if (containsSpam(title) || containsSpam(problem) || containsSpam(idea)) {
            setError("Please rephrase your text. It triggered our spam/profanity filter.");
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, "ideas"), {
                title,
                problem,
                idea,
                category,
                githubUrl: githubUrl.trim() || null,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            router.push("/");
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to post idea.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-8 min-h-screen overflow-x-hidden bg-[#0B0B0F]">
            <div className="w-full max-w-2xl space-y-8 bg-[#121218] p-8 sm:p-10 rounded-[32px] border border-white/[0.04] shadow-2xl relative">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Post a New Idea</h2>
                    <p className="text-sm text-zinc-400">Share your startup idea and get thoughtful feedback.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-zinc-300 font-medium ml-1">Idea Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g. A Tinder for Startup Ideas"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-14 bg-white/[0.03] border-white/5 text-white rounded-2xl focus-visible:ring-purple-500 px-4 text-base"
                                maxLength={80}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-zinc-300 font-medium ml-1">Category</Label>
                            <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
                                <SelectTrigger className="w-full h-14 bg-white/[0.03] border-white/5 text-white rounded-2xl focus-visible:ring-purple-500 px-4 text-base">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#121218] border-white/5 text-white rounded-2xl">
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="focus:bg-white/10 focus:text-white cursor-pointer rounded-xl my-1">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="problem" className="text-zinc-300 font-medium ml-1">The Problem (Why is this needed?)</Label>
                            <Textarea
                                id="problem"
                                placeholder="Describe the problem users are facing..."
                                value={problem}
                                onChange={(e) => setProblem(e.target.value)}
                                required
                                className="min-h-[120px] bg-white/[0.03] border-white/5 text-white rounded-2xl focus-visible:ring-purple-500 p-4 text-base resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="idea" className="text-zinc-300 font-medium ml-1">The Solution / Idea</Label>
                            <Textarea
                                id="idea"
                                placeholder="Describe your solution in detail..."
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                required
                                className="min-h-[160px] bg-white/[0.03] border-white/5 text-white rounded-2xl focus-visible:ring-purple-500 p-4 text-base resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="githubUrl" className="text-zinc-300 font-medium ml-1 flex items-center">
                                <Github className="w-4 h-4 mr-2 text-zinc-500" />
                                GitHub Repository (Optional)
                            </Label>
                            <Input
                                id="githubUrl"
                                placeholder="https://github.com/your-username/your-repo"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="h-14 bg-white/[0.03] border-white/5 text-white rounded-2xl focus-visible:ring-purple-500 px-4 text-base"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-white/5">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.push("/")}
                            className="text-zinc-400 hover:text-white rounded-full px-6 h-12"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 rounded-full px-8 h-12 font-bold shadow-[0_4px_20px_rgb(168,85,247,0.3)] transition-transform hover:scale-105" disabled={isSubmitting}>
                            {isSubmitting ? "Posting..." : "Post Idea"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
