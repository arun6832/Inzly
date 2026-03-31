import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
    <html lang="en" className="antialiased dark hide-scrollbar">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#050507] text-zinc-100 selection:bg-indigo-500/30 hide-scrollbar`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full relative flex flex-col">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
