import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full bg-[#050507] border-t border-white/[0.04] pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center space-x-3 group w-fit">
                            <img src="/images/inzly-logo.png" alt="Inzly" className="w-8 h-8 rounded-lg object-cover" />
                            <span className="text-xl font-black tracking-tight text-white">
                                inzly
                            </span>
                        </Link>
                        <p className="text-zinc-500 max-w-sm leading-relaxed">
                            The organic sanctuary where visionary founders plant concepts, collect deep feedback, and discover technical co-founders.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-medium mb-6 tracking-wide">Ecosystem</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/about" className="text-zinc-500 hover:text-indigo-400 transition-colors">Why Inzly</Link>
                            </li>
                            <li>
                                <Link href="/careers" className="text-zinc-500 hover:text-indigo-400 transition-colors">Work With Us</Link>
                            </li>
                            <li>
                                <Link href="/news" className="text-zinc-500 hover:text-indigo-400 transition-colors">AI & Ecosystem News</Link>
                            </li>
                            <li>
                                <Link href="/leaderboard" className="text-zinc-500 hover:text-indigo-400 transition-colors">Leaderboard</Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-medium mb-6 tracking-wide">Legal</h4>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/privacy" className="text-zinc-500 hover:text-indigo-400 transition-colors">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link href="#" className="text-zinc-500 hover:text-indigo-400 transition-colors">Terms of Service</Link>
                            </li>
                            <li>
                                <Link href="#" className="text-zinc-500 hover:text-indigo-400 transition-colors">Cookie Settings</Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-zinc-600 text-sm">
                        &copy; {new Date().getFullYear()} Inzly Platform. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <span className="text-zinc-600 hover:text-white cursor-not-allowed">Twitter</span>
                        <span className="text-zinc-600 hover:text-white cursor-not-allowed">LinkedIn</span>
                        <span className="text-zinc-600 hover:text-white cursor-not-allowed">Discord</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
