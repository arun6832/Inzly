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
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#0B0B0F]">
                <h2 className="text-xl font-medium text-white mb-6">Authentication required to post an idea.</h2>
                <Link href="/login">
                    <Button className="bg-white text-black hover:bg-zinc-200">Log In</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !idea || !category) {
            setError("All fields are required.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        if (containsSpam(title) || containsSpam(idea)) {
            setError("Content flagged by filter. Please refine your phrasing.");
            setIsSubmitting(false);
            return;
        }

        try {
            await addDoc(collection(db, "ideas"), {
                title,
                idea,
                category,
                githubUrl: githubUrl.trim() || null,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            router.push("/");
        } catch (err) {
            const error = err as Error;
            setError(error.message || "Failed to post concept.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 py-8 min-h-screen overflow-x-hidden bg-[#050507]">
            <div className="w-full max-w-2xl space-y-8 bg-[#0a0a0c] p-8 sm:p-10 rounded-[24px] border border-white/[0.04] shadow-2xl relative">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-light tracking-tight text-white mb-2">Publish Idea</h2>
                    <p className="text-sm text-zinc-500 font-medium">Define your vision and share it with the network.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-zinc-400 font-medium ml-1 text-xs uppercase tracking-wider">Concept Title</Label>
                            <Input
                                id="title"
                                placeholder="Refined Platform Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-zinc-700 px-4 text-base transition-all"
                                maxLength={80}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-zinc-400 font-medium ml-1 text-xs uppercase tracking-wider">Sector</Label>
                                <Select value={category} onValueChange={(val) => setCategory(val || "")} required>
                                    <SelectTrigger className="w-full h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-zinc-700 px-4 text-base transition-all">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="idea" className="text-zinc-400 font-medium ml-1 text-xs uppercase tracking-wider">The Idea</Label>
                            <Textarea
                                id="idea"
                                placeholder="Describe your brilliant idea..."
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                required
                                className="min-h-[160px] bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-zinc-700 p-4 text-base resize-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="githubUrl" className="text-zinc-400 font-medium ml-1 flex items-center text-xs uppercase tracking-wider">
                                <Github className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                                Repository (Optional)
                            </Label>
                            <Input
                                id="githubUrl"
                                placeholder="https://github.com/organization/repository"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="h-14 bg-white/[0.02] border-white/[0.05] text-white rounded-xl focus-visible:ring-zinc-700 px-4 text-base transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 mt-4 border-t border-white/[0.02]">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-white rounded-xl px-6 h-12"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-white text-black hover:bg-zinc-200 rounded-xl px-8 h-12 font-medium transition-transform" disabled={isSubmitting}>
                            {isSubmitting ? "Committing..." : "Publish Idea"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

