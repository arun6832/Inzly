import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Inzly | Idea Discovery",
  description: "A premium platform for thoughtful idea discovery and discussion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased dark hide-scrollbar" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-foreground selection:bg-white/15 selection:text-white hide-scrollbar nothing-grid relative" suppressHydrationWarning>
        {/* Ambient Top Glow Pattern */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none z-0 nothing-radial-glow opacity-60" />
        
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full relative flex flex-col z-10">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

