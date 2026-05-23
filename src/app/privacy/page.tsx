import { Shield } from "lucide-react";

const sections = [
    {
        id: "01",
        title: "Information We Collect",
        body: "We collect information you provide directly to us when creating an account, submitting an idea, or interacting with other founders on the platform. This includes your name, email address, and the creative content you publish.",
    },
    {
        id: "02",
        title: "Intellectual Property & Ideas",
        body: "Ideas posted on the public feed are visible to authenticated users. While we curate our community, we cannot guarantee strict confidentiality of public posts. We recommend sharing the vision and problem statement rather than proprietary code or deeply guarded trade secrets until you match with a trusted co-founder.",
    },
    {
        id: "03",
        title: "How We Use Your Information",
        body: "We use the information collected to operate and improve our platform, match you with relevant ideas and potential co-founders, and personalize your ecosystem experience. We do not sell your personal data to third-party data brokers.",
    },
    {
        id: "04",
        title: "Data Security",
        body: "We implement commercially reasonable security measures to protect your account data. Your authentication is securely managed via standard encryption protocols. We regularly review our practices to ensure your data remains protected.",
    },
    {
        id: "05",
        title: "Your Rights",
        body: "You have the right to access, update, or delete your personal information at any time. You may also request a copy of the data we hold about you. To exercise any of these rights, contact us through the platform's support channel.",
    },
];

export default function PrivacyPage() {
    return (
        <div className="flex-1 min-h-screen bg-background nothing-grid w-full">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[300px] pointer-events-none z-0 nothing-radial-glow opacity-30" />

            <main className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-36 pb-32">
                {/* Header */}
                <div className="mb-16 pb-10 border-b border-border">
                    <div className="flex items-center gap-2 mb-6">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Legal</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black font-dot tracking-tight text-foreground leading-[1.05] mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
                </div>

                {/* Intro */}
                <p className="text-lg text-muted-foreground leading-relaxed mb-16">
                    At Inzly, we respect your privacy and are committed to protecting the personal information you share with us. This policy outlines our practices regarding data collection, use, and protection within our idea discovery ecosystem.
                </p>

                {/* Sections */}
                <div className="space-y-0">
                    {sections.map((s, i) => (
                        <div
                            key={s.id}
                            className={`py-10 ${i < sections.length - 1 ? "border-b border-border" : ""}`}
                        >
                            <div className="flex gap-8 md:gap-12">
                                <span className="text-xs font-mono text-muted-foreground/40 pt-1 shrink-0 w-8">{s.id}</span>
                                <div className="space-y-3">
                                    <h3 className="text-base font-bold font-dot tracking-tight text-foreground">
                                        {s.title}
                                    </h3>
                                    <p className="text-base text-muted-foreground leading-relaxed">
                                        {s.body}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground/50 mt-16 pt-8 border-t border-border">
                    By using Inzly, you agree to the terms outlined in this Privacy Policy. For questions, contact us through the platform.
                </p>
            </main>
        </div>
    );
}
