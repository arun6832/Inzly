
import Link from "next/link";

interface FooterProps {
  variant?: "full" | "minimal";
}

const TwitterIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
    </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.006 14.006 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.23 10.23 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
    </svg>
);

export default function Footer({ variant = "minimal" }: FooterProps) {
    if (variant === "minimal") {
        return (
            <footer className="w-full py-12 border-t border-white/[0.04] bg-transparent overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    {/* Primary Links */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-10 gap-y-3">
                        <Link href="/about" className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Why Inzly</Link>
                        <Link href="/careers" className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Work With Us</Link>
                        <Link href="/news" className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">News</Link>
                        <Link href="/leaderboard" className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Leaderboard</Link>
                        <Link href="/privacy" className="text-[10px] font-bold text-zinc-500 hover:text-indigo-400 uppercase tracking-[0.2em] transition-colors">Privacy</Link>
                    </div>

                    {/* Social Logos */}
                    <div className="flex items-center space-x-8">
                        <Link href="https://twitter.com" target="_blank" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                            <TwitterIcon className="w-4 h-4" />
                        </Link>
                        <Link href="https://instagram.com" target="_blank" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                            <InstagramIcon className="w-4 h-4" />
                        </Link>
                        <Link href="https://linkedin.com" target="_blank" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                            <LinkedinIcon className="w-4 h-4" />
                        </Link>
                        <Link href="https://discord.com" target="_blank" className="text-zinc-600 hover:text-white transition-all hover:scale-110">
                            <DiscordIcon className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest opacity-50">
                        &copy; {new Date().getFullYear()} INZLY Platform
                    </div>
                </div>
            </footer>
        );
    }

    return <Footer variant="minimal" />;
}
