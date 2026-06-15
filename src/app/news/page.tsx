"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";

interface NewsItem {
    title: string;
    pubDate: string;
    link: string;
    guid: string;
    author: string;
    thumbnail: string;
    description: string;
}

export default function AINewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/category/artificial-intelligence/feed/");
                const data = await res.json();
                if (data.status === "ok") {
                    setNews(data.items);
                }
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <div className="flex-1 min-h-screen bg-background nothing-grid w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[350px] pointer-events-none z-0 nothing-radial-glow opacity-30" />

            <main className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-36 pb-32">
                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-blue-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Feed · TechCrunch AI</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-dot tracking-tight text-foreground leading-[1.05]">
                        AI Ecosystem{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                            News
                        </span>
                    </h1>
                    <p className="text-lg text-muted-foreground mt-5 max-w-2xl leading-relaxed">
                        Stay updated with the latest breakthroughs and shifts in the artificial intelligence landscape.
                    </p>
                </div>

                {/* News Grid */}
                {loading ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
                        {news.map((item, i) => (
                            <a
                                key={item.guid}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group flex flex-col p-7 bg-card hover:bg-card/80 transition-colors h-full ${
                                    i === 0 ? "md:col-span-2 border-b border-border" : ""
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.pubDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                    </span>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                                <h3 className={`font-bold font-dot tracking-tight text-foreground group-hover:text-blue-400 transition-colors leading-snug mb-3 ${i === 0 ? "text-2xl md:text-3xl" : "text-lg"}`}>
                                    {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                                    {stripHtml(item.description)}
                                </p>
                                {i === 0 && (
                                    <span className="mt-5 text-sm font-medium text-blue-400 inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                                        Read full story <ArrowUpRight className="w-3.5 h-3.5" />
                                    </span>
                                )}
                            </a>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
