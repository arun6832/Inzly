"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

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
                // Free public RSS to JSON converter fetching live AI news from TechCrunch
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
        <div className="min-h-screen bg-[#050507] text-zinc-100 flex flex-col relative w-full pt-32">
            {/* Background Orbs */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1400px] pointer-events-none z-0 opacity-40">
                <div className="absolute top-[10%] right-[20%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1)_0%,transparent_70%)]"></div>
            </div>

            <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-32 relative z-10">
                <div className="space-y-12">
                    <header className="space-y-6">
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md text-sm font-medium text-purple-200/80">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
                            Live Feed
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                            AI Ecosystem <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-light italic pr-2">News</span>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
                            Stay updated with the latest breakthroughs and shifts in the artificial intelligence landscape.
                        </p>
                    </header>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {news.map((item) => (
                                <a 
                                    key={item.guid} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group flex flex-col p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 h-full"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <span className="text-xs font-medium text-purple-400/80 bg-purple-400/10 px-2 py-1 rounded-md">TechCrunch AI</span>
                                            <span className="text-xs text-zinc-500">{new Date(item.pubDate).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                                            {stripHtml(item.description)}
                                        </p>
                                    </div>
                                    <div className="mt-6 flex items-center text-sm font-medium text-zinc-500 group-hover:text-white transition-colors">
                                        Read Full Story <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
